import { supabase } from "./supabase";

export interface GenerateRequest {
  topic: string;
  duration: 30 | 60;
  voice: string;
  background: string;
  subtitlePreset?: string;
  wordEffectMode?: WordEffectMode;
  subtitleSize?: SubtitleSize;
  subtitleColors?: SubtitleColorOverrides;
  variations?: number;
}

export type WordEffectMode =
  | "keep_color_only"
  | "scale_pop"
  | "glow"
  | "box"
  | "combo";

export type SubtitleSize = "small" | "medium" | "large";

export interface SubtitleColorOverrides {
  text?: string;
  active?: string;
  outline?: string;
  box?: string;
}

export interface GenerateResponse {
  jobId: string;
  videoUrl: string;
  script: string;
}

type JobStatus =
  | "pending"
  | "generating_script"
  | "generating_voice"
  | "fitting_audio"
  | "building_subtitles"
  | "assembling_video"
  | "uploading"
  | "completed"
  | "failed";

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Queued...",
  generating_script: "Generating script with AI...",
  generating_voice: "Creating voiceover...",
  fitting_audio: "Fitting audio to exact duration...",
  building_subtitles: "Building subtitles...",
  assembling_video: "Assembling video...",
  uploading: "Uploading to cloud...",
  completed: "Done!",
  failed: "Failed",
};

export interface BulkProgress {
  completed: number;
  total: number;
  step: string;
}

function isWordEffectModeSchemaCacheError(message?: string): boolean {
  if (!message) return false;
  return message.includes("word_effect_mode") && message.includes("schema cache");
}

function isSubtitleSizeSchemaCacheError(message?: string): boolean {
  if (!message) return false;
  return message.includes("subtitle_size") && message.includes("schema cache");
}

function isSubtitleColorSchemaCacheError(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes("schema cache") &&
    (
      message.includes("subtitle_color_text") ||
      message.includes("subtitle_color_active") ||
      message.includes("subtitle_color_outline") ||
      message.includes("subtitle_color_box")
    )
  );
}

export async function generateVideo(
  req: GenerateRequest,
  onProgress?: (step: string) => void,
  onBulkProgress?: (progress: BulkProgress) => void,
  onVariationComplete?: (result: GenerateResponse) => void,
  onJobsCreated?: (jobIds: string[]) => void,
): Promise<GenerateResponse[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const topic = req.topic.trim().slice(0, 500);
  if (!topic) throw new Error("Topic is required");
  if (![30, 60].includes(req.duration)) throw new Error("Invalid duration");
  if (!req.voice) throw new Error("Voice is required");
  if (!req.background) throw new Error("Background is required");

  const count = Math.max(1, Math.min(6, req.variations || 1));

  const rows = Array.from({ length: count }, () => ({
    user_id: user.id,
    topic,
    duration: req.duration,
    voice: req.voice,
    background: req.background,
    subtitle_preset: req.subtitlePreset || "classic",
    word_effect_mode: req.wordEffectMode || "combo",
    subtitle_size: req.subtitleSize || "medium",
    subtitle_color_text: req.subtitleColors?.text || null,
    subtitle_color_active: req.subtitleColors?.active || null,
    subtitle_color_outline: req.subtitleColors?.outline || null,
    subtitle_color_box: req.subtitleColors?.box || null,
    status: "pending" as const,
  }));

  const { data: jobs, error: insertError } = await supabase
    .from("jobs")
    .insert(rows)
    .select();

  let finalJobs = jobs;
  let finalError = insertError;
  if (insertError && isWordEffectModeSchemaCacheError(insertError.message)) {
    // Backward-compatible retry while DB migration rolls out.
    const fallbackRows = rows.map(({ word_effect_mode: _ignored, ...row }) => row);
    const retry = await supabase.from("jobs").insert(fallbackRows).select();
    finalJobs = retry.data;
    finalError = retry.error;
  }
  if (finalError && isSubtitleSizeSchemaCacheError(finalError.message)) {
    // Backward-compatible retry while DB migration rolls out.
    const fallbackRows = rows.map(({ subtitle_size: _ignored, ...row }) => row);
    const retry = await supabase.from("jobs").insert(fallbackRows).select();
    finalJobs = retry.data;
    finalError = retry.error;
  }
  if (finalError && isSubtitleColorSchemaCacheError(finalError.message)) {
    // Backward-compatible retry while DB migration rolls out.
    const fallbackRows = rows.map(({
      subtitle_color_text: _t,
      subtitle_color_active: _a,
      subtitle_color_outline: _o,
      subtitle_color_box: _b,
      ...row
    }) => row);
    const retry = await supabase.from("jobs").insert(fallbackRows).select();
    finalJobs = retry.data;
    finalError = retry.error;
  }

  if (finalError || !finalJobs || finalJobs.length === 0) {
    throw new Error(finalError?.message || "Failed to create jobs");
  }

  const jobIds = finalJobs.map((j) => j.id as string);
  if (onJobsCreated) onJobsCreated(jobIds);
  if (onProgress) onProgress(STATUS_LABELS.pending);

  return new Promise<GenerateResponse[]>((resolve, reject) => {
    let settled = false;
    const results = new Map<string, GenerateResponse>();
    const statuses = new Map<string, JobStatus>();
    const channels: ReturnType<typeof supabase.channel>[] = [];

    function cleanup() {
      channels.forEach((ch) => supabase.removeChannel(ch));
    }

    function broadcastProgress() {
      if (settled) return;

      let furthestStatus: JobStatus = "pending";
      for (const s of statuses.values()) {
        const order: JobStatus[] = [
          "pending", "generating_script", "generating_voice",
          "fitting_audio", "building_subtitles", "assembling_video",
          "uploading", "completed",
        ];
        if (order.indexOf(s) > order.indexOf(furthestStatus)) {
          furthestStatus = s;
        }
      }

      if (onProgress) {
        onProgress(STATUS_LABELS[furthestStatus] || furthestStatus);
      }
      if (onBulkProgress) {
        onBulkProgress({
          completed: results.size,
          total: jobIds.length,
          step: STATUS_LABELS[furthestStatus] || furthestStatus,
        });
      }
    }

    for (const jobId of jobIds) {
      statuses.set(jobId, "pending");

      const channel = supabase
        .channel(`job-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            if (settled) return;
            const updated = payload.new as Record<string, unknown>;
            const status = updated.status as JobStatus;
            statuses.set(jobId, status);

            if (status === "completed") {
              const result: GenerateResponse = {
                jobId,
                videoUrl: updated.video_url as string,
                script: updated.script as string,
              };
              results.set(jobId, result);
              onVariationComplete?.(result);

              if (results.size === jobIds.length) {
                settled = true;
                cleanup();
                resolve(jobIds.map((id) => results.get(id)!));
                return;
              }
            }

            if (status === "failed") {
              settled = true;
              cleanup();
              reject(new Error((updated.error as string) || "Video generation failed"));
              return;
            }

            broadcastProgress();
          }
        )
        .subscribe();

      channels.push(channel);
    }

    const timeoutMs = count * 10 * 60 * 1000;
    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("Generation timed out. Check your jobs page for status."));
      }
    }, timeoutMs);
  });
}

export interface JobRecord {
  id: string;
  status: string;
  topic: string;
  duration: number;
  voice: string;
  background: string;
  subtitle_preset: string;
  word_effect_mode: WordEffectMode;
  subtitle_size: SubtitleSize;
  subtitle_color_text: string | null;
  subtitle_color_active: string | null;
  subtitle_color_outline: string | null;
  subtitle_color_box: string | null;
  script: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  audio_url: string | null;
  subtitles_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserJobs(): Promise<JobRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as JobRecord[];
}

/** Fresh signed URLs for job thumbnails, in one batch — the stored
 *  thumbnail_url links expire after 7 days. */
export async function getFreshThumbnails(jobIds: string[]): Promise<Record<string, string>> {
  if (jobIds.length === 0) return {};
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    const res = await fetch(`${BACKEND_URL}/api/signed-thumbs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jobIds }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.urls || {};
  } catch {
    return {};
  }
}

export async function getSignedVideoUrl(jobId: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    const base = BACKEND_URL || "";
    const res = await fetch(`${base}/api/signed-url/${encodeURIComponent(jobId)}/video.mp4`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

export interface CategoryInfo {
  name: string;
  clips30: number;
  clips60: number;
}

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

/** On-demand voice preview: the backend synthesizes (and caches) a short
 *  sample for any catalog voice and returns its URL. */
export async function getVoiceDemoUrl(voice: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/voice-demo?voice=${encodeURIComponent(voice)}`);
  if (!res.ok) throw new Error("Voice demo failed");
  const data = await res.json();
  if (!data?.url) throw new Error("Voice demo URL missing");
  return data.url;
}

export interface GuestJobStatus {
  id: string;
  status: string;
  error: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  script: string | null;
}

export async function guestGenerate(
  topic: string,
  voice: string,
  background: string,
  onDone: (job: GuestJobStatus) => void,
  onError: (msg: string) => void,
  subtitlePreset: string = "classic",
  wordEffectMode: WordEffectMode = "combo",
): Promise<string> {
  const payload = {
    user_id: null,
    topic: topic.trim().slice(0, 500),
    duration: 30,
    voice,
    background,
    subtitle_preset: subtitlePreset,
    word_effect_mode: wordEffectMode,
    status: "pending",
    is_guest: true,
  };

  const { data: job, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select()
    .single();

  let finalJob = job;
  let finalError = error;
  if (error && isWordEffectModeSchemaCacheError(error.message)) {
    const { word_effect_mode: _ignored, ...fallbackPayload } = payload;
    const retry = await supabase
      .from("jobs")
      .insert(fallbackPayload)
      .select()
      .single();
    finalJob = retry.data;
    finalError = retry.error;
  }

  if (finalError || !finalJob) throw new Error(finalError?.message || "Failed to create job");

  const jobId = finalJob.id as string;

  const channel = supabase
    .channel(`guest-job-${jobId}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "jobs",
      filter: `id=eq.${jobId}`,
    }, (payload) => {
      const updated = payload.new as GuestJobStatus;
      if (updated.status === "completed" || updated.status === "failed") {
        supabase.removeChannel(channel);
        if (updated.status === "completed") {
          onDone(updated);
        } else {
          onError(updated.error || "Generation failed");
        }
      }
    })
    .subscribe();

  return jobId;
}

export interface DemoVideo {
  id: string;
  topic: string;
  voice: string;
  thumbnail_url: string | null;
  video_url: string | null;
}

/** Prefer DB-stored URLs so thumbnails/videos load without reaching the API server (e.g. Vercel → DB only). */
export function demoThumbUrl(demo: DemoVideo): string {
  if (demo.thumbnail_url) return demo.thumbnail_url;
  if (BACKEND_URL) return `${BACKEND_URL}/api/demo/media/${demo.id}/thumb`;
  return "";
}

export function demoVideoUrl(demo: DemoVideo): string {
  if (demo.video_url) return demo.video_url;
  if (BACKEND_URL) return `${BACKEND_URL}/api/demo/media/${demo.id}/video`;
  return "";
}

export async function getDemoVideos(): Promise<DemoVideo[]> {
  const { data } = await supabase
    .from("jobs")
    .select("id, topic, voice, thumbnail_url, video_url")
    .eq("status", "completed")
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return (data || []) as DemoVideo[];
}

export async function getCategories(): Promise<CategoryInfo[]> {
  // Try the backend first (freshest data, LAN/dev only)...
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/youtube/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories;
        }
      }
    } catch {
      // fall through to Supabase
    }
  }
  // ...then Supabase — the worker publishes the list to app_settings, so the
  // deployed frontend gets real categories even without reaching the backend.
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "background_categories")
      .single();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed)) return parsed as CategoryInfo[];
    }
  } catch {
    // ignore
  }
  return [];
}

export interface QueuePosition {
  status: string;
  ahead: number;
  active: number;
  etaSeconds: number;
}

export async function getQueuePosition(jobId: string): Promise<QueuePosition | null> {
  if (!BACKEND_URL) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/queue/position?jobId=${encodeURIComponent(jobId)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface FakeTextMessage {
  side: "left" | "right";
  text: string;
}

export interface FakeTextGenerateRequest {
  scenario: string;
  tone: string;
  messageCount: number;
  myName: string;
  theirName: string;
  voiceLeft: string;
  voiceRight: string;
  accentColor?: string;
  platform?: string;
  background: string;
  duration: 30 | 60;
  messages?: FakeTextMessage[];
}

export interface FakeTextResult {
  jobId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  script: string | null;
}

/**
 * Create a fake-text video job and poll it to completion.
 * Polling (not realtime) so it works even when Supabase Realtime is down.
 */
export async function generateFakeTextVideo(
  req: FakeTextGenerateRequest,
  onProgress?: (step: string) => void,
): Promise<FakeTextResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    user_id: user.id,
    topic: (req.scenario || "Fake text conversation").trim().slice(0, 500),
    duration: req.duration,
    voice: req.voiceRight,
    background: req.background,
    status: "pending" as const,
    job_type: "faketext",
    payload: {
      scenario: req.scenario,
      tone: req.tone,
      messageCount: req.messageCount,
      myName: req.myName,
      theirName: req.theirName,
      voiceLeft: req.voiceLeft,
      voiceRight: req.voiceRight,
      accentColor: req.accentColor,
      platform: req.platform,
      ...(req.messages && req.messages.length >= 3 ? { messages: req.messages } : {}),
    },
  };

  const { data: job, error } = await supabase.from("jobs").insert(row).select().single();
  if (error) {
    if (error.message.includes("job_type") || error.message.includes("payload")) {
      throw new Error("Fake Text videos need a database update (migration 015). Ask the admin to apply it in Supabase.");
    }
    throw new Error(error.message);
  }
  const jobId = job.id as string;
  if (onProgress) onProgress(STATUS_LABELS.pending);

  const startedAt = Date.now();
  const TIMEOUT_MS = 10 * 60 * 1000;

  while (Date.now() - startedAt < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 2500));
    const { data: j } = await supabase
      .from("jobs")
      .select("status, error, video_url, thumbnail_url, script")
      .eq("id", jobId)
      .single();
    if (!j) continue;
    if (j.status === "completed") {
      return { jobId, videoUrl: j.video_url as string, thumbnailUrl: j.thumbnail_url, script: j.script };
    }
    if (j.status === "failed") {
      throw new Error(j.error || "Generation failed");
    }
    if (onProgress) onProgress(STATUS_LABELS[j.status as JobStatus] || j.status);
  }
  throw new Error("Generation timed out. Check your jobs page.");
}

export async function generateFakeTextConversation(params: {
  scenario: string;
  tone: string;
  messageCount: number;
  myName: string;
  theirName: string;
}): Promise<FakeTextMessage[]> {
  if (!BACKEND_URL) throw new Error("Backend not reachable from this deployment yet.");
  const res = await fetch(`${BACKEND_URL}/api/faketext/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Conversation generation failed");
  return data.messages as FakeTextMessage[];
}

export interface YouTubeDownloadRequest {
  url: string;
  category: string;
  duration: 30 | 60;
  clips: number;
}

// ---- Stripe ----

export async function createStripeCheckout(plan: "starter" | "growth" | "creator"): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ plan }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(err.error || "Checkout failed");
  }

  const data = await res.json();
  return data.url;
}

export async function createStripePortal(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/stripe/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Portal failed" }));
    throw new Error(err.error || "Portal failed");
  }

  const data = await res.json();
  return data.url;
}

// ---- Profile ----

export interface UserProfile {
  id: string;
  tier: string;
  is_admin: boolean;
  daily_videos_used: number;
  daily_videos_reset_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("app_settings").select("*");
  if (error) return {};

  const settings: Record<string, string> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

// ---- Admin settings ----

export async function getAdminSettings(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
    headers: { "Authorization": `Bearer ${session.access_token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch settings");
  const data = await res.json();
  return data.settings || {};
}

export async function updateAdminSettings(settings: Record<string, string>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ settings }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Update failed" }));
    throw new Error(err.error || "Update failed");
  }
}

// ---- Source Videos ----

export interface SourceClip {
  id: string;
  clip_duration: number;
  filename: string;
  start_time: number | null;
  times_used: number;
  created_at: string;
}

export interface SourceVideo {
  id: string;
  youtube_url: string;
  youtube_id: string | null;
  title: string | null;
  category: string;
  source_path: string | null;
  duration_seconds: number | null;
  status: string;
  error: string | null;
  created_at: string;
  source_clips: SourceClip[];
}

export async function getSourceVideos(): Promise<SourceVideo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("source_videos")
    .select("*, source_clips(id, clip_duration, filename, start_time, times_used, created_at)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as SourceVideo[];
}

export interface ReprocessRequest {
  duration: 30 | 60;
  clips: number;
}

export async function reprocessSourceVideo(
  sourceId: string,
  req: ReprocessRequest,
  onProgress?: (step: string) => void
): Promise<{ count: number; files: string[] }> {
  if (!BACKEND_URL) throw new Error("Backend URL not configured");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/youtube/reprocess/${sourceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ duration: req.duration, clips: req.clips }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Reprocess failed" }));
    throw new Error(err.error || "Reprocess failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let lastResult: { count: number; files: string[] } | null = null;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.step && onProgress) onProgress(parsed.step);
        if (parsed.count !== undefined) lastResult = parsed;
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
      }
    }
  }

  if (lastResult) return lastResult;
  throw new Error("No result received");
}

// ---- YouTube Download ----

export async function downloadYouTubeBackground(
  req: YouTubeDownloadRequest,
  onProgress?: (step: string) => void
): Promise<{ count: number; files: string[] }> {
  if (!BACKEND_URL) throw new Error("Backend URL not configured. YouTube management requires VITE_BACKEND_URL when running locally.");
  if (!req.url.trim()) throw new Error("YouTube URL is required");
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(req.url)) {
    throw new Error("Invalid YouTube URL");
  }
  if (!req.category || !/^[a-z0-9-]+$/i.test(req.category)) {
    throw new Error("Invalid category name");
  }

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${BACKEND_URL}/api/youtube/download`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: req.url.trim(),
      category: req.category,
      duration: req.duration,
      clips: Math.max(1, Math.min(20, req.clips)),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error || "Download failed");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let lastResult: { count: number; files: string[] } | null = null;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.step && onProgress) onProgress(parsed.step);
        if (parsed.count !== undefined) lastResult = parsed;
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
      }
    }
  }

  if (lastResult) return lastResult;
  throw new Error("No result received");
}

export async function deleteSourceVideo(sourceId: string): Promise<void> {
  if (!BACKEND_URL) throw new Error("Backend URL not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/youtube/source/${sourceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Delete failed" }));
    throw new Error(err.error || "Delete failed");
  }
}

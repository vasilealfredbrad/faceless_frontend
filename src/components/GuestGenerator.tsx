import { useState, useEffect } from "react";
import { guestGenerate, getCategories, CategoryInfo } from "../lib/api";
import { supabase } from "../lib/supabase";
import {
  Wand2,
  Clock,
  Mic,
  MonitorPlay,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Circle,
  FileText,
  AudioLines,
  Subtitles,
  Film,
  Download,
  UserPlus,
} from "lucide-react";

const VOICES = [
  { group: "American Female", voices: ["Autumn", "Melody", "Hannah", "Emily", "Ivy", "Kaitlyn", "Luna", "Willow", "Lauren", "Sierra"] },
  { group: "American Male", voices: ["Noah", "Jasper", "Caleb", "Ronan", "Ethan", "Daniel", "Zane"] },
  { group: "Chinese Female", voices: ["Mei", "Lian", "Ting", "Jing"] },
  { group: "Chinese Male", voices: ["Wei", "Jian", "Hao", "Sheng"] },
  { group: "Spanish", voices: ["Lucía", "Mateo", "Javier"] },
  { group: "French Female", voices: ["Élodie"] },
  { group: "Hindi", voices: ["Ananya", "Priya", "Arjun", "Rohan"] },
  { group: "Italian", voices: ["Giulia", "Luca"] },
  { group: "Portuguese", voices: ["Camila", "Thiago", "Rafael"] },
];

const PIPELINE_STEPS = [
  { key: "script", label: "Generating Script", icon: FileText, match: "script" },
  { key: "voice", label: "Creating Voiceover", icon: AudioLines, match: "voiceover" },
  { key: "fit", label: "Fitting Audio", icon: AudioLines, match: "fitting" },
  { key: "subs", label: "Building Subtitles", icon: Subtitles, match: "subtitle" },
  { key: "video", label: "Assembling Video", icon: Film, match: "assembl" },
  { key: "upload", label: "Uploading", icon: Download, match: "upload" },
];

type JobStatus = "pending" | "generating_script" | "generating_voice" | "fitting_audio" | "building_subtitles" | "assembling_video" | "uploading" | "completed" | "failed";

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

function getActiveStep(progress: string): number {
  if (!progress) return -1;
  const lower = progress.toLowerCase();
  for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
    if (lower.includes(PIPELINE_STEPS[i].match)) return i;
  }
  return 0;
}

interface Props {
  onSignUp: () => void;
}

export default function GuestGenerator({ onSignUp }: Props) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState<30 | 60>(30);
  const [voice, setVoice] = useState("Noah");
  const [background, setBackground] = useState("minecraft");
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [guestCount, setGuestCount] = useState(() => {
    const stored = localStorage.getItem("guest_video_count");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [completedVideoUrl, setCompletedVideoUrl] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);

  const limitReached = guestCount >= 2;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const activeStep = getActiveStep(progress);

  async function handleGenerate() {
    if (limitReached) return;
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");
    setProgress("Queued...");
    setShowPipeline(true);
    setPipelineComplete(false);
    setCompletedVideoUrl(null);

    try {
      const result = await guestGenerate(
        { topic, duration, voice, background },
      );

      const jobId = result.jobId;

      await new Promise<void>((resolve, reject) => {
        const channel = supabase
          .channel(`guest-job-${jobId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "jobs",
              filter: `id=eq.${jobId}`,
            },
            (payload) => {
              const updated = payload.new as Record<string, unknown>;
              const status = updated.status as JobStatus;
              setProgress(STATUS_LABELS[status] || status);

              if (status === "completed") {
                setCompletedVideoUrl(updated.video_url as string);
                setPipelineComplete(true);
                const newCount = guestCount + 1;
                setGuestCount(newCount);
                localStorage.setItem("guest_video_count", String(newCount));
                supabase.removeChannel(channel);
                resolve();
              }

              if (status === "failed") {
                supabase.removeChannel(channel);
                reject(new Error((updated.error as string) || "Video generation failed"));
              }
            }
          )
          .subscribe();

        setTimeout(() => {
          supabase.removeChannel(channel);
          reject(new Error("Generation timed out. Please try again."));
        }, 10 * 60 * 1000);
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("Guest limit reached")) {
        setGuestCount(2);
        localStorage.setItem("guest_video_count", "2");
      }
      setError(err instanceof Error ? err.message : "Generation failed");
      setShowPipeline(false);
    } finally {
      setLoading(false);
    }
  }

  if (limitReached) {
    return (
      <div className="mt-12 max-w-lg mx-auto">
        <div className="rounded-2xl bg-surface-card border border-primary/20 p-8 text-center">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-white mb-2">
            You've used your 2 free videos
          </h3>
          <p className="text-white/40 text-sm mb-6">
            Sign up to get 5 free videos per day — no credit card needed.
          </p>
          <button
            onClick={onSignUp}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Free Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
          <Wand2 className="w-3.5 h-3.5" />
          Try {2 - guestCount} free video{2 - guestCount !== 1 ? "s" : ""} — no account needed
        </span>
      </div>

      <div className="rounded-2xl bg-surface-card border border-white/5 p-6 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <MessageSquare className="w-4 h-4" />
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. What's the best decision you've ever made?"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Clock className="w-4 h-4" />
              Duration
            </label>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {([30, 60] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  disabled={loading}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    duration === d
                      ? "bg-primary text-white"
                      : "bg-surface text-white/40 hover:text-white/60"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <MonitorPlay className="w-4 h-4" />
              Background
            </label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
            >
              {categories.length === 0 && <option value="minecraft">minecraft</option>}
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({duration === 30 ? cat.clips30 : cat.clips60} clips)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Mic className="w-4 h-4" />
            Voice
          </label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
          >
            {VOICES.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.voices.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              CREATE FREE VIDEO
            </>
          )}
        </button>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {showPipeline && (
        <div className="mt-4 rounded-2xl bg-surface-card border border-white/5 p-5 space-y-1">
          <span className="text-xs font-medium text-white/40 block mb-3">
            {pipelineComplete ? "Complete!" : "Pipeline Progress"}
          </span>

          <div className="relative">
            <div className="absolute left-[15px] top-[20px] bottom-[20px] w-[2px] bg-white/5" />
            {PIPELINE_STEPS.map((step, i) => {
              const isDone = pipelineComplete || activeStep > i;
              const isActive = !pipelineComplete && activeStep === i;

              return (
                <div key={step.key} className="relative flex items-center gap-4 py-2">
                  <div className="relative z-10 flex-shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-[30px] h-[30px] text-accent" />
                    ) : isActive ? (
                      <div className="w-[30px] h-[30px] rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    ) : (
                      <Circle className="w-[30px] h-[30px] text-white/10" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <step.icon className={`w-4 h-4 ${isDone ? "text-accent" : isActive ? "text-primary" : "text-white/20"}`} />
                    <span className={`text-sm font-medium ${isDone ? "text-accent" : isActive ? "text-white" : "text-white/25"}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
              style={{ width: `${pipelineComplete ? 100 : Math.max(5, ((activeStep + 1) / PIPELINE_STEPS.length) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {completedVideoUrl && (
        <div className="mt-4 rounded-2xl bg-surface-card border border-accent/20 p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-3" />
          <p className="text-white font-semibold mb-3">Your video is ready!</p>
          <a
            href={completedVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent/15 hover:bg-accent/25 text-accent font-semibold rounded-xl transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}

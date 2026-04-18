import { useState, useEffect, useRef } from "react";
import { guestGenerate, getDemoVideos, GuestJobStatus, DemoVideo, demoThumbUrl, demoVideoUrl, WordEffectMode } from "../lib/api";
import { supabase } from "../lib/supabase";
import {
  Wand2,
  Play,
  Loader2,
  CheckCircle2,
  Circle,
  FileText,
  AudioLines,
  Subtitles,
  Film,
  Download,
  ChevronLeft,
  ChevronRight,
  Mic,
  Square,
  Zap,
  Type,
} from "lucide-react";
import VOICE_DEMO_FILES from "../lib/voice-demos";
import { containsProfanity } from "../lib/profanity";

const VOICES = [
  { group: "American Female", voices: ["Autumn", "Melody", "Hannah", "Emily", "Ivy", "Kaitlyn", "Luna", "Willow", "Lauren", "Sierra"] },
  { group: "American Male", voices: ["Noah", "Jasper", "Caleb", "Ronan", "Ethan", "Daniel", "Zane"] },
];

const SUBTITLE_PRESETS = [
  { key: "classic", label: "Classic" },
  { key: "bold-pop", label: "Bold Pop" },
  { key: "clean", label: "Clean" },
  { key: "neon", label: "Neon" },
  { key: "typewriter", label: "Typewriter" },
  { key: "impact", label: "Impact" },
];

const WORD_EFFECT_MODES: { key: WordEffectMode; label: string }[] = [
  { key: "keep_color_only", label: "Color Only" },
  { key: "scale_pop", label: "Pop" },
  { key: "glow", label: "Glow" },
  { key: "box", label: "Box" },
  { key: "combo", label: "Combo" },
];

const PIPELINE_STEPS = [
  { key: "script", label: "Generating Script", icon: FileText, match: "script" },
  { key: "voice", label: "Creating Voiceover", icon: AudioLines, match: "voiceover" },
  { key: "fit", label: "Fitting Audio", icon: AudioLines, match: "fitting" },
  { key: "subs", label: "Building Subtitles", icon: Subtitles, match: "subtitle" },
  { key: "video", label: "Assembling Video", icon: Film, match: "assembl" },
  { key: "upload", label: "Uploading", icon: Download, match: "upload" },
];

/** Curated full prompts: strong hooks + one clear angle — works well with 30s voiceover + subtitles + our pipeline */
const LUCKY_TOPIC_PROMPTS = [
  "Stop scrolling if you still procrastinate the same three tasks every week. Here is the two-minute rule that actually rewired how I start hard work.",
  "They say motivation is a myth. I tested discipline for thirty days using one tiny morning habit — and my focus changed more than any app ever did.",
  "Nobody talks about this: your brain treats notifications like free dopamine. Here is what happened when I turned off alerts for one week.",
  "I used to think success was hustle until I burned out twice. The real shift was learning which battles are not worth winning.",
  "If you feel behind in life, watch this. Progress is not linear — here is the one graph that made me stop comparing myself to strangers online.",
  "Three signs you are not lazy, you are overstimulated. Number two surprised me and explained why I could not sit still with my own thoughts.",
  "What if your biggest problem is not time, but decision fatigue? Here is how I cut my daily choices in half without becoming boring.",
  "I read one hundred self-help summaries so you do not have to. These five ideas are the only ones I still use every single week.",
  "The comfort zone is not the enemy — the half-comfort zone is. Here is why almost succeeding hurts more than clearly failing.",
  "You do not need a new morning routine. You need one anchor habit that survives a bad night of sleep. Here is mine.",
  "Why do smart people still feel stuck? Because intelligence without direction is just noise. Here is how I picked one priority per day.",
  "Social media did not ruin my attention span — shallow goals did. Here is the question that brought my focus back in under a minute.",
  "I stopped saying yes to everything for thirty days. My income did not explode, but my stress finally dropped to a level I could think in.",
  "If you want people to listen, start with tension, not context. Here is a simple story structure that works for any short video.",
  "The real reason we fear starting is not failure — it is looking stupid for five seconds. Here is how I made peace with that five seconds.",
  "Money is not the goal, but stress about money kills creativity. Here are three small habits that stabilized my finances without a side hustle.",
  "Your past self is not your enemy. Here is how I forgave myself for wasted years without pretending they did not hurt.",
  "I thought discipline meant suffering. Then I learned discipline is just a promise you keep when nobody is watching.",
  "Confidence is not a personality trait — it is evidence. Here is how I stacked tiny wins until doubt got quieter.",
  "Why do we replay embarrassing moments at 3am? Here is what psychologists say — and one trick that actually helps me sleep.",
  "I quit comparing my chapter one to someone else's chapter twenty. Here is the reframe that stopped the spiral in real time.",
  "If you are always tired but you sleep enough, the problem might be emotional load, not caffeine. Here is what I checked first.",
  "You do not need more information. You need one loop: try, measure, adjust. Here is how I shortened that loop to one day.",
  "The hardest part of growth is not starting — it is staying consistent when results are invisible. Here is what I tracked instead.",
  "I stopped chasing perfect and started chasing repeatable. This is the difference between a hobby and a system.",
  "Your environment is louder than your goals. Here is one change to my phone that saved me hours without willpower.",
  "Why do we fear being ordinary? Maybe because we forget ordinary people still change their lives one boring choice at a time.",
  "I used to think rest was weakness. Then I learned recovery is where strength actually builds — not in the gym, not in the grind.",
  "If you want better relationships, start with boundaries that feel selfish at first. Here is why that is not selfish.",
  "The truth about success nobody sells: it is boring on most days. Excitement is optional; showing up is not.",
  "I stopped waiting to feel ready. Ready is a lie. Prepared is enough — here is what I do before I feel confident.",
  "Why your brain loves shortcuts — and how to use that without cheating your future self.",
  "Three questions I ask before I argue with anyone online. Question three saved me hours of pointless stress.",
  "I thought I needed more discipline. What I needed was fewer open loops — unfinished tasks draining my brain in the background.",
  "If you want to sound wise in thirty seconds, say less — but make the first sentence impossible to ignore.",
  "This is for anyone who feels like they are doing everything right but still stuck. Maybe you are optimizing the wrong goal.",
];

const DEMO_VIDEO_URL = "https://o9rpbl4iepdn10fr.public.blob.vercel-storage.com/homepage_test_video.mp4";

function DefaultDemoVideo() {
  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set muted once on mount — NOT in a ref callback (that reruns on every render)
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 1;

    const onLoadedMetadata = () => { if (video.paused) video.currentTime = 0.001; };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  function handleUnmute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    video.play().catch(() => {});
    setIsMuted(false);
  }

  function handleManualPlay() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 1;
    setIsMuted(true);
    video.play().catch(() => {});
  }

  return (
    <>
      {/*
        autoPlay + muted DOM property + playsInline = required trio for iOS Safari autoplay.
        autoPlay alone does nothing without muted; muted prop alone is broken in React.
      */}
      <video
        ref={videoRef}
        src={DEMO_VIDEO_URL}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        loop
        preload="auto"
      />
      {/* Muted autoplay → show big tap-for-sound overlay */}
      {playing && isMuted && (
        <button
          onClick={handleUnmute}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.63 3.63a1 1 0 000 1.41L7.29 8.7 7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91a1 1 0 00.76 1.85 8.964 8.964 0 002.66-1.61l1.06 1.06a1 1 0 001.41-1.41L5.05 3.63a1 1 0 00-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4a1 1 0 00-.66 1.88C17.01 6.54 19 9.13 19 12zm-7-8l-1.88 1.88L13 7.76V4.41c0-.89-1.08-1.34-1.71-.71zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full">
            Tap for sound
          </span>
        </button>
      )}
      {/* Playing with sound — small pause button bottom-right */}
      {playing && !isMuted && (
        <button
          onClick={() => videoRef.current?.pause()}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
      )}
      {/* Paused — play button overlay */}
      {!playing && (
        <button
          onClick={handleManualPlay}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/80 transition-colors">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      )}
    </>
  );
}

function pickRandomTopic(): string {
  return LUCKY_TOPIC_PROMPTS[Math.floor(Math.random() * LUCKY_TOPIC_PROMPTS.length)];
}

function getActiveStep(status: string): number {
  const lower = status.toLowerCase();
  for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
    if (lower.includes(PIPELINE_STEPS[i].match)) return i;
  }
  return 0;
}

interface GuestGeneratorProps {
  sectionRef?: React.RefObject<HTMLDivElement | null>;
}

export default function GuestGenerator({ sectionRef }: GuestGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [voice, setVoice] = useState("Caleb");
  const [subtitlePreset, setSubtitlePreset] = useState("classic");
  const [wordEffectMode, setWordEffectMode] = useState<WordEffectMode>("combo");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GuestJobStatus | null>(null);
  const [demos, setDemos] = useState<DemoVideo[]>([]);
  const [demoIdx, setDemoIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const genStartedAtRef = useRef<number | null>(null);
  const [liveElapsedSec, setLiveElapsedSec] = useState(0);
  const [finalElapsedSec, setFinalElapsedSec] = useState<number | null>(null);
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    getDemoVideos().then(setDemos).catch(() => {});
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  useEffect(() => {
    for (const [, url] of Object.entries(VOICE_DEMO_FILES)) {
      if (!audioCacheRef.current.has(url)) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audioCacheRef.current.set(url, audio);
      }
    }
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      for (const a of audioCacheRef.current.values()) a.pause();
      audioCacheRef.current.clear();
    };
  }, []);

  function handlePlayVoiceDemo(targetVoice?: string) {
    const demoVoice = targetVoice || voice;
    if (playingVoice === demoVoice && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setPlayingVoice(null);
      return;
    }

    const demoUrl = VOICE_DEMO_FILES[demoVoice];
    if (!demoUrl) return;

    if (previewAudioRef.current) previewAudioRef.current.pause();
    let audio = audioCacheRef.current.get(demoUrl);
    if (!audio) {
      audio = new Audio(demoUrl);
      audio.preload = "auto";
      audioCacheRef.current.set(demoUrl, audio);
    }
    previewAudioRef.current = audio;
    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => setPlayingVoice(null);
    audio.currentTime = 0;
    audio.play().then(() => setPlayingVoice(demoVoice)).catch(() => {});
  }

  const current = demos[demoIdx] ?? null;
  const thumbSrc = current ? demoThumbUrl(current) : "";

  useEffect(() => {
    setThumbFailed(false);
  }, [demoIdx, current?.id]);

  useEffect(() => {
    if (!loading) return;
    genStartedAtRef.current = Date.now();
    setFinalElapsedSec(null);
    setLiveElapsedSec(0);
    const id = window.setInterval(() => {
      const start = genStartedAtRef.current;
      if (start) setLiveElapsedSec((Date.now() - start) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!playing) return;
    const video = demoVideoRef.current;
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p) {
      p.then(() => {
        video.muted = false;
      }).catch(() => {});
    }
  }, [playing, demoIdx, current?.id]);

  const isResultShowing = !!(result && result.video_url);

  function formatElapsed(sec: number): string {
    if (sec < 60) return `${sec.toFixed(1)}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toFixed(0)}s`;
  }

  async function handleGenerate() {
    if (!topic.trim()) { setError("Please enter a topic"); return; }
    if (containsProfanity(topic)) { setError("Please remove inappropriate language from your topic."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    setStatus("pending");
    setPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPlayingVoice(null);

    try {
      const savedTopic = topic.trim();
      const jobId = await guestGenerate(
        topic,
        voice,
        "minecraft",
        (job) => {
          const start = genStartedAtRef.current;
          const totalSec = start ? (Date.now() - start) / 1000 : 0;
          setFinalElapsedSec(Math.round(totalSec * 10) / 10);
          setResult(job);
          setLoading(false);
          const newEntry: DemoVideo = { id: job.id, topic: savedTopic, voice, thumbnail_url: job.thumbnail_url, video_url: job.video_url };
          setDemos((prev) => [newEntry, ...prev]);
          setDemoIdx(0);
          setPlaying(true);
        },
        (msg) => { setError(msg); setLoading(false); },
        subtitlePreset,
        wordEffectMode,
      );
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = supabase
        .channel(`guest-status-${jobId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, (payload) => {
          const updated = payload.new as { status: string };
          setStatus(updated.status);
        })
        .subscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setLoading(false);
    }
  }

  function resetResult() {
    setResult(null);
    setTopic("");
    setStatus("");
    setError("");
    setPlaying(false);
    setFinalElapsedSec(null);
    setLiveElapsedSec(0);
    genStartedAtRef.current = null;
  }

  const activeStep = getActiveStep(status);
  const isDone = status === "completed";

  return (
    <section ref={sectionRef} className="py-20 px-4 bg-surface-card border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-black mb-3">
            Try Creating a{" "}
            <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
              Free Video
            </span>{" "}
            below
          </h2>
          <p className="text-white/40 text-base">No account needed. Enter a topic and we generate it for you.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Video player */}
          <div className="flex flex-col items-center gap-4">
            {loading && (
              <div className="flex items-center justify-center gap-2 w-full max-w-[280px] rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
                <Zap className="w-5 h-5 text-primary shrink-0 animate-pulse" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Generating</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-primary">{formatElapsed(liveElapsedSec)}</p>
                </div>
              </div>
            )}
            {isResultShowing && finalElapsedSec !== null && !loading && (
              <div className="flex items-center justify-center gap-2 w-full max-w-[280px] rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5">
                <Zap className="w-4 h-4 text-accent shrink-0" />
                <p className="text-sm text-white/90">
                  <span className="text-white/50">Ready in </span>
                  <span className="font-mono font-bold text-accent tabular-nums">{formatElapsed(finalElapsedSec)}</span>
                  <span className="text-white/40 text-xs"> — start to preview</span>
                </p>
              </div>
            )}

            <div className="relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
              {isResultShowing && result?.video_url ? (
                <>
                  <video
                    ref={demoVideoRef}
                    key={result.id}
                    src={result.video_url}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                  />
                  <div className="absolute top-2 left-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-full pointer-events-none">
                    YOUR VIDEO
                  </div>
                </>
              ) : (
                <DefaultDemoVideo />
              )}
            </div>

            {isResultShowing && (
              <div className="flex flex-col items-center gap-2 w-full max-w-[280px]">
                <button
                  onClick={resetResult}
                  className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Generate another
                </button>
              </div>
            )}

            {!isResultShowing && (
              <p className="text-white/25 text-xs">Example video generated by our AI</p>
            )}
          </div>

          {/* Right: Form (always visible) */}
          <div className="rounded-2xl bg-surface border border-white/5 p-6 space-y-5">
            {isResultShowing && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Your video is ready! Check the preview on the left.
                </div>
                {finalElapsedSec !== null && (
                  <p className="text-xs text-white/50 pl-6">
                    Total time from click to preview:{" "}
                    <span className="font-mono font-semibold text-white/80">{formatElapsed(finalElapsedSec)}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/70">Topic</label>
                <button
                  onClick={() => { setTopic(pickRandomTopic()); setError(""); }}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-surface-card hover:bg-white/5 text-white/60 text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  I'm Feeling Lucky
                </button>
              </div>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The one habit that changed everything for me..."
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-surface-card border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors text-sm resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Mic className="w-4 h-4" />
                Voice
              </label>
              <div className="max-h-[220px] overflow-y-auto rounded-xl border border-white/10 bg-surface-card p-3 space-y-3 pr-1">
                {VOICES.map((group) => (
                  <div key={group.group}>
                    <p className="text-[11px] text-white/30 mb-1.5">{group.group}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.voices.map((v) => {
                        const isSelected = voice === v;
                        const isPlaying = playingVoice === v;
                        return (
                          <div
                            key={v}
                            className={`flex items-center rounded-lg border ${
                              isSelected ? "border-primary/50 bg-primary/15" : "border-white/10 bg-surface"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setVoice(v)}
                              disabled={loading}
                              className={`px-2.5 py-1.5 text-xs font-semibold ${
                                isSelected ? "text-primary" : "text-white/70 hover:text-white"
                              } disabled:opacity-50`}
                            >
                              {v}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePlayVoiceDemo(v)}
                              disabled={loading}
                              className="px-2 py-1.5 border-l border-white/10 text-white/50 hover:text-white disabled:opacity-50"
                              title={isPlaying ? "Stop demo" : "Play demo"}
                            >
                              {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Type className="w-4 h-4" />
                Subtitle Style
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBTITLE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSubtitlePreset(p.key)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      subtitlePreset === p.key
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-white/10 bg-surface text-white/70 hover:text-white hover:bg-white/5"
                    } disabled:opacity-50`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <Subtitles className="w-4 h-4" />
                Spoken Word Effect
              </label>
              <div className="flex flex-wrap gap-2">
                {WORD_EFFECT_MODES.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setWordEffectMode(mode.key)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      wordEffectMode === mode.key
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-white/10 bg-surface text-white/70 hover:text-white hover:bg-white/5"
                    } disabled:opacity-50`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {PIPELINE_STEPS.map((step, i) => {
                  const isDoneStep = isDone || activeStep > i;
                  const isActive = !isDone && activeStep === i;
                  return (
                    <span key={step.key} className={`inline-flex items-center gap-1.5 text-xs font-medium ${isDoneStep ? "text-accent" : isActive ? "text-white" : "text-white/20"}`}>
                      {isDoneStep ? <CheckCircle2 className="w-3 h-3" /> : isActive ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : <Circle className="w-3 h-3" />}
                      {step.label}
                    </span>
                  );
                })}
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> Create Free Video</>
              )}
            </button>

            <p className="text-center text-white/25 text-xs">
              No account needed · 30s video · Powered by AI
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

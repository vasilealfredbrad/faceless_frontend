import { useState, useEffect } from "react";
import {
  MessageSquare,
  Wand2,
  Users,
  Palette,
  Rocket,
  Clock,
  MonitorPlay,
  Layers,
  Check,
  Mic,
  Play,
  Square,
} from "lucide-react";
import { getCategories, CategoryInfo } from "../../lib/api";
import VOICE_DEMO_FILES from "../../lib/voice-demos";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormTab = "scenario" | "characters" | "style";
type Tone = "dramatic" | "funny" | "wholesome" | "spicy" | "suspense" | "savage";
type Platform = "instagram" | "imessage" | "whatsapp" | "messenger";

interface Message {
  side: "left" | "right";
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TONES: { key: Tone; label: string; desc: string }[] = [
  { key: "dramatic",  label: "Dramatic",  desc: "Tension & confrontation" },
  { key: "funny",     label: "Funny",     desc: "Humour & chaos" },
  { key: "wholesome", label: "Wholesome", desc: "Heartfelt & sweet" },
  { key: "spicy",     label: "Spicy",     desc: "Tea & revelations" },
  { key: "suspense",  label: "Suspense",  desc: "Mystery & fear" },
  { key: "savage",    label: "Savage",    desc: "Cold & unbothered" },
];

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "imessage",  label: "iMessage" },
  { key: "whatsapp",  label: "WhatsApp" },
  { key: "messenger", label: "Messenger" },
];

const BUBBLE_COLORS = ["#E1306C", "#007AFF", "#25D366", "#0084FF", "#AF52DE", "#FF9500"];

const MESSAGE_COUNTS = [6, 10, 14, 20] as const;

const VOICES = [
  { group: "Female", voices: ["Autumn", "Melody", "Hannah", "Emily", "Kaitlyn", "Luna"] },
  { group: "Male",   voices: ["Noah", "Jasper", "Caleb", "Ethan", "Daniel"] },
];

const LUCKY_SCENARIOS = [
  "I found out my best friend has been talking to my ex behind my back",
  "My roommate thinks I ate their leftovers but it was actually their dog",
  "Texting the wrong number and accidentally confessing something huge",
  "Getting caught lying about being sick to skip work",
  "Your coworker found your anonymous gossip account",
  "Finding out a family member won the lottery and told everyone except you",
];

const TONE_PREVIEWS: Record<Tone, Message[]> = {
  dramatic: [
    { side: "left",  text: "We need to talk. Now." },
    { side: "right", text: "What happened??" },
    { side: "left",  text: "I found the messages." },
    { side: "right", text: "I can explain everything" },
    { side: "left",  text: "Don't." },
    { side: "right", text: "Please just let me—" },
    { side: "left",  text: "I said don't." },
    { side: "right", text: "I'm so sorry" },
  ],
  funny: [
    { side: "left",  text: "bro why is there a raccoon in your car" },
    { side: "right", text: "long story" },
    { side: "left",  text: "explain" },
    { side: "right", text: "ok so you know how I said I could handle it" },
    { side: "left",  text: "the raccoon is driving isn't it" },
    { side: "right", text: "he's actually really good ngl" },
    { side: "left",  text: "I'm calling animal control" },
    { side: "right", text: "he said he knows the route" },
  ],
  wholesome: [
    { side: "left",  text: "hey I just wanted to say thank you" },
    { side: "right", text: "for what?" },
    { side: "left",  text: "for always being there. genuinely." },
    { side: "right", text: "stop you're gonna make me cry 😭" },
    { side: "left",  text: "I mean it. you changed my life." },
    { side: "right", text: "ok now I'm actually crying" },
    { side: "left",  text: "same 💙" },
    { side: "right", text: "you're my favorite person fr" },
  ],
  spicy: [
    { side: "left",  text: "so I heard something interesting today" },
    { side: "right", text: "uh oh" },
    { side: "left",  text: "you never told me you used to date Tyler" },
    { side: "right", text: "it was like ONE time" },
    { side: "left",  text: "he still talks about you btw" },
    { side: "right", text: "WHAT" },
    { side: "left",  text: "yeah you might want to call him 👀" },
    { side: "right", text: "I'm going to need a moment" },
  ],
  suspense: [
    { side: "right", text: "are you home?" },
    { side: "left",  text: "no why" },
    { side: "right", text: "don't come home tonight" },
    { side: "left",  text: "what's going on" },
    { side: "right", text: "just trust me. stay at Sarah's." },
    { side: "left",  text: "you're scaring me" },
    { side: "right", text: "I'll explain everything later. please." },
    { side: "left",  text: "ok I'm scared now. call me." },
  ],
  savage: [
    { side: "left",  text: "miss me yet?" },
    { side: "right", text: "who is this" },
    { side: "left",  text: "WOW" },
    { side: "right", text: "oh wait is this Jake lol" },
    { side: "left",  text: "it's been 3 weeks" },
    { side: "right", text: "and I have already healed, grown, and redecorated" },
    { side: "left",  text: "😐" },
    { side: "right", text: "blocked" },
  ],
};

// ─── Platform styles ──────────────────────────────────────────────────────────

function getPlatformStyle(platform: Platform, accentColor: string) {
  switch (platform) {
    case "instagram":
      return {
        bg: "rgba(0,0,0,0.85)",
        border: "rgba(255,255,255,0.12)",
        headerBg: "rgba(0,0,0,0.9)",
        sentBg: accentColor,
        receivedBg: "#262626",
        sentText: "#fff",
        receivedText: "#fff",
        nameColor: "#fff",
        timeColor: "rgba(255,255,255,0.4)",
        inputBg: "#262626",
        inputBorder: "rgba(255,255,255,0.15)",
        checkIcon: "✓✓",
      };
    case "imessage":
      return {
        bg: "rgba(0,0,0,0.88)",
        border: "rgba(255,255,255,0.1)",
        headerBg: "rgba(0,0,0,0.9)",
        sentBg: accentColor,
        receivedBg: "#2c2c2e",
        sentText: "#fff",
        receivedText: "#fff",
        nameColor: "#fff",
        timeColor: "rgba(255,255,255,0.4)",
        inputBg: "#1c1c1e",
        inputBorder: "rgba(255,255,255,0.12)",
        checkIcon: "",
      };
    case "whatsapp":
      return {
        bg: "rgba(11,20,26,0.92)",
        border: "rgba(255,255,255,0.08)",
        headerBg: "rgba(22,33,40,0.95)",
        sentBg: accentColor === BUBBLE_COLORS[0] ? "#005c4b" : accentColor,
        receivedBg: "#202c33",
        sentText: "#e9edef",
        receivedText: "#e9edef",
        nameColor: "#e9edef",
        timeColor: "rgba(233,237,239,0.4)",
        inputBg: "#202c33",
        inputBorder: "rgba(255,255,255,0.08)",
        checkIcon: "✓✓",
      };
    case "messenger":
      return {
        bg: "rgba(10,10,10,0.9)",
        border: "rgba(255,255,255,0.1)",
        headerBg: "rgba(10,10,10,0.95)",
        sentBg: accentColor,
        receivedBg: "#3a3b3c",
        sentText: "#fff",
        receivedText: "#fff",
        nameColor: "#fff",
        timeColor: "rgba(255,255,255,0.4)",
        inputBg: "#3a3b3c",
        inputBorder: "rgba(255,255,255,0.1)",
        checkIcon: "✓",
      };
  }
}

// ─── Conversation overlay (the chat widget shown on the video) ────────────────

function ConversationOverlay({
  platform,
  contactName,
  myName,
  accentColor,
  messages,
}: {
  platform: Platform;
  contactName: string;
  myName: string;
  accentColor: string;
  messages: Message[];
}) {
  const s = getPlatformStyle(platform, accentColor);
  const initials = (contactName || "T")[0].toUpperCase();

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ background: s.headerBg, borderBottom: `1px solid ${s.border}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: accentColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold truncate" style={{ color: s.nameColor }}>
              {contactName || "Them"}
            </p>
            {platform === "instagram" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="6" fill="#0095F6"/>
                <path d="M3.5 6l1.8 1.8 3-3.6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <p className="text-[10px]" style={{ color: s.timeColor }}>
            {platform === "instagram" ? "Active now" : platform === "whatsapp" ? "online" : "Active 2m ago"}
          </p>
        </div>
        {/* Platform icon hint */}
        <div className="shrink-0 opacity-40">
          {platform === "instagram" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          )}
          {platform === "whatsapp" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="px-3 py-3 space-y-2">
        {messages.slice(0, 6).map((msg, i) => {
          const isRight = msg.side === "right";
          return (
            <div key={i} className={`flex ${isRight ? "justify-end" : "justify-start"} items-end gap-1.5`}>
              {!isRight && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mb-0.5"
                  style={{ background: accentColor }}
                >
                  {initials}
                </div>
              )}
              <div
                className="max-w-[72%] px-3 py-2 text-[12px] leading-snug"
                style={{
                  background: isRight ? s.sentBg : s.receivedBg,
                  color: isRight ? s.sentText : s.receivedText,
                  borderRadius: isRight
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                }}
              >
                {msg.text}
              </div>
              {isRight && s.checkIcon && (
                <span className="text-[9px] mb-1" style={{ color: s.timeColor }}>
                  {s.checkIcon}
                </span>
              )}
            </div>
          );
        })}

        {/* Typing dots */}
        <div className="flex justify-start items-end gap-1.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
            style={{ background: accentColor }}
          >
            {initials}
          </div>
          <div
            className="px-3 py-2.5 flex items-center gap-1"
            style={{ background: s.receivedBg, borderRadius: "18px 18px 18px 4px" }}
          >
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  animationDelay: `${d * 150}ms`,
                  animationDuration: "900ms",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderTop: `1px solid ${s.border}` }}
      >
        <div
          className="flex-1 rounded-full px-3 py-1.5 text-[11px]"
          style={{
            background: s.inputBg,
            border: `1px solid ${s.inputBorder}`,
            color: s.timeColor,
          }}
        >
          Message…
        </div>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ background: accentColor }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1.5L5 8.5M5 1.5L2 4.5M5 1.5L8 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Video preview (9:16 frame) ───────────────────────────────────────────────

const BG_GRADIENTS = [
  "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
  "linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 50%, #2d1b69 100%)",
  "linear-gradient(180deg, #0a2342 0%, #1a4a7a 60%, #2980b9 100%)",
  "linear-gradient(180deg, #1a0000 0%, #3d0000 50%, #7b0000 100%)",
];

function VideoPreview({
  platform,
  contactName,
  myName,
  accentColor,
  messages,
  bgIndex,
}: {
  platform: Platform;
  contactName: string;
  myName: string;
  accentColor: string;
  messages: Message[];
  bgIndex: number;
}) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      style={{ aspectRatio: "9/16", background: BG_GRADIENTS[bgIndex % BG_GRADIENTS.length] }}
    >
      {/* Simulated background gameplay */}
      <div className="absolute inset-0 opacity-60">
        {/* Road/track simulation */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2"
          style={{
            background: "linear-gradient(0deg, rgba(255,100,50,0.3) 0%, transparent 100%)",
          }}
        />
        {/* Fake road lines */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-2 h-16 bg-white/20 rounded" />
        <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-2 h-16 bg-white/20 rounded" />
        <div className="absolute bottom-[8%] left-[30%] w-1.5 h-10 bg-white/15 rounded rotate-6" />
        <div className="absolute bottom-[8%] right-[30%] w-1.5 h-10 bg-white/15 rounded -rotate-6" />
      </div>

      {/* Gameplay label */}
      <div className="absolute top-3 right-3 z-10">
        <span className="text-[9px] text-white/30 uppercase tracking-wider font-medium bg-black/30 px-2 py-1 rounded-full">
          Background video
        </span>
      </div>

      {/* Conversation overlay — centered in frame */}
      <div className="absolute inset-x-3 top-1/2 -translate-y-[55%] z-20">
        <ConversationOverlay
          platform={platform}
          contactName={contactName}
          myName={myName}
          accentColor={accentColor}
          messages={messages}
        />
      </div>

      {/* Voice indicator at bottom */}
      <div className="absolute bottom-4 inset-x-3 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: accentColor }}
        >
          <Mic className="w-2.5 h-2.5 text-white" />
        </div>
        <div className="flex-1 flex items-center gap-0.5 h-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/40"
              style={{
                height: `${30 + Math.sin(i * 0.8) * 50 + Math.cos(i * 1.3) * 20}%`,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-white/50 font-medium shrink-0">TTS Voice</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FakeTextVideos() {
  const [activeTab, setActiveTab] = useState<FormTab>("scenario");

  // Scenario
  const [scenario, setScenario]       = useState("");
  const [tone, setTone]               = useState<Tone>("dramatic");
  const [messageCount, setMessageCount] = useState<typeof MESSAGE_COUNTS[number]>(10);
  const [duration, setDuration]       = useState<30 | 60>(30);
  const [variations, setVariations]   = useState(1);

  // Characters
  const [myName, setMyName]           = useState("Me");
  const [theirName, setTheirName]     = useState("Them");
  const [accentColor, setAccentColor] = useState(BUBBLE_COLORS[0]);

  // Style
  const [platform, setPlatform]       = useState<Platform>("instagram");
  const [background, setBackground]   = useState("minecraft");
  const [categories, setCategories]   = useState<CategoryInfo[]>([]);

  // Voice
  const [voice, setVoice]             = useState("Luna");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  function handlePlayDemo(v: string) {
    const url = VOICE_DEMO_FILES[v];
    if (!url) return;
    if (audioRef[0]) { audioRef[0].pause(); }
    if (playingVoice === v) { setPlayingVoice(null); return; }
    const audio = new Audio(url);
    audio.onended = () => setPlayingVoice(null);
    audio.play().then(() => setPlayingVoice(v)).catch(() => {});
    audioRef[0] = audio;
  }

  const previewMessages = TONE_PREVIEWS[tone].slice(0, Math.min(8, messageCount));

  const TABS: { key: FormTab; label: string; icon: typeof MessageSquare }[] = [
    { key: "scenario",   label: "Scenario",   icon: MessageSquare },
    { key: "characters", label: "Characters", icon: Users },
    { key: "style",      label: "Style",      icon: Palette },
  ];

  return (
    <div className="flex flex-col xl:flex-row min-h-full">

      {/* ── Left: form panel ── */}
      <div className="xl:w-[420px] xl:shrink-0 xl:border-r xl:border-white/5 xl:sticky xl:top-0 xl:self-start xl:max-h-[calc(100vh-64px)] xl:overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white leading-tight">
                Fake Text Videos
              </h1>
              <p className="text-xs text-white/35 mt-0.5">DM conversation · Voice narration · Background video</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="p-6">
          <div className="rounded-2xl bg-surface-card border border-white/5 overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-white/5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                      isActive
                        ? "border-pink-500 text-pink-400 bg-pink-500/5"
                        : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/3"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-5">

              {/* ── Scenario ── */}
              {activeTab === "scenario" && (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className="text-xs font-medium text-white/50">Conversation scenario</label>
                      <button
                        onClick={() => setScenario(LUCKY_SCENARIOS[Math.floor(Math.random() * LUCKY_SCENARIOS.length)])}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-surface hover:bg-white/5 text-white/60 text-xs font-semibold"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Suggest
                      </button>
                    </div>
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="e.g. Confronting my best friend about talking to my ex behind my back…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 transition-colors text-sm resize-none"
                    />
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="text-xs font-medium text-white/50 mb-2 block">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTone(t.key)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors text-left ${
                            tone === t.key
                              ? "border-pink-500/50 bg-pink-500/15"
                              : "border-white/10 bg-surface hover:bg-white/5"
                          }`}
                        >
                          <span className={`text-xs font-semibold ${tone === t.key ? "text-pink-400" : "text-white/70"}`}>
                            {t.label}
                          </span>
                          <span className="text-[10px] text-white/30">{t.desc.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages + Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Messages
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        {MESSAGE_COUNTS.map((n) => (
                          <button
                            key={n}
                            onClick={() => setMessageCount(n)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                              messageCount === n ? "bg-pink-500 text-white" : "bg-surface text-white/40 hover:text-white/70"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                        <Clock className="w-3.5 h-3.5" /> Duration
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        {([30, 60] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                              duration === d ? "bg-pink-500 text-white" : "bg-surface text-white/40 hover:text-white/70"
                            }`}
                          >
                            {d}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Variations + Background */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                        <Layers className="w-3.5 h-3.5" /> Variations
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        {[1, 2, 4].map((v) => (
                          <button
                            key={v}
                            onClick={() => setVariations(v)}
                            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                              variations === v ? "bg-pink-500 text-white" : "bg-surface text-white/40 hover:text-white/70"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                        <MonitorPlay className="w-3.5 h-3.5" /> Background
                      </label>
                      <select
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500/50"
                      >
                        {categories.length === 0 && <option value="minecraft">minecraft</option>}
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Characters ── */}
              {activeTab === "characters" && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Your side (right)</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Display name</label>
                        <input
                          type="text"
                          value={myName}
                          onChange={(e) => setMyName(e.target.value)}
                          placeholder="Me"
                          className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-5">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Their side (left)</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Contact name</label>
                        <input
                          type="text"
                          value={theirName}
                          onChange={(e) => setTheirName(e.target.value)}
                          placeholder="Them"
                          className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-pink-500/50 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-2 block">Accent color</label>
                        <div className="flex gap-2 flex-wrap">
                          {BUBBLE_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setAccentColor(c)}
                              className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                              style={{
                                background: c,
                                outline: accentColor === c ? `3px solid ${c}` : "none",
                                outlineOffset: "2px",
                                transform: accentColor === c ? "scale(1.15)" : "scale(1)",
                              }}
                            >
                              {accentColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice */}
                  <div className="border-t border-white/5 pt-5">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" />Narrator Voice</span>
                    </p>
                    <div className="space-y-3">
                      {VOICES.map((group) => (
                        <div key={group.group}>
                          <p className="text-[10px] text-white/25 mb-1.5">{group.group}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.voices.map((v) => {
                              const isSelected = voice === v;
                              const isPlaying  = playingVoice === v;
                              return (
                                <div
                                  key={v}
                                  className={`flex items-center rounded-lg border transition-colors ${
                                    isSelected ? "border-pink-500/50 bg-pink-500/15" : "border-white/10 bg-surface"
                                  }`}
                                >
                                  <button onClick={() => setVoice(v)} className={`px-2.5 py-1.5 text-xs font-semibold ${isSelected ? "text-pink-400" : "text-white/60 hover:text-white"}`}>
                                    {v}
                                  </button>
                                  <button onClick={() => handlePlayDemo(v)} className="px-1.5 py-1.5 border-l border-white/10 text-white/35 hover:text-white transition-colors">
                                    {isPlaying ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── Style ── */}
              {activeTab === "style" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-white/50 mb-2 block">Platform style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setPlatform(p.key)}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                            platform === p.key
                              ? "border-pink-500/50 bg-pink-500/15 text-pink-400"
                              : "border-white/10 bg-surface text-white/50 hover:bg-white/5"
                          }`}
                        >
                          {platform === p.key && <Check className="w-3 h-3" />}
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-white/50 mb-2 block">Accent color</label>
                    <div className="flex gap-2">
                      {BUBBLE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: c,
                            outline: accentColor === c ? `3px solid ${c}` : "none",
                            outlineOffset: "2px",
                            transform: accentColor === c ? "scale(1.15)" : "scale(1)",
                          }}
                        >
                          {accentColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Generate button */}
            <div className="px-5 pb-5">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400/50 font-bold text-sm cursor-not-allowed"
              >
                <Rocket className="w-4 h-4" />
                Coming Soon — Generate Video
              </button>
              <p className="text-center text-[11px] text-white/20 mt-2">
                Backend generation in development
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: video preview ── */}
      <div className="flex-1 min-w-0 px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Video Preview</h2>
            <p className="text-xs text-white/25 mt-0.5">Conversation overlaid on background video</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Platform pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPlatform(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                platform === p.key
                  ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                  : "bg-white/5 border-white/10 text-white/35 hover:text-white/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main preview */}
          <div className="w-full lg:max-w-[260px] shrink-0">
            <VideoPreview
              platform={platform}
              contactName={theirName}
              myName={myName}
              accentColor={accentColor}
              messages={previewMessages}
              bgIndex={0}
            />
          </div>

          {/* Info panel */}
          <div className="flex-1 space-y-4">
            <div className="rounded-2xl bg-surface-card border border-white/5 p-5 space-y-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">How it works</p>
              {[
                { n: "1", title: "Conversation generates", desc: "AI writes a full conversation based on your scenario and tone" },
                { n: "2", title: "Voice reads each message", desc: `${voice} narrates every message as it appears on screen` },
                { n: "3", title: "Overlaid on gameplay", desc: `Chat widget animates over your ${background} background video` },
                { n: "4", title: "Ready to post", desc: "9:16 vertical video optimized for TikTok, Reels & Shorts" },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                    style={{ background: accentColor }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">{step.title}</p>
                    <p className="text-xs text-white/35 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Current settings summary */}
            <div className="rounded-2xl bg-surface-card border border-white/5 p-4 grid grid-cols-2 gap-3">
              {[
                { label: "Platform", value: PLATFORMS.find(p => p.key === platform)?.label ?? "" },
                { label: "Tone",     value: TONES.find(t => t.key === tone)?.label ?? "" },
                { label: "Messages", value: `${messageCount} msgs` },
                { label: "Duration", value: `${duration}s` },
                { label: "Voice",    value: voice },
                { label: "Background", value: background },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-surface border border-white/5 p-2.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { type LucideIcon, Rocket, CheckCircle2 } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

export default function ComingSoonPage({ icon: Icon, title, description, features }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon + badge */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-9 h-9 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-surface-card border border-white/10 rounded-full px-2 py-0.5 shadow-lg">
          <Rocket className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Soon</span>
        </div>
      </div>

      <h1 className="font-display text-3xl font-bold text-white mb-3">{title}</h1>
      <p className="text-white/50 text-base max-w-md leading-relaxed mb-8">{description}</p>

      {/* Feature list */}
      <div className="w-full max-w-sm rounded-2xl bg-surface-card border border-white/5 p-5 text-left space-y-3 mb-8">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1">
          What's coming
        </p>
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary/50 shrink-0" />
            <span className="text-sm text-white/60">{f}</span>
          </div>
        ))}
      </div>

      <p className="text-white/20 text-xs">
        We're building this feature — check back soon.
      </p>
    </div>
  );
}

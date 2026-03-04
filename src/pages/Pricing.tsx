import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { Check, Sparkles, Zap, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { createStripeCheckout } from "../lib/api";
import AuthModal from "../components/AuthModal";

interface Props {
  session: Session | null;
  tier?: string;
}

interface PlanCard {
  id: "starter" | "growth" | "creator";
  name: string;
  price: number;
  period: string;
  badge?: string;
  features: string[];
  highlight?: boolean;
  icon: typeof Sparkles;
}

const PLANS: PlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9,
    period: "mo",
    icon: Sparkles,
    features: [
      "Content Creation",
      "5 Posts per Week",
      "HD Video Resolution",
      "Auto Posting to your channel (soon)",
      "Ability to edit posts in advance",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 30,
    period: "mo",
    badge: "Most Popular",
    highlight: true,
    icon: Zap,
    features: [
      "Everything in Starter",
      "Daily Posts — 2x videos per day",
      "14 Posts per Week",
      "Choose posting schedule time",
      "HD Video Resolution",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 50,
    period: "mo",
    icon: Crown,
    features: [
      "Everything in Growth",
      "Bulk generation — up to 300 videos",
      "Remake ability",
      "Advanced custom menu (soon)",
      "Add your brand logo (soon)",
      "Download video files",
      "Priority Support",
    ],
  },
];

export default function Pricing({ session, tier }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  async function handleSubscribe(planId: "starter" | "growth" | "creator") {
    if (!session) {
      setShowAuth(true);
      return;
    }

    setLoading(planId);
    setError("");

    try {
      await createStripeCheckout(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  const currentTier = tier || "free";

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="font-display text-lg font-bold text-white">
            Choose Your Plan
          </span>
          <div className="w-16" />
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Start free, upgrade when you're ready. All plans include AI-powered video creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => {
              const isCurrentPlan = currentTier === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-7 flex flex-col ${
                    plan.highlight
                      ? "bg-gradient-to-b from-primary/10 to-surface-card border-primary/30 shadow-lg shadow-primary/5"
                      : "bg-surface-card border-white/5"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wide">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <plan.icon className={`w-5 h-5 ${plan.highlight ? "text-primary" : "text-white/40"}`} />
                      <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-black text-white">
                        ${plan.price}
                      </span>
                      <span className="text-white/30 text-sm">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-primary" : "text-accent"}`} />
                        <span className="text-sm text-white/60">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-white/5 text-white/30 font-semibold text-sm cursor-default"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading !== null}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                        plan.highlight
                          ? "bg-primary hover:bg-primary-dark text-white"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      } disabled:opacity-50`}
                    >
                      {loading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="max-w-md mx-auto mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-white/20 text-sm">
              All plans are billed monthly. Cancel anytime from your account settings.
            </p>
          </div>
        </div>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

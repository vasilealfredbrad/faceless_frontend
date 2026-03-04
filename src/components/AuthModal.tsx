import { useState } from "react";
import { supabase } from "../lib/supabase";
import { X, Mail, Lock, Loader2, Check, UserPlus, LogIn } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
}

type Tab = "signin" | "signup";

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (tab === "signup") {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }
        setSuccess("Check your email for a confirmation link, then sign in.");
        setTab("signin");
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) {
          setError(signInErr.message);
          return;
        }
        onClose();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface-card border border-white/10 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display text-2xl font-bold mb-2 text-center">
          Welcome to <span className="text-primary">Invisible Creator</span>
        </h2>

        {tab === "signup" && (
          <div className="flex justify-center gap-4 mb-6 mt-3">
            {["5 free videos/day", "No credit card", "Cancel anytime"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1 text-xs text-accent">
                <Check className="w-3 h-3" />
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6 mt-3">
          <button
            onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
              tab === "signup"
                ? "bg-primary text-white"
                : "bg-surface text-white/40 hover:text-white/60"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
          <button
            onClick={() => { setTab("signin"); setError(""); setSuccess(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
              tab === "signin"
                ? "bg-primary text-white"
                : "bg-surface text-white/40 hover:text-white/60"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "signup" ? "At least 6 characters" : "Your password"}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tab === "signup" ? (
              <>
                <UserPlus className="w-4 h-4" />
                Create account — it's free
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

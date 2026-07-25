import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import {
  Sparkles,
  MessageSquare,
  HelpCircle,
  Gamepad2,
  Trophy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: typeof Sparkles;
}

const NAV_ITEMS: NavItem[] = [
  { label: "AI Story Videos",   path: "/dashboard/ai-story",        icon: Sparkles },
  { label: "Fake Text Videos",  path: "/dashboard/fake-text",        icon: MessageSquare },
  { label: "Would You Rather",  path: "/dashboard/would-you-rather", icon: HelpCircle },
  { label: "Roblox Rant",       path: "/dashboard/roblox-rant",      icon: Gamepad2 },
  { label: "Top 5 Moments",     path: "/dashboard/top-5",            icon: Trophy },
  { label: "Reddit Videos",     path: "/dashboard/reddit",           icon: BookOpen },
];

interface Props {
  session: Session | null;
  isAdmin: boolean;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ session, isAdmin, onLogout, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      <Navbar
        session={session}
        isAdmin={isAdmin}
        onOpenAuth={() => {}}
        onLogout={onLogout}
      />

      {/* Below navbar — fills rest of viewport */}
      <div className="flex flex-1 overflow-hidden pt-28">

        {/* ── Sidebar (desktop) ── */}
        <aside
          className={`hidden md:flex flex-col shrink-0 h-full overflow-y-auto border-r border-white/5 bg-surface-card transition-all duration-200 ${
            collapsed ? "w-14" : "w-52"
          }`}
        >
          {/* Collapse toggle */}
          <div className="flex items-center justify-end p-2 border-b border-white/5 shrink-0">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/5 transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 p-2 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-white/45 hover:text-white/80 hover:bg-white/5"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content area ── */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-surface-card border-t border-white/5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors ${
                  isActive ? "text-primary" : "text-white/35 hover:text-white/60"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-medium truncate max-w-[56px] text-center leading-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

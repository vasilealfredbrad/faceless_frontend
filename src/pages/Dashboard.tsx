import { useEffect } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import DashboardLayout from "../components/DashboardLayout";
import AIStoryVideos from "./dashboard/AIStoryVideos";
import FakeTextVideos from "./dashboard/FakeTextVideos";
import WouldYouRather from "./dashboard/WouldYouRather";
import RobloxRant from "./dashboard/RobloxRant";
import Top5Moments from "./dashboard/Top5Moments";
import RedditVideos from "./dashboard/RedditVideos";

interface Props {
  session: Session | null;
  isAdmin: boolean;
  onLogout: () => void;
}

export default function Dashboard({ session, isAdmin, onLogout }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  if (!session) return null;

  return (
    <DashboardLayout session={session} isAdmin={isAdmin} onLogout={onLogout}>
      <Routes>
        <Route index element={<Navigate to="ai-story" replace />} />
        <Route path="ai-story" element={<AIStoryVideos session={session} />} />
        <Route path="fake-text" element={<FakeTextVideos />} />
        <Route path="would-you-rather" element={<WouldYouRather />} />
        <Route path="roblox-rant" element={<RobloxRant />} />
        <Route path="top-5" element={<Top5Moments />} />
        <Route path="reddit" element={<RedditVideos />} />
        <Route path="*" element={<Navigate to="ai-story" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

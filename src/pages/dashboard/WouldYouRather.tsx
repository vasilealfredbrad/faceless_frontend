import ComingSoon from "../../components/ComingSoonPage";
import { HelpCircle } from "lucide-react";

export default function WouldYouRather() {
  return (
    <ComingSoon
      icon={HelpCircle}
      title="Would You Rather"
      description="Create addictive 'Would You Rather' videos that keep viewers watching and voting. AI generates spicy dilemmas, polls, and results — fully automated."
      features={[
        "AI-generated dilemma pairs",
        "Animated poll countdown overlays",
        "Results reveal sequence",
        "Trending topic suggestions",
        "Split-screen layout templates",
      ]}
    />
  );
}

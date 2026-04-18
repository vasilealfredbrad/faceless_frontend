import ComingSoon from "../../components/ComingSoonPage";
import { Trophy } from "lucide-react";

export default function Top5Moments() {
  return (
    <ComingSoon
      icon={Trophy}
      title="Top 5 Moments"
      description="Produce satisfying 'Top 5' countdown videos on any topic. AI researches, ranks, and narrates — you just pick a subject."
      features={[
        "AI-researched Top 5 lists",
        "Animated countdown transitions",
        "Dramatic reveal pacing",
        "Custom category topics",
        "Thumbnail auto-generation",
      ]}
    />
  );
}

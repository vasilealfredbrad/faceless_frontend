import ComingSoon from "../../components/ComingSoonPage";
import { BookOpen } from "lucide-react";

export default function RedditVideos() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Reddit Videos"
      description="Turn viral Reddit threads into narrated short-form videos. AI reads the post, picks the best comments, and assembles a complete video with animated Reddit UI."
      features={[
        "Import any Reddit thread URL",
        "AI comment curation & ranking",
        "Animated Reddit UI overlay",
        "Multi-voice comment narration",
        "Auto background footage matching",
      ]}
    />
  );
}

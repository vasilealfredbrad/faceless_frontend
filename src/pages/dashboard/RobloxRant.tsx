import ComingSoon from "../../components/ComingSoonPage";
import { Gamepad2 } from "lucide-react";

export default function RobloxRant() {
  return (
    <ComingSoon
      icon={Gamepad2}
      title="Roblox Rant Videos"
      description="Turn Roblox gameplay clips into high-engagement rant commentary videos. AI writes the script, adds voiceover, and assembles everything over your footage."
      features={[
        "AI rant script generator",
        "Gameplay footage overlay",
        "Energetic voiceover styles",
        "Trending Roblox topic ideas",
        "Dynamic subtitle animations",
      ]}
    />
  );
}

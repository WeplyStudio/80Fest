
import { getAnnouncementBanner } from "@/lib/actions";
import { Megaphone } from "lucide-react";

export async function AnnouncementBanner() {
  const bannerData = await getAnnouncementBanner();

  if (!bannerData || !bannerData.isEnabled || !bannerData.text) {
    return null;
  }

  return (
    <div className="bg-primary/10 text-primary-foreground py-2 text-center text-sm border-b border-primary/20">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <Megaphone className="h-4 w-4 text-primary shrink-0" />
        <p className="text-foreground">{bannerData.text}</p>
      </div>
    </div>
  );
}

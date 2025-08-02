import { getAnnouncementBanner } from "@/lib/actions";
import { Megaphone } from "lucide-react";

export async function AnnouncementBanner() {
  const bannerData = await getAnnouncementBanner();

  if (!bannerData || !bannerData.isEnabled || !bannerData.text) {
    return null;
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2 animate-in slide-in-from-top-6 fade-in duration-700">
      <div className="container mx-auto flex items-center justify-center gap-3 px-4">
        <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full shadow-sm ring-1 ring-primary/30">
          <Megaphone className="h-4 w-4" />
          <span className="text-center text-sm font-medium leading-tight">{bannerData.text}</span>
        </div>
      </div>
    </div>
  );
}
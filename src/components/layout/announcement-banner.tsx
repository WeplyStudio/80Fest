import { getAnnouncementBanner } from "@/lib/actions";
import { Megaphone } from "lucide-react";

export async function AnnouncementBanner() {
  const bannerData = await getAnnouncementBanner();

  if (!bannerData || !bannerData.isEnabled || !bannerData.text) {
    return null;
  }

  return (
    <div className="flex justify-center px-4 mt-6 animate-in fade-in slide-in-from-top-6 duration-700">
      <div className="relative bg-primary/10 border border-primary/20 rounded-xl shadow-lg max-w-3xl w-full px-6 py-5 overflow-hidden">
        {/* Icon */}
        <div className="absolute top-0 left-0 -translate-x-3 -translate-y-3 bg-primary text-white p-3 rounded-full shadow-md">
          <Megaphone className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-primary">
          <p className="text-center md:text-left text-base md:text-lg font-semibold leading-snug tracking-tight text-foreground">
            {bannerData.text}
          </p>
        </div>
      </div>
    </div>
  );
}
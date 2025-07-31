import { ContestInfo } from "@/components/contest-info";
import { Gallery } from "@/components/gallery";
import { SubmissionDialog } from "@/components/submission-dialog";
import { Button } from "@/components/ui/button";
import { getArtworks } from "@/lib/actions";
import { Upload } from "lucide-react";

export default async function Home() {
  const allArtworks = await getArtworks();
  // Hanya tampilkan karya yang ditandai untuk ada di galeri
  const galleryArtworks = allArtworks.filter(artwork => artwork.isInGallery);

  return (
    <div className="space-y-12">
      <section id="hero" className="text-center section-padding">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary">
          80Fest 2025
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
          Tunjukkan bakat desainmu dalam lomba poster infografis tahun ini!
          Jadilah bagian dari perayaan kreativitas dan inovasi.
        </p>
        <div className="mt-8">
          <SubmissionDialog>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
              <Upload className="mr-2" />
              Upload Karya Sekarang
            </Button>
          </SubmissionDialog>
        </div>
      </section>

      <div className="bg-secondary/50">
        <ContestInfo />
      </div>

      <Gallery artworks={galleryArtworks} />
    </div>
  );
}

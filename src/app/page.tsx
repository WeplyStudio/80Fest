import { ContestInfo } from "@/components/contest-info";
import { Gallery } from "@/components/gallery";
import { SubmissionDialog } from "@/components/submission-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getArtworks } from "@/lib/actions";
import { Upload } from "lucide-react";

export default async function Home() {
  const allArtworks = await getArtworks();
  // Hanya tampilkan karya pemenang di galeri publik
  const galleryArtworks = allArtworks.filter(artwork => artwork.status_juara > 0);

  return (
    <div className="space-y-16">
      <section id="hero" className="text-center py-16">
        <h1 className="text-5xl md:text-7xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-white-500" style={{WebkitTextStroke: '1px black'}}>
          Osis 2024
        </h1>
        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
          Tunjukkan bakat desainmu dalam lomba poster infografis tahun ini!
          Jadilah bagian dari perayaan kreativitas dan inovasi.
        </p>
        <div className="mt-8">
          <SubmissionDialog>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Upload className="mr-2" />
              Upload Karya Sekarang
            </Button>
          </SubmissionDialog>
        </div>
      </section>

      <Separator />

      <ContestInfo />

      <Separator />

      <Gallery artworks={galleryArtworks} />
    </div>
  );
}

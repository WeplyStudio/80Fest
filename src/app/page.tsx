import { ContestInfo } from "@/components/contest-info";
import { Gallery } from "@/components/gallery";
import { SubmissionDialog } from "@/components/submission-dialog";
import { Button } from "@/components/ui/button";
import { getArtworks, getSubmissionStatus } from "@/lib/actions";
import { Upload, XCircle } from "lucide-react";

export default async function Home() {
  const allArtworks = await getArtworks();
  const galleryArtworks = allArtworks.filter(artwork => artwork.isInGallery);
  const isSubmissionOpen = await getSubmissionStatus();

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
          {isSubmissionOpen ? (
            <SubmissionDialog>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                <Upload className="mr-2" />
                Upload Karya Sekarang
              </Button>
            </SubmissionDialog>
          ) : (
             <Button size="lg" disabled>
                <XCircle className="mr-2" />
                Pendaftaran Telah Ditutup
              </Button>
          )}
        </div>
      </section>

      <div className="bg-secondary/50">
        <ContestInfo />
      </div>

      <Gallery artworks={galleryArtworks} />
    </div>
  );
}

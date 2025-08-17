
import { ContestInfo } from "@/components/contest-info";
import { Gallery } from "@/components/gallery";
import { Button } from "@/components/ui/button";
import { getGalleryArtworks, getGalleryStatus, getSubmissionStatus } from "@/lib/actions";
import { Upload, XCircle } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const isSubmissionOpen = await getSubmissionStatus();
  const isGalleryVisible = await getGalleryStatus();
  
  // Fetch only necessary gallery data if the gallery is visible
  const galleryArtworks = isGalleryVisible ? await getGalleryArtworks() : [];


  return (
    <div className="space-y-24">
      <section id="hero" className="text-center section-padding">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-emerald-200">
          Kontes Poster 80Fest
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
          Tunjukkan bakat desain Anda dalam kompetisi poster infografis tahun ini. Jadilah bagian dari perayaan kreativitas dan inovasi.
        </p>
        <div className="mt-10">
          {isSubmissionOpen ? (
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Link href="/submit">
                <Upload className="mr-2" />
                Kirim Karya Anda
              </Link>
            </Button>
          ) : (
             <Button size="lg" disabled>
                <XCircle className="mr-2" />
                Pendaftaran Ditutup
              </Button>
          )}
        </div>
      </section>

      <ContestInfo />

      {isGalleryVisible && <Gallery artworks={galleryArtworks} />}
    </div>
  );
}

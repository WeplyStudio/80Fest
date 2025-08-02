
import { ContestInfo } from "@/components/contest-info";
import { Gallery } from "@/components/gallery";
import { Button } from "@/components/ui/button";
import { getArtworks, getSubmissionStatus } from "@/lib/actions";
import { Upload, XCircle } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const allArtworks = await getArtworks();
  const galleryArtworks = allArtworks.filter(artwork => artwork.isInGallery);
  const isSubmissionOpen = await getSubmissionStatus();

  return (
    <div className="space-y-24">
      <section id="hero" className="text-center section-padding">
        <h1 className="text-5xl md:text-7xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-r from-primary via-green-400 to-green-200">
          80Fest Poster Contest
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
          Showcase your design talent in this year's infographic poster competition. Be part of the celebration of creativity and innovation.
        </p>
        <div className="mt-10">
          {isSubmissionOpen ? (
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <Link href="/submit">
                <Upload className="mr-2" />
                Submit Your Artwork
              </Link>
            </Button>
          ) : (
             <Button size="lg" disabled>
                <XCircle className="mr-2" />
                Submission Closed
              </Button>
          )}
        </div>
      </section>

      <ContestInfo />

      <Gallery artworks={galleryArtworks} />
    </div>
  );
}

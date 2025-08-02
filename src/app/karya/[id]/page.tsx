
import { getArtworkById, getSuggestedArtworks } from "@/lib/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CommentSection } from "@/components/comment-section";
import { SuggestedArtworks } from "@/components/suggested-artworks";
import { ArtworkDetailClient } from "./client-page";
import { Badge } from "@/components/ui/badge";

export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const artwork = await getArtworkById(params.id);
  
  if (!artwork || artwork.isDisqualified) {
    notFound();
  }

  const suggestedArtworks = await getSuggestedArtworks(artwork.id);

  return (
    <div className="space-y-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 aspect-[3/4] w-full relative rounded-lg overflow-hidden bg-muted border">
                <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    className="object-contain"
                />
                 <div className="absolute bottom-2 right-2 pointer-events-none">
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                        &copy; {artwork.name}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{artwork.title}</h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        Oleh: {artwork.name} (Kelas {artwork.class})
                    </p>
                </div>
                <div>
                    <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{artwork.description}</p>
                </div>
                
                <ArtworkDetailClient artwork={artwork} />

            </div>
        </div>
        
        <SuggestedArtworks artworks={suggestedArtworks} />
    </div>
  );
}

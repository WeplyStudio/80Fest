
import { getArtworkById, getSuggestedArtworks } from "@/lib/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SuggestedArtworks } from "@/components/suggested-artworks";
import { LikeButton } from "@/components/like-button";

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
                {artwork.imageUrl ? (
                    <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-contain"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Gambar tidak tersedia
                    </div>
                )}
                 <div className="absolute bottom-2 right-2 pointer-events-none">
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                        &copy; {artwork.name}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{artwork.title}</h1>
                    <div className="flex justify-between items-center mt-1">
                         <p className="text-lg text-muted-foreground">
                            Oleh: {artwork.name} (Kelas {artwork.class})
                        </p>
                        <LikeButton artworkId={artwork.id} initialLikes={artwork.likes} />
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{artwork.description}</p>
                </div>
            </div>
        </div>
        
        <SuggestedArtworks artworks={suggestedArtworks} />
    </div>
  );
}

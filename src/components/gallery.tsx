
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Artwork } from "@/lib/types";
import { Camera, Heart, Loader2 } from "lucide-react";
import { getGalleryArtworks } from "@/lib/actions";
import { Button } from "./ui/button";

interface GalleryProps {
  initialArtworks: Artwork[];
  initialHasMore: boolean;
  artworksPerPage: number;
}

export function Gallery({ initialArtworks, initialHasMore, artworksPerPage }: GalleryProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [page, setPage] = useState(2); // Next page to fetch is 2
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  
  if (initialArtworks.length === 0) {
    return (
      <section id="gallery" className="space-y-12 section-padding">
        <div className="text-center">
          <h2 className="text-4xl font-bold font-headline text-primary">Galeri Karya</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Jelajahi karya-karya luar biasa dari para peserta berbakat kami.</p>
        </div>
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-medium">Galeri Saat Ini Kosong</h3>
            <p className="mt-2 text-base text-muted-foreground">
                Karya-karya terpilih akan ditampilkan di sini setelah proses kurasi.
            </p>
        </div>
      </section>
    );
  }

  const loadMoreArtworks = () => {
    startTransition(async () => {
      const { artworks: newArtworks, hasMore: newHasMore } = await getGalleryArtworks({
        page,
        limit: artworksPerPage,
      });
      setArtworks((prev) => [...prev, ...newArtworks]);
      setPage((prev) => prev + 1);
      setHasMore(newHasMore);
    });
  };

  return (
    <section id="gallery" className="space-y-12 section-padding">
      <div className="text-center">
        <h2 className="text-4xl font-bold font-headline text-primary">Galeri Karya</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Jelajahi karya-karya luar biasa dari para peserta berbakat kami. Klik pada karya mana pun untuk melihat detailnya.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {artworks.map((artwork) => (
            <Link key={artwork.id} href={`/karya/${artwork.id}`} className="block">
              <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 bg-card border-border/50 h-full">
                  <div className="p-0 cursor-pointer">
                      <div className="aspect-[3/4] relative">
                          {artwork.imageUrl ? (
                            <Image
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                                Gambar tidak tersedia
                            </div>
                          )}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 group-hover:opacity-100" />
                      </div>
                  </div>
                  <CardContent className="p-4 flex-grow flex flex-col justify-between">
                     <div>
                       <CardTitle className="font-headline text-lg mb-1 truncate group-hover:text-primary">{artwork.title}</CardTitle>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{artwork.name} - {artwork.class}</span>
                             <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500/80" />
                                <span>{artwork.likes}</span>
                            </div>
                        </div>
                     </div>
                  </CardContent>
              </Card>
            </Link>
          ))}
      </div>
       {hasMore && (
        <div className="text-center">
          <Button onClick={loadMoreArtworks} disabled={isPending} size="lg">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat...
              </>
            ) : (
              "Lihat Lebih Banyak"
            )}
          </Button>
        </div>
      )}
    </section>
  );
}

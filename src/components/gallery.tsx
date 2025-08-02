
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Artwork } from "@/lib/types";
import { Camera, MessageCircle } from "lucide-react";

interface GalleryProps {
  artworks: Artwork[];
}

export function Gallery({ artworks: initialArtworks }: GalleryProps) {
  const [artworks, setArtworks] = useState(initialArtworks);

  const handleArtworkUpdate = (updatedArtwork: Artwork) => {
      setArtworks(currentArtworks => 
          currentArtworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art)
      );
  };
  
  const findArtworkById = (id: string) => artworks.find(art => art.id === id);

  return (
    <section id="gallery" className="space-y-12 section-padding">
      <div className="text-center">
        <h2 className="text-4xl font-bold font-headline text-primary">Galeri Karya</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Jelajahi karya-karya luar biasa dari para peserta berbakat kami. Klik pada karya mana pun untuk melihat detailnya.</p>
      </div>
       {artworks.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-medium">Galeri Saat Ini Kosong</h3>
            <p className="mt-2 text-base text-muted-foreground">
                Karya-karya terpilih akan ditampilkan di sini setelah proses kurasi.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {artworks.map((artwork) => {
              const currentArtwork = findArtworkById(artwork.id) || artwork;
              return (
                <Dialog key={artwork.id}>
                    <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 bg-card border-border/50">
                        <DialogTrigger asChild>
                            <div className="p-0 cursor-pointer">
                                <div className="aspect-[3/4] relative">
                                    <Image
                                    src={artwork.imageUrl}
                                    alt={artwork.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 group-hover:opacity-100" />
                                </div>
                            </div>
                        </DialogTrigger>
                        <CardContent className="p-4 flex-grow flex flex-col justify-between">
                           <div>
                             <CardTitle className="font-headline text-lg mb-1 truncate group-hover:text-primary">{artwork.title}</CardTitle>
                             <p className="text-sm text-muted-foreground">{artwork.name} - {artwork.class}</p>
                           </div>
                        </CardContent>
                    </Card>
                    <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{currentArtwork.title}</DialogTitle>
                        <DialogDescription>{currentArtwork.name} - {currentArtwork.class}</DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="aspect-[3/4] w-full relative rounded-md overflow-hidden bg-muted">
                            <Image
                                src={currentArtwork.imageUrl}
                                alt={currentArtwork.title}
                                fill
                                className="object-contain"
                            />
                            <div className="absolute bottom-2 right-2 pointer-events-none">
                                <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                                    &copy; {currentArtwork.name}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{currentArtwork.description}</p>
                            </div>
                            <div className="text-center py-8 text-muted-foreground text-sm rounded-lg bg-card/50 mt-4">
                                 <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                                <p>Komentar dinonaktifkan untuk kontes ini.</p>
                            </div>
                        </div>
                    </div>
                    </DialogContent>
                </Dialog>
              )
            })}
        </div>
      )}
    </section>
  );
}

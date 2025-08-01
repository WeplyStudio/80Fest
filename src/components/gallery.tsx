
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Artwork } from "@/lib/types";
import { Camera } from "lucide-react";
import { CommentSection } from "./comment-section";

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
        <h2 className="text-3xl font-bold font-headline text-primary">Galeri Karya</h2>
        <p className="text-muted-foreground mt-2">Lihat karya-karya luar biasa dari para peserta pilihan.</p>
      </div>
       {artworks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Galeri Masih Kosong</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Karya-karya pilihan akan ditampilkan di sini setelah proses kurasi.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artworks.map((artwork) => {
              const currentArtwork = findArtworkById(artwork.id) || artwork;
              return (
                <Dialog key={artwork.id}>
                    <Card className="overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
                        <DialogTrigger asChild>
                            <div className="p-0 cursor-pointer">
                                <div className="aspect-[3/4] relative">
                                    <Image
                                    src={artwork.imageUrl}
                                    alt={artwork.title}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </DialogTrigger>
                        <CardContent className="p-4 flex-grow">
                            <CardTitle className="font-headline text-lg truncate group-hover:text-primary">{artwork.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{artwork.name} - {artwork.class}</p>
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
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                                <p className="text-muted-foreground text-sm">{currentArtwork.description}</p>
                            </div>
                            <CommentSection artwork={currentArtwork} onArtworkUpdate={handleArtworkUpdate} />
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

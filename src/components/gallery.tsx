
"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Artwork } from "@/lib/types";
import { Camera, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { addVote } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GalleryProps {
  artworks: Artwork[];
}

const VOTED_ITEMS_KEY = 'votedArtworks';

export function Gallery({ artworks: initialArtworks }: GalleryProps) {
  const [artworks, setArtworks] = useState(initialArtworks);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const storedVotes = localStorage.getItem(VOTED_ITEMS_KEY);
    if (storedVotes) {
      setVotedIds(new Set(JSON.parse(storedVotes)));
    }
  }, []);

  const handleVote = async (artworkId: string) => {
    if (votedIds.has(artworkId)) {
      toast({
        variant: 'destructive',
        title: "Sudah Pernah Vote",
        description: "Anda hanya bisa memberikan satu suara untuk setiap karya.",
      });
      return;
    }

    const result = await addVote(artworkId);

    if (result.success) {
      const newVotedIds = new Set(votedIds).add(artworkId);
      setVotedIds(newVotedIds);
      localStorage.setItem(VOTED_ITEMS_KEY, JSON.stringify(Array.from(newVotedIds)));

      setArtworks(currentArtworks =>
        currentArtworks.map(art =>
          art.id === artworkId ? { ...art, votes: (art.votes || 0) + 1 } : art
        )
      );
      toast({ title: "Terima Kasih!", description: "Suara Anda telah dicatat." });
    } else {
      toast({
        variant: 'destructive',
        title: "Gagal Vote",
        description: result.message,
      });
    }
  };


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
            {artworks.map((artwork) => (
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
                                data-ai-hint={artwork.imageHint}
                                />
                            </div>
                        </div>
                    </DialogTrigger>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="font-headline text-lg truncate group-hover:text-primary">{artwork.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{artwork.name} - {artwork.class}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                         <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleVote(artwork.id)}
                            disabled={votedIds.has(artwork.id)}
                        >
                            <Heart className={cn("mr-2 h-4 w-4", votedIds.has(artwork.id) ? "text-red-500 fill-red-500" : "text-red-500")} />
                            {artwork.votes ?? 0} Suka
                        </Button>
                    </CardFooter>
                </Card>
                <DialogContent className="max-w-4xl w-full">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{artwork.title}</DialogTitle>
                    <DialogDescription>{artwork.name} - {artwork.class}</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="aspect-[2480/3508] w-full relative rounded-md overflow-hidden bg-muted">
                        <Image
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            fill
                            className="object-contain"
                            data-ai-hint={artwork.imageHint}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                        <p className="text-muted-foreground">{artwork.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                            <Heart className="h-5 w-5 text-red-500"/>
                            <span className="font-medium">{artwork.votes ?? 0} orang menyukai ini</span>
                        </div>
                    </div>
                </div>
                </DialogContent>
            </Dialog>
            ))}
        </div>
      )}
    </section>
  );
}

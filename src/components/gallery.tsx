import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Artwork } from "@/lib/types";
import { Camera } from "lucide-react";

interface GalleryProps {
  artworks: Artwork[];
}

export function Gallery({ artworks }: GalleryProps) {
  return (
    <section id="gallery" className="space-y-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline text-primary">Galeri Karya</h2>
        <p className="text-muted-foreground mt-2">Lihat karya-karya luar biasa dari para peserta.</p>
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
                <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer group transition-all hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="p-0">
                    <div className="aspect-[3/4] relative">
                        <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        data-ai-hint={artwork.imageHint}
                        />
                    </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-card">
                    <CardTitle className="font-headline text-lg truncate group-hover:text-primary">{artwork.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{artwork.name} - {artwork.class}</p>
                    </CardContent>
                </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{artwork.title}</DialogTitle>
                    <DialogDescription>{artwork.name} - {artwork.class}</DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="aspect-[3/4] relative rounded-md overflow-hidden">
                        <Image
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            fill
                            className="object-cover"
                            data-ai-hint={artwork.imageHint}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                        <p className="text-muted-foreground">{artwork.description}</p>
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

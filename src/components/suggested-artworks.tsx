
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { Artwork } from '@/lib/types';

interface SuggestedArtworksProps {
  artworks: Artwork[];
}

export function SuggestedArtworks({ artworks }: SuggestedArtworksProps) {
  if (artworks.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8 pt-12 border-t">
      <div className="text-left">
        <h2 className="text-3xl font-bold font-headline text-primary">Lihat Karya Lainnya</h2>
        <p className="text-muted-foreground mt-2">Jelajahi lebih banyak kreativitas dari peserta lain.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {artworks.map((artwork) => (
          <Link key={artwork.id} href={`/karya/${artwork.id}`} className="block">
            <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 bg-card border-border/50 h-full">
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
              <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <CardTitle className="font-headline text-lg mb-1 truncate group-hover:text-primary">{artwork.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{artwork.name} - {artwork.class}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

    
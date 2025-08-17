
"use client";

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Artwork, JudgeScore } from '@/lib/types';
import { Medal, Trophy, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import React from 'react';
import { getArtworks } from '@/lib/actions';
import { Button } from './ui/button';

interface LeaderboardProps {
  initialArtworks: Artwork[];
  initialHasMore: boolean;
  artworksPerPage: number;
}

const winnerStyles: { [key: number]: { card: string; iconColor: string; bgColor: string; label: string; } } = {
  1: {
    card: 'border-yellow-400/50 shadow-yellow-500/10 shadow-2xl bg-gradient-to-br from-card to-yellow-500/5',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    label: 'Juara 1',
  },
  2: {
    card: 'border-gray-400/50 shadow-gray-500/10 shadow-lg bg-gradient-to-br from-card to-gray-500/5',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Juara 2',
  },
  3: {
    card: 'border-amber-600/50 shadow-amber-600/10 shadow-lg bg-gradient-to-br from-card to-amber-600/5',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    label: 'Juara 3',
  },
};

export function Leaderboard({ initialArtworks, initialHasMore, artworksPerPage }: LeaderboardProps) {

  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  if (artworks.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-6 text-xl font-medium">Belum Ada Karya yang Ditampilkan</h3>
        <p className="mt-2 text-base text-muted-foreground">
          Papan peringkat akan muncul di sini setelah admin memilih karya untuk ditampilkan.
        </p>
      </div>
    );
  }

  const loadMoreArtworks = () => {
    startTransition(async () => {
      const { artworks: newArtworks, hasMore: newHasMore } = await getArtworks({
        page,
        limit: artworksPerPage,
        leaderboardOnly: true,
      });
      setArtworks((prev) => [...prev, ...newArtworks]);
      setPage((prev) => prev + 1);
      setHasMore(newHasMore);
    });
  };
  
  const topThree = artworks.slice(0, 3);
  const others = artworks.slice(3);

  return (
    <div className="space-y-16">
      {topThree.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {topThree.map((winner, index) => (
            <WinnerCard key={winner.id} artwork={winner} rank={index + 1} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <OtherRanks 
          artworks={others} 
          hasMore={hasMore}
          isPending={isPending}
          onLoadMore={loadMoreArtworks}
        />
      )}
    </div>
  );
}

interface WinnerCardProps {
    artwork: Artwork;
    rank: number;
}

function WinnerCard({ artwork, rank }: WinnerCardProps) {
  const style = winnerStyles[rank];
  
  return (
      <Card className={`overflow-hidden transition-all duration-300 bg-card ${style.card} flex flex-col`}>
        <div className='p-6 flex-grow'>
            <div className='flex items-center justify-between'>
              <div className={`inline-flex items-center gap-2 py-1 px-3 rounded-full ${style.bgColor}`}>
                  <Medal className={`w-5 h-5 shrink-0 ${style.iconColor}`} />
                  <span className="font-semibold text-sm">{style.label}</span>
              </div>
              <Badge variant="outline" className="text-base py-1 px-4 border-yellow-500/30 bg-yellow-500/5 text-yellow-300">
                <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                {artwork.totalPoints}
              </Badge>
            </div>
            <CardHeader className='p-0 pt-5'>
                <CardTitle className="font-headline text-2xl">{artwork.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
                <h3 className="font-semibold text-base">{artwork.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Kelas {artwork.class}</p>
                 <Link href={`/karya/${artwork.id}`} className="block">
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden cursor-pointer group">
                      <Image
                          src={artwork.imageUrl || ''}
                          alt={artwork.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white font-semibold">Lihat Detail</p>
                      </div>
                  </div>
                </Link>
            </CardContent>
        </div>
      </Card>
  )
}


function OtherRanks({ artworks, hasMore, isPending, onLoadMore }: { artworks: Artwork[], hasMore: boolean, isPending: boolean, onLoadMore: () => void }) {
    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="font-headline">Peringkat Lainnya</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px]">Peringkat</TableHead>
                            <TableHead>Judul Karya</TableHead>
                            <TableHead>Peserta</TableHead>
                            <TableHead className="text-right">Total Poin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artworks.map((artwork, index) => (
                            <TableRow key={artwork.id}>
                                <TableCell className="font-bold text-lg text-muted-foreground">{index + 4}</TableCell>
                                <TableCell>
                                  <Link href={`/karya/${artwork.id}`} className="hover:text-primary hover:underline">
                                    {artwork.title}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{artwork.name} ({artwork.class})</TableCell>
                                <TableCell className="text-right font-semibold text-lg">{artwork.totalPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {hasMore && (
                    <div className="text-center pt-8">
                        <Button onClick={onLoadMore} disabled={isPending}>
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
            </CardContent>
        </Card>
    )
}

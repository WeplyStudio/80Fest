
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Artwork, JudgeScore } from '@/lib/types';
import { Medal, Trophy, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CommentSection } from './comment-section';
import React from 'react';

interface LeaderboardProps {
  rankedArtworks: Artwork[];
}

const winnerStyles: { [key: number]: { card: string; iconColor: string; bgColor: string; label: string; } } = {
  1: {
    card: 'border-yellow-400 shadow-yellow-200/50 shadow-lg',
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    label: 'Peringkat 1',
  },
  2: {
    card: 'border-gray-400 shadow-gray-200/50 shadow-md',
    iconColor: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: 'Peringkat 2',
  },
  3: {
    card: 'border-amber-600 shadow-amber-900/20 shadow-md',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    label: 'Peringkat 3',
  },
};

export function Leaderboard({ rankedArtworks: initialArtworks }: LeaderboardProps) {
  const [rankedArtworks, setRankedArtworks] = useState(initialArtworks);

   const handleArtworkUpdate = (updatedArtwork: Artwork) => {
      setRankedArtworks(currentArtworks => 
          currentArtworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art)
      );
  };
  
  const findArtworkById = (id: string) => rankedArtworks.find(art => art.id === id);

  if (rankedArtworks.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Belum Ada Karya yang Dinilai</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Peringkat akan muncul di sini setelah proses penilaian dimulai.
        </p>
      </div>
    );
  }

  const topThree = rankedArtworks.slice(0, 3);
  const others = rankedArtworks.slice(3);

  return (
    <div className="space-y-10">
      {topThree.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topThree.map((winner, index) => <WinnerCard key={winner.id} artwork={winner} rank={index + 1} onArtworkUpdate={handleArtworkUpdate} findArtworkById={findArtworkById}/>)}
          </div>
      )}
      {others.length > 0 && <OtherRanks artworks={others} />}
    </div>
  );
}

interface WinnerCardProps {
    artwork: Artwork;
    rank: number;
    onArtworkUpdate: (updatedArtwork: Artwork) => void;
    findArtworkById: (id: string) => Artwork | undefined;
}

function WinnerCard({ artwork, rank, onArtworkUpdate, findArtworkById }: WinnerCardProps) {
  const style = winnerStyles[rank];
  const currentArtwork = findArtworkById(artwork.id) || artwork;
  
  return (
    <Dialog>
      <Card className={`overflow-hidden transition-all bg-card ${style.card} flex flex-col`}>
        <div className='p-6 flex-grow'>
            <div className='flex items-center justify-between'>
              <div className={`inline-flex items-center gap-2 p-2 pr-3 rounded-full ${style.bgColor}`}>
                  <Medal className={`w-6 h-6 shrink-0 ${style.iconColor}`} />
                  <span className="font-semibold">{style.label}</span>
              </div>
              <Badge variant="outline" className="text-lg py-1 px-3">
                <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                {currentArtwork.totalPoints} Poin
              </Badge>
            </div>
            <CardHeader className='p-0 pt-4'>
                <CardTitle className="font-headline text-2xl">{currentArtwork.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
                <h3 className="font-semibold">{currentArtwork.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{currentArtwork.class}</p>
                 <DialogTrigger asChild>
                  <div className="aspect-[3/4] relative rounded-md overflow-hidden cursor-pointer group">
                      <Image
                          src={currentArtwork.imageUrl}
                          alt={currentArtwork.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-semibold">Lihat Detail</p>
                      </div>
                  </div>
                </DialogTrigger>
            </CardContent>
        </div>
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
                    <p className="text-muted-foreground mb-4 text-sm">{currentArtwork.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold font-headline mb-2">Rincian Poin</h3>
                    <ScoreTable scores={currentArtwork.scores || []} totalPoints={currentArtwork.totalPoints || 0} />
                  </div>
                  <CommentSection artwork={currentArtwork} onArtworkUpdate={onArtworkUpdate} />
              </div>
          </div>
      </DialogContent>
    </Dialog>
  )
}


function OtherRanks({ artworks }: { artworks: Artwork[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Peringkat Lainnya</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Pkt.</TableHead>
                            <TableHead>Judul Karya</TableHead>
                            <TableHead>Peserta</TableHead>
                            <TableHead className="text-right">Total Poin</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artworks.map((artwork, index) => (
                            <TableRow key={artwork.id}>
                                <TableCell className="font-bold">{index + 4}</TableCell>
                                <TableCell className="font-medium">{artwork.title}</TableCell>
                                <TableCell>{artwork.name} ({artwork.class})</TableCell>
                                <TableCell className="text-right font-semibold">{artwork.totalPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function ScoreTable({ scores, totalPoints }: { scores: JudgeScore[], totalPoints: number }) {
    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Juri</TableHead>
                        <TableHead>Kriteria</TableHead>
                        <TableHead className="text-right">Poin</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {scores.map((score, scoreIndex) => (
                        <React.Fragment key={`${score.judgeName}-${scoreIndex}`}>
                            <TableRow>
                                <TableCell rowSpan={5} className="font-medium align-top pt-4">{score.judgeName}</TableCell>
                                <TableCell>Kesesuaian Tema</TableCell>
                                <TableCell className="text-right">{score.criteria.theme_match}</TableCell>
                            </TableRow>
                            <TableRow><TableCell>Tata Letak</TableCell><TableCell className="text-right">{score.criteria.layout}</TableCell></TableRow>
                            <TableRow><TableCell>Tipografi & Warna</TableCell><TableCell className="text-right">{score.criteria.typography_color}</TableCell></TableRow>
                            <TableRow><TableCell>Kejelasan Isi</TableCell><TableCell className="text-right">{score.criteria.content_clarity}</TableCell></TableRow>
                            <TableRow className="bg-muted/30">
                                <TableCell className="font-semibold">Subtotal Juri</TableCell>
                                <TableCell className="text-right font-semibold">{score.totalScore}</TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                    {scores.length > 0 && <TableRow><TableCell colSpan={3} className="p-0"><div className="h-px bg-border w-full"></div></TableCell></TableRow>}
                    <TableRow className="bg-muted/50 font-bold text-base">
                        <TableCell colSpan={2}>Total Akhir</TableCell>
                        <TableCell className="text-right">{totalPoints}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}

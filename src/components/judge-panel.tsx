
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Artwork, JudgeScore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Star, MessageCircle, CheckCircle, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { GivePointsDialog } from "./give-points-dialog";
import React from "react";
import { Badge } from "./ui/badge";

interface JudgePanelProps {
    initialArtworks: Artwork[];
    judgeName: string;
    onLogout: () => void;
}

export function JudgePanel({ initialArtworks, judgeName, onLogout }: JudgePanelProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredArtworks = useMemo(() => {
    return artworks.filter(artwork => 
        artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.class.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [artworks, searchTerm]);
  
  const handleUpdateArtworkState = (updatedArtwork: Artwork) => {
    setArtworks(currentArtworks => 
        currentArtworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art)
    );
  }

  const getJudgedByYouBadge = (artwork: Artwork) => {
    const hasJudged = artwork.scores.some(s => s.judgeName === judgeName);
    if (hasJudged) {
      return <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Sudah Dinilai</Badge>
    }
    return null;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline">Dasbor Juri</h1>
            <p className="text-muted-foreground">
            Selamat datang, Juri <span className="font-bold text-primary">{judgeName}</span>. Silakan nilai karya peserta.
            </p>
        </div>
        <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2" />
            Logout
        </Button>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline">Daftar Karya Peserta</h2>
        <Input 
            placeholder="Cari berdasarkan judul, nama, atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
        />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul Karya</TableHead>
                <TableHead>Peserta</TableHead>
                <TableHead>Status Penilaian Anda</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtworks.map((artwork) => (
                <TableRow key={artwork.id}>
                  <TableCell className="font-medium">{artwork.title}</TableCell>
                  <TableCell>{artwork.name} ({artwork.class})</TableCell>
                  <TableCell>{getJudgedByYouBadge(artwork)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DialogTrigger asChild>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                            </DialogTrigger>
                             <GivePointsDialog artwork={artwork} onArtworkUpdate={handleUpdateArtworkState}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Beri / Edit Poin
                                </DropdownMenuItem>
                            </GivePointsDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DialogContent className="max-w-4xl w-full">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-2xl">{artwork.title}</DialogTitle>
                            <DialogDescription>
                              {artwork.name} - {artwork.class}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid md:grid-cols-2 gap-6 items-start">
                              <div className="aspect-[3/4] w-full relative rounded-md overflow-hidden bg-muted">
                                  <Image
                                      src={artwork.imageUrl}
                                      alt={artwork.title}
                                      fill
                                      className="object-contain"
                                  />
                              </div>
                              <div className="flex flex-col gap-4">
                                  <div>
                                    <h3 className="font-semibold font-headline mb-2">Deskripsi Karya</h3>
                                    <p className="text-muted-foreground mb-4 text-sm">{artwork.description}</p>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold font-headline mb-2">Poin Dari Anda</h3>
                                    <ScoreTable scores={artwork.scores || []} judgeName={judgeName} />
                                  </div>
                                   <div className="text-center py-8 text-muted-foreground text-sm rounded-lg bg-card/50 mt-4">
                                        <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                                       <p>Lihat diskusi di halaman detail karya.</p>
                                   </div>
                              </div>
                          </div>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {filteredArtworks.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Tidak ada karya yang cocok dengan pencarian Anda.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}


function ScoreTable({ scores, judgeName }: { scores: JudgeScore[], judgeName: string }) {
    const yourScore = scores.find(s => s.judgeName === judgeName);

    if (!yourScore) {
        return <p className="text-sm text-muted-foreground">Anda belum memberikan penilaian untuk karya ini.</p>
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kriteria</TableHead>
                        <TableHead className="text-right">Poin</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Kesesuaian Tema</TableCell>
                        <TableCell className="text-right">{yourScore.criteria.theme_match}</TableCell>
                    </TableRow>
                    <TableRow><TableCell>Tata Letak</TableCell><TableCell className="text-right">{yourScore.criteria.layout}</TableCell></TableRow>
                    <TableRow><TableCell>Tipografi & Warna</TableCell><TableCell className="text-right">{yourScore.criteria.typography_color}</TableCell></TableRow>
                    <TableRow><TableCell>Kejelasan Isi</TableCell><TableCell className="text-right">{yourScore.criteria.content_clarity}</TableCell></TableRow>
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total Poin Dari Anda</TableCell>
                        <TableCell className="text-right">{yourScore.totalScore}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}


"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Artwork, ContestInfoData, JudgeScore, AnnouncementBannerData } from "@/lib/types";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, Trash, GalleryVertical, GalleryVerticalEnd, Pencil, Star, Users, Layers, MessageCircle, LogOut, ShieldX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteArtwork, toggleGalleryStatus, setSubmissionStatus, setLeaderboardStatus, disqualifyArtwork } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { EditArtworkDialog } from "./edit-artwork-dialog";
import React from "react";
import { Textarea } from "./ui/textarea";
import { ContestInfoEditor } from "./contest-info-editor";
import { AnnouncementBannerEditor } from "./announcement-banner-editor";


interface AdminPanelProps {
    initialArtworks: Artwork[];
    initialSubmissionStatus: boolean;
    initialLeaderboardStatus: boolean;
    initialContestInfo: ContestInfoData;
    initialBannerInfo: AnnouncementBannerData;
    onLogout: () => void;
}

export function AdminPanel({ initialArtworks, initialSubmissionStatus, initialLeaderboardStatus, initialContestInfo, initialBannerInfo, onLogout }: AdminPanelProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [submissionOpen, setSubmissionOpen] = useState(initialSubmissionStatus);
  const [leaderboardVisible, setLeaderboardVisible] = useState(initialLeaderboardStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const stats = useMemo(() => {
    const totalArtworks = artworks.length;
    const totalParticipants = totalArtworks;

    const artworksByClass = artworks.reduce((acc, art) => {
        if (["VII", "VIII", "IX"].includes(art.class)) {
            acc[art.class] = (acc[art.class] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return {
        totalArtworks,
        totalParticipants,
        artworksByClass: Object.entries(artworksByClass).sort((a,b) => a[0].localeCompare(b[0]))
    };
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    return artworks.filter(artwork => 
        artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.class.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.totalPoints - a.totalPoints);
  }, [artworks, searchTerm]);
  
  const handleUpdateArtworkState = (updatedArtwork: Artwork) => {
    setArtworks(currentArtworks => 
        currentArtworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art)
    );
  }

  const handleToggleGallery = async (artworkId: string, currentStatus: boolean) => {
    const result = await toggleGalleryStatus(artworkId, currentStatus);
    if (result.success) {
        setArtworks(prev => prev.map(art => art.id === artworkId ? { ...art, isInGallery: !currentStatus } : art));
        toast({
            title: "Status Galeri Diperbarui",
            description: `Karya telah ${!currentStatus ? 'ditambahkan ke' : 'dihapus dari'} galeri.`
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

  const handleDelete = async (artworkId: string) => {
    const result = await deleteArtwork(artworkId);
    if (result.success) {
        setArtworks(prev => prev.filter(art => art.id !== artworkId));
        toast({
            variant: "destructive",
            title: "Karya Dihapus",
            description: "Karya peserta telah berhasil dihapus."
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };
  
  const handleDisqualify = async (artworkId: string, reason: string) => {
      const result = await disqualifyArtwork(artworkId, reason, true);
      if (result.success) {
        setArtworks(prev => prev.map(art => art.id === artworkId ? { ...art, isDisqualified: true, disqualificationReason: reason, totalPoints: 0, scores:[] } : art));
        toast({ title: 'Karya Didiskualifikasi', description: `Karya telah didiskualifikasi karena: ${reason}` });
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: result.message });
      }
  };

  const handleRequalify = async (artworkId: string) => {
      const result = await disqualifyArtwork(artworkId, "", false);
      if (result.success) {
        setArtworks(prev => prev.map(art => art.id === artworkId ? { ...art, isDisqualified: false, disqualificationReason: null } : art));
        toast({ title: 'Diskualifikasi Dibatalkan', description: 'Karya kini dapat dinilai kembali.' });
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: result.message });
      }
  };

  const handleSubmissionToggle = async (checked: boolean) => {
    const result = await setSubmissionStatus(checked);
    if (result.success) {
        setSubmissionOpen(result.newState);
        toast({
            title: `Pendaftaran Karya ${result.newState ? "Dibuka" : "Ditutup"}`,
            description: `Peserta sekarang ${result.newState ? "bisa" : "tidak bisa"} mengunggah karya.`,
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  }

  const handleLeaderboardToggle = async (checked: boolean) => {
    const result = await setLeaderboardStatus(checked);
    if (result.success) {
        setLeaderboardVisible(result.newState);
        toast({
            title: `Papan Peringkat ${result.newState ? "Ditampilkan" : "Disembunyikan"}`,
            description: `Hasil akhir sekarang ${result.newState ? "bisa" : "tidak bisa"} dilihat publik.`,
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  }

  const getStatusBadge = (artwork: Artwork) => {
    if (artwork.isDisqualified) {
        return <Badge variant="destructive" className="bg-red-900/50 text-red-300 border-red-500/30">{artwork.disqualificationReason}</Badge>
    }
    if (artwork.isInGallery) {
        return <Badge variant="secondary">Di Galeri</Badge>
    }
    return null;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dasbor Admin</h1>
          <p className="text-muted-foreground">
            Kelola semua karya yang telah diunggah oleh peserta dan atur pendaftaran.
          </p>
        </div>
        <Button variant="outline" onClick={onLogout}>
            <LogOut className="mr-2" />
            Logout
        </Button>
      </div>
      
      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Analitik Lomba</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Karya Masuk</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalArtworks}</div>
                    <p className="text-xs text-muted-foreground">Karya telah diunggah</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                    <p className="text-xs text-muted-foreground">Orang telah berpartisipasi</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Karya per Kelas</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {stats.artworksByClass.length > 0 ? (
                        <ul className="space-y-1">
                        {stats.artworksByClass.map(([className, count]) => (
                            <li key={className} className="flex justify-between">
                                <span className="font-medium text-foreground">Kelas {className}</span>
                                <span>{count} karya</span>
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p>Belum ada karya.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <AnnouncementBannerEditor initialData={initialBannerInfo} />
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Pengaturan Lomba</CardTitle>
                <CardDescription>Atur status pendaftaran dan visibilitas papan peringkat.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-1 gap-4">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Buka Pendaftaran Karya</p>
                        <p className="text-sm text-muted-foreground">
                            Jika aktif, peserta dapat mengunggah karya mereka.
                        </p>
                    </div>
                    <Switch
                        checked={submissionOpen}
                        onCheckedChange={handleSubmissionToggle}
                        id="submission-status"
                    />
                </div>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Tampilkan Papan Peringkat</p>
                        <p className="text-sm text-muted-foreground">
                            Jika aktif, hasil akhir akan tampil di halaman papan peringkat.
                        </p>
                    </div>
                    <Switch
                        checked={leaderboardVisible}
                        onCheckedChange={handleLeaderboardToggle}
                        id="leaderboard-status"
                    />
                </div>
            </CardContent>
        </Card>
      </div>

      <ContestInfoEditor initialData={initialContestInfo} />
      
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
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Total Poin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtworks.map((artwork) => (
                <TableRow key={artwork.id} className={artwork.isDisqualified ? "bg-red-900/20" : ""}>
                  <TableCell className="font-medium">{artwork.title}</TableCell>
                  <TableCell>{artwork.name} ({artwork.class})</TableCell>
                   <TableCell className="font-semibold">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {artwork.totalPoints}
                    </div>
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                      {getStatusBadge(artwork)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <AlertDialog>
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
                             <EditArtworkDialog artwork={artwork} onArtworkUpdate={handleUpdateArtworkState}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Data
                                </DropdownMenuItem>
                            </EditArtworkDialog>
                            <DropdownMenuItem onClick={() => handleToggleGallery(artwork.id, artwork.isInGallery)} disabled={artwork.isDisqualified}>
                              {artwork.isInGallery ? <GalleryVerticalEnd className="mr-2 h-4 w-4" /> : <GalleryVertical className="mr-2 h-4 w-4" />}
                              {artwork.isInGallery ? 'Hapus dari Galeri' : 'Tambahkan ke Galeri'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             {artwork.isDisqualified ? (
                                <DropdownMenuItem onClick={() => handleRequalify(artwork.id)}>
                                    <ShieldX className="mr-2 h-4 w-4" />
                                    Batalkan Diskualifikasi
                                </DropdownMenuItem>
                             ) : (
                                <DisqualifyDialog onDisqualify={handleDisqualify} artwork={artwork} />
                             )}
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus Karya
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Dialog for View Details */}
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
                                    <h3 className="font-semibold font-headline mb-2">Rincian Poin</h3>
                                    <ScoreTable scores={artwork.scores || []} totalPoints={artwork.totalPoints || 0} />
                                  </div>
                                   <div className="text-center py-8 text-muted-foreground text-sm rounded-lg bg-card/50 mt-4">
                                        <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                                       <p>Komentar dinonaktifkan untuk kontes ini.</p>
                                   </div>
                              </div>
                          </div>
                        </DialogContent>
                        
                        {/* Alert Dialog for Delete */}
                        <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Tindakan ini tidak dapat diurungkan. Ini akan menghapus karya "{artwork.title}" secara permanen dari data.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(artwork.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Ya, Hapus
                              </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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


function ScoreTable({ scores, totalPoints }: { scores: JudgeScore[], totalPoints: number }) {
    if (scores.length === 0) {
        return <p className="text-sm text-muted-foreground p-4 text-center">Belum ada skor yang diberikan.</p>
    }
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

function DisqualifyDialog({ artwork, onDisqualify }: { artwork: Artwork, onDisqualify: (id: string, reason: string) => void }) {
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);

    const handleSubmit = () => {
        if (reason.trim()) {
            onDisqualify(artwork.id, reason);
            setOpen(false);
            setReason("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                    <ShieldX className="mr-2 h-4 w-4" />
                    Diskualifikasi Karya
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Diskualifikasi Karya "{artwork.title}"?</DialogTitle>
                    <DialogDescription>
                        Tindakan ini akan menghapus semua skor dan poin, dan karya tidak akan bisa dinilai lagi. Berikan alasan diskualifikasi.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <label htmlFor="reason" className="text-sm font-medium">Alasan Diskualifikasi</label>
                    <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: Plagiarisme, Tidak sesuai tema, dll."
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                    <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim()}>
                        Ya, Diskualifikasi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

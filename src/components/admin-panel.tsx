
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Artwork } from "@/lib/types";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, Trash, Award, GalleryVertical, GalleryVerticalEnd, Pencil, Heart } from "lucide-react";
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
import { deleteArtwork, removeWinnerStatus, setWinnerStatus, toggleGalleryStatus, setSubmissionStatus } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { EditArtworkDialog } from "./edit-artwork-dialog";


interface AdminPanelProps {
    initialArtworks: Artwork[];
    initialSubmissionStatus: boolean;
}

export function AdminPanel({ initialArtworks, initialSubmissionStatus }: AdminPanelProps) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [submissionOpen, setSubmissionOpen] = useState(initialSubmissionStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredArtworks = useMemo(() => {
    return artworks.filter(artwork => 
        artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artwork.class.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [artworks, searchTerm]);
  
  // This function is passed to the Edit dialog to update the state here
  const handleUpdateArtworkState = (updatedArtwork: Artwork) => {
    setArtworks(currentArtworks => 
        currentArtworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art)
    );
  }

  const handleSetWinner = async (artworkId: string, rank: number) => {
    const result = await setWinnerStatus(artworkId, rank);
    if (result.success) {
      setArtworks(prev => prev.map(art => {
          if (art.status_juara === rank) return { ...art, status_juara: 0 };
          if (art.id === artworkId) return { ...art, status_juara: rank, isInGallery: true };
          return art;
      }));
      toast({ title: "Status Juara Diperbarui", description: `Karya telah ditetapkan sebagai Juara ${rank}.` });
    } else {
      toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

  const handleRemoveWinner = async (artworkId: string) => {
    const result = await removeWinnerStatus(artworkId);
    if(result.success) {
      setArtworks(prev => prev.map(art => art.id === artworkId ? { ...art, status_juara: 0 } : art));
      toast({ title: "Status Juara Dihapus", description: `Karya tidak lagi menjadi juara.` });
    } else {
       toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
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

  const getWinnerBadge = (status: number) => {
    if (status === 0) return null;
    const colors: { [key: number]: string } = {
        1: "bg-yellow-400 text-yellow-900",
        2: "bg-gray-400 text-gray-900",
        3: "bg-amber-600 text-amber-50",
    }
    return <Badge className={colors[status]}>Juara {status}</Badge>
  }

  const getGalleryBadge = (inGallery: boolean) => {
    if (!inGallery) return null;
    return <Badge variant="secondary">Di Galeri</Badge>
  }
  
  const getVotesBadge = (votes: number) => {
    return <Badge variant="outline" className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> {votes}</Badge>
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dasbor Admin</h1>
        <p className="text-muted-foreground">
          Kelola semua karya yang telah di-upload oleh peserta dan atur pendaftaran.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Pengaturan Lomba</CardTitle>
            <CardDescription>Atur status pendaftaran karya untuk peserta.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Buka Pendaftaran Karya</p>
                    <p className="text-sm text-muted-foreground">
                        Jika aktif, peserta dapat mengunggah karya mereka melalui halaman utama.
                    </p>
                </div>
                 <Switch
                    checked={submissionOpen}
                    onCheckedChange={handleSubmissionToggle}
                    id="submission-status"
                />
            </div>
        </CardContent>
      </Card>
      
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
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtworks.map((artwork) => (
                <TableRow key={artwork.id}>
                  <TableCell className="font-medium">{artwork.title}</TableCell>
                  <TableCell>{artwork.name}</TableCell>
                  <TableCell>{artwork.class}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                      {getWinnerBadge(artwork.status_juara)}
                      {getGalleryBadge(artwork.isInGallery)}
                      {getVotesBadge(artwork.votes)}
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
                            <DropdownMenuItem onClick={() => handleToggleGallery(artwork.id, artwork.isInGallery)}>
                              {artwork.isInGallery ? <GalleryVerticalEnd className="mr-2 h-4 w-4" /> : <GalleryVertical className="mr-2 h-4 w-4" />}
                              {artwork.isInGallery ? 'Hapus dari Galeri' : 'Tambahkan ke Galeri'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSetWinner(artwork.id, 1)}>
                              <Award className="mr-2 h-4 w-4 text-yellow-500" />
                              Jadikan Juara 1
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSetWinner(artwork.id, 2)}>
                              <Award className="mr-2 h-4 w-4 text-gray-500" />
                              Jadikan Juara 2
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleSetWinner(artwork.id, 3)}>
                              <Award className="mr-2 h-4 w-4 text-amber-600" />
                              Jadikan Juara 3
                            </DropdownMenuItem>
                            {artwork.status_juara > 0 && <DropdownMenuItem onClick={() => handleRemoveWinner(artwork.id)}>Hapus Status Juara</DropdownMenuItem>}
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

"use client";

import { useState } from "react";
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
import { Eye, MoreHorizontal, Trash, Award, GalleryVertical, GalleryVerticalEnd } from "lucide-react";
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
import { deleteArtwork, removeWinnerStatus, setWinnerStatus, toggleGalleryStatus } from "@/lib/actions";

export function AdminPanel({ initialArtworks }: { initialArtworks: Artwork[] }) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const { toast } = useToast();

  const handleSetWinner = async (artworkId: string, rank: number) => {
    const result = await setWinnerStatus(artworkId, rank);
    if (result.success) {
      toast({ title: "Status Juara Diperbarui", description: `Karya telah ditetapkan sebagai Juara ${rank}.` });
    } else {
      toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

  const handleRemoveWinner = async (artworkId: string) => {
    const result = await removeWinnerStatus(artworkId);
    if(result.success) {
      toast({ title: "Status Juara Dihapus", description: `Karya tidak lagi menjadi juara.` });
    } else {
       toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  }

  const handleToggleGallery = async (artworkId: string, currentStatus: boolean) => {
    const result = await toggleGalleryStatus(artworkId, currentStatus);
    if (result.success) {
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
        toast({
            variant: "destructive",
            title: "Karya Dihapus",
            description: "Karya peserta telah berhasil dihapus."
        });
    } else {
        toast({ variant: 'destructive', title: "Gagal", description: result.message });
    }
  };

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dasbor Admin</h1>
        <p className="text-muted-foreground">
          Kelola semua karya yang telah di-upload oleh peserta.
        </p>
      </div>
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
            {initialArtworks.map((artwork) => (
              <TableRow key={artwork.id}>
                <TableCell className="font-medium">{artwork.title}</TableCell>
                <TableCell>{artwork.name}</TableCell>
                <TableCell>{artwork.class}</TableCell>
                <TableCell className="space-x-1">
                    {getWinnerBadge(artwork.status_juara)}
                    {getGalleryBadge(artwork.isInGallery)}
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
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle className="font-headline text-2xl">{artwork.title}</DialogTitle>
                          <DialogDescription>
                            {artwork.name} - {artwork.class}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            <div className="aspect-[3/4] relative rounded-md overflow-hidden bg-muted">
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
      </div>
    </div>
  );
}

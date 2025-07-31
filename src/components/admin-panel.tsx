"use client";

import { useState } from "react";
import Image from "next/image";
import { artworks as initialArtworks, type Artwork } from "@/lib/mock-data";
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
import { Eye, MoreHorizontal, Trash, Award } from "lucide-react";
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

export function AdminPanel() {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const { toast } = useToast();

  const handleSetWinner = (artworkId: number, rank: number) => {
    setArtworks((prevArtworks) => {
      // Create a new array to avoid direct mutation
      const newArtworks = prevArtworks.map(art => ({...art}));
      
      // Remove the rank from any current holder
      const currentWinner = newArtworks.find(art => art.status_juara === rank);
      if (currentWinner) {
        currentWinner.status_juara = 0;
      }

      // Assign the new rank
      const targetArtwork = newArtworks.find(art => art.id === artworkId);
      if(targetArtwork) {
        targetArtwork.status_juara = rank;
      }
      
      return newArtworks;
    });
    toast({ title: "Status Juara Diperbarui", description: `Karya telah ditetapkan sebagai Juara ${rank}.` });
  };
  
  const handleRemoveWinner = (artworkId: number) => {
    setArtworks((prevArtworks) => 
      prevArtworks.map(art => art.id === artworkId ? {...art, status_juara: 0} : art)
    );
     toast({ title: "Status Juara Dihapus", description: `Karya tidak lagi menjadi juara.` });
  }

  const handleDelete = (artworkId: number) => {
    setArtworks((prevArtworks) =>
      prevArtworks.filter((art) => art.id !== artworkId)
    );
    toast({
        variant: "destructive",
        title: "Karya Dihapus",
        description: "Karya peserta telah berhasil dihapus."
    });
  };

  const getWinnerBadge = (status: number) => {
    if (status === 0) return null;
    const colors = {
        1: "bg-yellow-400 text-yellow-900",
        2: "bg-gray-400 text-gray-900",
        3: "bg-amber-600 text-amber-50",
    }
    return <Badge className={colors[status as keyof typeof colors]}>Juara {status}</Badge>
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
            {artworks.map((artwork) => (
              <TableRow key={artwork.id}>
                <TableCell className="font-medium">{artwork.title}</TableCell>
                <TableCell>{artwork.name}</TableCell>
                <TableCell>{artwork.class}</TableCell>
                <TableCell>{getWinnerBadge(artwork.status_juara)}</TableCell>
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

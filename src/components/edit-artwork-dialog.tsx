
"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { updateArtwork } from "@/lib/actions";
import type { Artwork } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const classes = ["VII", "VIII", "IX"] as const;

const editSchema = z.object({
  name: z.string().min(3, "Nama harus diisi, minimal 3 karakter."),
  class: z.enum(classes, { required_error: "Kelas harus dipilih." }),
  title: z.string().min(5, "Judul karya harus diisi, minimal 5 karakter."),
  description: z.string().min(10, "Deskripsi harus diisi, minimal 10 karakter.").max(300, "Deskripsi maksimal 300 karakter."),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditArtworkDialogProps {
  children: ReactNode;
  artwork: Artwork;
  onArtworkUpdate: (updatedArtwork: Artwork) => void;
}

export function EditArtworkDialog({ children, artwork, onArtworkUpdate }: EditArtworkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: artwork.name,
      class: artwork.class as "VII" | "VIII" | "IX",
      title: artwork.title,
      description: artwork.description,
    },
  });

  async function onSubmit(data: EditFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    
    formData.append('name', data.name);
    formData.append('class', data.class);
    formData.append('title', data.title);
    formData.append('description', data.description);

    const result = await updateArtwork(artwork.id, formData);

    if (result.success) {
      toast({
        title: "Data Karya Diperbarui!",
        description: "Perubahan telah berhasil disimpan.",
      });
      onArtworkUpdate({ ...artwork, ...data });
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Data",
        description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Data Karya</DialogTitle>
          <DialogDescription>
            Perbarui detail untuk karya "{artwork.title}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kelas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kelas" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Karya</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Singkat</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

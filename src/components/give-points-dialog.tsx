
"use client";

import { useState, type ReactNode, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";
import { givePoints } from "@/lib/actions";
import type { Artwork, ScoreCriteria } from "@/lib/types";
import { Slider } from "./ui/slider";

const criteriaSchema = z.object({
  theme_match: z.number().min(1).max(10),
  layout: z.number().min(1).max(10),
  typography_color: z.number().min(1).max(10),
  content_clarity: z.number().min(1).max(10),
});

const pointsSchema = z.object({
  criteria: criteriaSchema,
});

type PointsFormValues = z.infer<typeof pointsSchema>;

interface GivePointsDialogProps {
  children: ReactNode;
  artwork: Artwork;
  onArtworkUpdate: (updatedArtwork: Artwork) => void;
}

const criteriaLabels: { key: keyof ScoreCriteria; label: string }[] = [
    { key: 'theme_match', label: 'Kesesuaian dengan Tema' },
    { key: 'layout', label: 'Tata Letak (Layout)' },
    { key: 'typography_color', label: 'Tipografi & Warna' },
    { key: 'content_clarity', label: 'Kejelasan Isi/Konten' },
];

export function GivePointsDialog({ children, artwork, onArtworkUpdate }: GivePointsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [isLoadingJudge, setIsLoadingJudge] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setIsLoadingJudge(true);
      const cookie = document.cookie.split('; ').find(row => row.startsWith('judge-name='));
      const name = cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
      setJudgeName(name);
      setIsLoadingJudge(false);
    }
  }, [open]);

  const isAlreadyJudged = judgeName ? artwork.scores.some(s => s.judgeName === judgeName) : false;

  const form = useForm<PointsFormValues>({
    resolver: zodResolver(pointsSchema),
    defaultValues: {
      criteria: {
        theme_match: 5,
        layout: 5,
        typography_color: 5,
        content_clarity: 5
      }
    },
  });
  
  const watchedCriteria = form.watch('criteria');
  const totalScore = Object.values(watchedCriteria).reduce((sum, val) => sum + val, 0);

  async function onSubmit(data: PointsFormValues) {
    if (!judgeName) {
        toast({
            variant: "destructive",
            title: "Juri Tidak Dikenal",
            description: "Harap login sebagai juri terlebih dahulu.",
        });
        return;
    }
    
    setIsSubmitting(true);
    
    const result = await givePoints(artwork.id, judgeName, data.criteria);

    if (result.success && result.updatedArtwork) {
      toast({
        title: "Poin Berhasil Diberikan!",
        description: `Poin dari ${judgeName} telah ditambahkan.`,
      });
      onArtworkUpdate(result.updatedArtwork);
      
      setOpen(false);
      form.reset({ criteria: { theme_match: 5, layout: 5, typography_color: 5, content_clarity: 5 } });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memberikan Poin",
        description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    }
    setIsSubmitting(false);
  }
  
  const renderContent = () => {
      if (isLoadingJudge) {
          return <div className="py-8 text-center text-muted-foreground">Memeriksa status juri...</div>;
      }

      if (!judgeName) {
          return (
            <div className="py-8 text-center text-destructive">
                <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-bold">Akses Ditolak</h3>
                <p className="text-muted-foreground">Anda harus login sebagai juri untuk memberikan poin.</p>
            </div>
          );
      }
      
      if (isAlreadyJudged) {
          return (
             <div className="py-8 text-center text-muted-foreground">
                <p>Anda (<span className="font-bold text-primary">{judgeName}</span>) sudah memberikan penilaian untuk karya ini.</p>
            </div>
          );
      }

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-3 bg-muted/50 rounded-md text-center">
                Menilai sebagai: <span className="font-bold text-primary">{judgeName}</span>
            </div>
            
            <div className="space-y-4">
                {criteriaLabels.map(({ key, label }) => (
                     <FormField
                        key={key}
                        control={form.control}
                        name={`criteria.${key}`}
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between items-center">
                                    <FormLabel>{label}</FormLabel>
                                    <span className="text-sm font-bold text-primary w-4 text-center">{field.value}</span>
                                </div>
                                <FormControl>
                                    <Slider
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={[field.value]}
                                        onValueChange={(value) => field.onChange(value[0])}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                ))}
            </div>
            
            <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                <span className="font-bold">Total Poin dari Juri Ini</span>
                <span className="font-bold text-xl text-primary">{totalScore} / 40</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Poin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Beri Poin untuk "{artwork.title}"</DialogTitle>
          <DialogDescription>
            Berikan poin (1-10) untuk setiap kriteria.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

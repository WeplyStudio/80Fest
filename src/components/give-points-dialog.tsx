
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { givePoints } from "@/lib/actions";
import type { Artwork, ScoreCriteria } from "@/lib/types";
import { Slider } from "./ui/slider";

const judges = ["Iqbal", "Jason", "Kyora"];

const criteriaSchema = z.object({
  theme_match: z.number().min(1).max(10),
  layout: z.number().min(1).max(10),
  typography_color: z.number().min(1).max(10),
  content_clarity: z.number().min(1).max(10),
});

const pointsSchema = z.object({
  judgeName: z.string().refine(val => judges.includes(val), { message: "Pilih juri yang valid." }),
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
  const { toast } = useToast();

  const availableJudges = judges.filter(
    judge => !artwork.scores.some(s => s.judgeName === judge)
  );

  const form = useForm<PointsFormValues>({
    resolver: zodResolver(pointsSchema),
    defaultValues: {
      judgeName: availableJudges[0] || "",
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
    setIsSubmitting(true);
    
    const result = await givePoints(artwork.id, data.judgeName, data.criteria);

    if (result.success && result.updatedArtwork) {
      toast({
        title: "Poin Berhasil Diberikan!",
        description: `Poin dari ${data.judgeName} telah ditambahkan.`,
      });
      onArtworkUpdate(result.updatedArtwork);
      
      setOpen(false);
      form.reset({ judgeName: availableJudges.length > 1 ? availableJudges[1] : "", criteria: { theme_match: 5, layout: 5, typography_color: 5, content_clarity: 5 } });
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Memberikan Poin",
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
          <DialogTitle className="font-headline">Beri Poin untuk "{artwork.title}"</DialogTitle>
          <DialogDescription>
            Pilih juri dan berikan poin (1-10) untuk setiap kriteria. Juri yang sudah menilai tidak akan muncul.
          </DialogDescription>
        </DialogHeader>
         {availableJudges.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Semua juri sudah memberikan penilaian untuk karya ini.
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="judgeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Juri</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih juri" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {availableJudges.map(judge => (
                            <SelectItem key={judge} value={judge}>{judge}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
        )}
      </DialogContent>
    </Dialog>
  );
}

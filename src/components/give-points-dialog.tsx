
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { givePoints } from "@/lib/actions";
import type { Artwork } from "@/lib/types";

const judges = ["Iqbal", "Jason", "Kyora"];

const pointsSchema = z.object({
  judgeName: z.string().refine(val => judges.includes(val), { message: "Pilih juri yang valid." }),
  score: z.coerce.number().min(1, "Poin minimal 1.").max(10, "Poin maksimal 10."),
});

type PointsFormValues = z.infer<typeof pointsSchema>;

interface GivePointsDialogProps {
  children: ReactNode;
  artwork: Artwork;
  onArtworkUpdate: (updatedArtwork: Artwork) => void;
}

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
      score: 1,
    },
  });

  async function onSubmit(data: PointsFormValues) {
    setIsSubmitting(true);
    
    const result = await givePoints(artwork.id, data.judgeName, data.score);

    if (result.success) {
      toast({
        title: "Poin Berhasil Diberikan!",
        description: `Poin dari ${data.judgeName} telah ditambahkan.`,
      });
      // Manually update the state on the parent component
      const newScores = [...artwork.scores, { judgeName: data.judgeName, score: data.score }];
      const newTotalPoints = newScores.reduce((acc, curr) => acc + curr.score, 0);
      onArtworkUpdate({ ...artwork, scores: newScores, totalPoints: newTotalPoints });
      
      setOpen(false);
      form.reset({ judgeName: "", score: 1 });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Beri Poin untuk "{artwork.title}"</DialogTitle>
          <DialogDescription>
            Pilih juri dan masukkan poin (1-10). Juri yang sudah menilai tidak akan muncul di daftar.
          </DialogDescription>
        </DialogHeader>
         {availableJudges.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Semua juri sudah memberikan penilaian untuk karya ini.
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poin (1-10)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="10" {...field} />
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

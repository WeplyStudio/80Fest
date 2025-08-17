
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import type { Comment } from "@/lib/types";
import { addComment } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { id } from 'date-fns/locale';

interface CommentSectionProps {
  artworkId: string;
  comments: Comment[];
  onCommentAdded: (newComment: Comment) => void;
}

const commentSchema = z.object({
  authorName: z.string().min(2, "Nama minimal 2 karakter.").max(50, "Nama maksimal 50 karakter."),
  text: z.string().min(3, "Komentar minimal 3 karakter.").max(500, "Komentar maksimal 500 karakter."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export function CommentSection({ artworkId, comments, onCommentAdded }: CommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      authorName: "",
      text: "",
    },
  });

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    setIsSubmitting(true);
    const result = await addComment(artworkId, data.authorName, data.text);
    if (result.success) {
      toast({
        title: "Komentar Terkirim!",
        description: "Komentar Anda akan tampil setelah dimoderasi oleh admin.",
      });
      form.reset();
      if (result.comment) {
        onCommentAdded(result.comment);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Komentar",
        description: result.message || "Terjadi kesalahan.",
      });
    }
    setIsSubmitting(false);
  };
  
  return (
    <section id="comments" className="space-y-8 pt-12 border-t">
        <h2 className="text-3xl font-bold font-headline text-primary">Diskusi & Apresiasi</h2>
        <div className="grid md:grid-cols-2 gap-12">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle>Tinggalkan Komentar</CardTitle>
                    <CardDescription>Bagikan pendapat atau apresiasi Anda tentang karya ini.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="authorName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Nama Anda" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Tulis komentar Anda..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Mengirim...
                                    </>
                                    ) : (
                                    "Kirim Komentar"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
             <div className="space-y-6">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                             <div className="bg-muted rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center">
                                <span className="font-bold text-sm text-foreground">{comment.authorName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-semibold">{comment.authorName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(comment.createdAt), "d MMMM yyyy", { locale: id })}
                                    </p>
                                </div>
                                <p className="text-muted-foreground">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-xl bg-card/50">
                        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Belum Ada Komentar</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Jadilah yang pertama memberikan apresiasi!
                        </p>
                    </div>
                )}
            </div>
        </div>
    </section>
  );
}

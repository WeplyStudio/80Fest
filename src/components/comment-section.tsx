
"use client";

import { useState, useOptimistic, useRef } from 'react';
import type { Artwork, Comment } from "@/lib/types";
import { addComment } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';

interface CommentSectionProps {
    artwork: Artwork;
}

export function CommentSection({ artwork }: CommentSectionProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Use useOptimistic to show the new comment immediately
    const [optimisticComments, addOptimisticComment] = useOptimistic<Comment[], string>(
        artwork.comments,
        (state, newCommentText) => [
            {
                id: Math.random().toString(), // temporary ID
                text: newCommentText,
                createdAt: new Date(),
            },
            ...state,
        ]
    );

    const handleAddComment = async (formData: FormData) => {
        const commentText = formData.get('commentText') as string;
        if (!commentText.trim()) return;

        addOptimisticComment(commentText);
        setIsSubmitting(true);
        formRef.current?.reset();
        
        const result = await addComment(artwork.id, formData);
        
        if (result.success) {
            toast({ title: 'Komentar berhasil dikirim!' });
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal mengirim komentar',
                description: result.message,
            });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="font-semibold font-headline">Komentar</h3>
            <form action={handleAddComment} ref={formRef} className="space-y-2">
                <Textarea
                    name="commentText"
                    placeholder="Tulis komentar anonim..."
                    rows={2}
                    className="resize-none"
                    required
                    disabled={isSubmitting}
                />
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kirim Komentar
                    </Button>
                </div>
            </form>

            <div className="space-y-4">
                {optimisticComments.length > 0 ? (
                    optimisticComments.map((comment) => (
                        <div key={comment.id} className="text-sm bg-muted/50 p-3 rounded-lg">
                            <p className="text-foreground">{comment.text}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: indonesianLocale })}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                         <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>Belum ada komentar. Jadilah yang pertama!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

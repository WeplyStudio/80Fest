
"use client";

import { useState, useOptimistic, useRef, Fragment } from 'react';
import type { Artwork, Comment } from "@/lib/types";
import { addComment } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, CornerDownRight } from 'lucide-react';
import { Separator } from './ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { id as indonesianLocale } from 'date-fns/locale';

interface CommentSectionProps {
    artwork: Artwork;
    onArtworkUpdate: (updatedArtwork: Artwork) => void;
}

export function CommentSection({ artwork, onArtworkUpdate }: CommentSectionProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [optimisticComments, setOptimisticComments] = useOptimistic<Comment[], { text: string; parentId: string | null }>(
        artwork.comments,
        (state, { text, parentId }) => {
            const newComment: Comment = {
                id: Math.random().toString(), // temporary ID
                text: text,
                createdAt: new Date(),
                parentId: parentId,
                replies: []
            };
            if (parentId) {
                 return state.map(comment => 
                    comment.id === parentId 
                    ? { ...comment, replies: [...(comment.replies || []), newComment] }
                    : comment
                );
            }
            return [newComment, ...state];
        }
    );

    const handleAddComment = async (formData: FormData) => {
        const commentText = formData.get('commentText') as string;
        if (!commentText.trim()) return;

        setIsSubmitting(true);
        const currentReplyTo = replyTo;
        setReplyTo(null);

        setOptimisticComments({ text: commentText, parentId: currentReplyTo });
        
        const result = await addComment(artwork.id, formData, currentReplyTo);
        
        if (result.success && result.updatedArtwork) {
            onArtworkUpdate(result.updatedArtwork);
            toast({ title: 'Komentar berhasil dikirim!' });
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal mengirim komentar',
                description: result.message,
            });
            // Revert optimistic update if server failed
            onArtworkUpdate(artwork); 
        }
        setIsSubmitting(false);
        (formRef.current?.querySelector('textarea') as HTMLTextAreaElement).value = '';
    };
    
    const renderComments = (comments: Comment[], isReply: boolean = false) => {
        return comments.map(comment => (
            <Fragment key={comment.id}>
                <div className={`text-sm bg-muted/50 p-3 rounded-lg ${isReply ? 'ml-6' : ''}`}>
                    <p className="text-foreground">{comment.text}</p>
                    <div className='flex justify-between items-center'>
                         <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: indonesianLocale })}
                        </p>
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => setReplyTo(comment.id)}>
                            Balas
                        </Button>
                    </div>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-6 border-l-2 ml-3">
                        {renderComments(comment.replies, true)}
                    </div>
                )}
            </Fragment>
        ));
    };

    const topLevelComments = optimisticComments.filter(c => !c.parentId);

    return (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="font-semibold font-headline">Komentar</h3>
            <form action={handleAddComment} ref={formRef} className="space-y-2">
                 {replyTo && (
                    <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md flex justify-between items-center">
                        <span>Membalas komentar...</span>
                        <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Batal</Button>
                    </div>
                )}
                <Textarea
                    name="commentText"
                    placeholder={replyTo ? "Tulis balasan anonim..." : "Tulis komentar anonim..."}
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

            <div className="space-y-3">
                {topLevelComments.length > 0 ? (
                    renderComments(topLevelComments)
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


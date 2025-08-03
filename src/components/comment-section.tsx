
"use client";

import { useState, useOptimistic, useRef, Fragment, useMemo } from 'react';
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
    
    // Filter out pending comments for public view
    const approvedComments = useMemo(() => {
        return artwork.comments.filter(comment => !comment.isPendingModeration);
    }, [artwork.comments]);
    
    const [optimisticComments, setOptimisticComments] = useOptimistic<Comment[], { text: string; parentId: string | null }>(
        approvedComments,
        (state, { text, parentId }) => {
            // Optimistic updates won't show pending comments, as they might not be approved.
            // The user gets a toast message instead.
            return state;
        }
    );

    const handleAddComment = async (formData: FormData) => {
        const commentText = formData.get('commentText') as string;
        if (!commentText.trim()) return;

        setIsSubmitting(true);
        const currentReplyTo = replyTo;
        
        setReplyTo(null);
        if (formRef.current) {
            (formRef.current.querySelector('textarea') as HTMLTextAreaElement).value = '';
        }
        
        const result = await addComment(artwork.id, formData, currentReplyTo);
        
        if (result.success && result.updatedArtwork) {
            const newComment = result.updatedArtwork.comments[result.updatedArtwork.comments.length - 1];
            if (newComment.isPendingModeration) {
                 toast({ title: 'Komentar Terkirim!', description: 'Komentar Anda akan ditinjau oleh admin sebelum ditampilkan.' });
            } else {
                 toast({ title: 'Komentar berhasil dikirim!' });
            }
            onArtworkUpdate(result.updatedArtwork);
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal mengirim komentar',
                description: result.message,
            });
        }
        setIsSubmitting(false);
    };
    
    const commentTree = useMemo(() => {
        const commentsById = new Map<string, Comment & { replies: Comment[] }>();
        
        optimisticComments.forEach(comment => {
            commentsById.set(comment.id, { ...comment, replies: [] });
        });

        const rootComments: (Comment & { replies: Comment[] })[] = [];
        
        commentsById.forEach(comment => {
            if (comment.parentId && commentsById.has(comment.parentId)) {
                commentsById.get(comment.parentId)!.replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        });

        return rootComments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [optimisticComments]);

    const renderComments = (comments: (Comment & { replies: Comment[] })[]) => {
        return comments.map(comment => (
            <div key={comment.id} className="space-y-3">
                <div className="text-sm bg-muted/50 p-3 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">{comment.text}</p>
                    <div className='flex justify-between items-center mt-2'>
                         <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: indonesianLocale })}
                        </p>
                        <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => setReplyTo(comment.id)}>
                            <CornerDownRight className="w-3 h-3 mr-1" />
                            Balas
                        </Button>
                    </div>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                     <div className="pl-6 border-l-2 ml-3 space-y-3">
                        {renderComments(comment.replies)}
                    </div>
                )}
            </div>
        ));
    };


    return (
        <div className="space-y-4 pt-4">
            <Separator />
            <h3 className="font-semibold font-headline">Diskusi Anonim</h3>
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
                        Kirim
                    </Button>
                </div>
            </form>

            <div className="space-y-3">
                {commentTree.length > 0 ? (
                    renderComments(commentTree)
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                         <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>Belum ada diskusi. Jadilah yang pertama!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

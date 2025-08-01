
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
    
    // The optimistic state now manages a flat array of all comments
    const [optimisticComments, setOptimisticComments] = useOptimistic<Comment[], { text: string; parentId: string | null }>(
        artwork.comments,
        (state, { text, parentId }) => {
            const newComment: Comment = {
                id: Math.random().toString(), // temporary ID
                text: text,
                createdAt: new Date(),
                parentId: parentId,
                replies: [] // Replies will be constructed during render
            };
            return [...state, newComment];
        }
    );

    const handleAddComment = async (formData: FormData) => {
        const commentText = formData.get('commentText') as string;
        if (!commentText.trim()) return;

        setIsSubmitting(true);
        const currentReplyTo = replyTo;
        
        // Reset reply state immediately
        setReplyTo(null);
        if (formRef.current) {
            (formRef.current.querySelector('textarea') as HTMLTextAreaElement).value = '';
        }

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
    };
    
    // Memoize the comment tree construction
    const commentTree = useMemo(() => {
        const commentsById = new Map<string, Comment & { replies: Comment[] }>();
        
        // Initialize all comments in the map
        optimisticComments.forEach(comment => {
            commentsById.set(comment.id, { ...comment, replies: [] });
        });

        const rootComments: (Comment & { replies: Comment[] })[] = [];
        
        // Build the tree structure
        commentsById.forEach(comment => {
            if (comment.parentId && commentsById.has(comment.parentId)) {
                commentsById.get(comment.parentId)!.replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        });

        // Sort root comments by date
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

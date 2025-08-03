
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
    artworkId: string;
    initialLikes: number;
}

export function LikeButton({ artworkId, initialLikes }: LikeButtonProps) {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const likedArtworks = JSON.parse(localStorage.getItem('likedArtworks') || '[]');
        setIsLiked(likedArtworks.includes(artworkId));
    }, [artworkId]);

    const handleLike = () => {
        const newLikedState = !isLiked;
        
        // Optimistic UI update
        setIsLiked(newLikedState);
        setLikes(prev => newLikedState ? prev + 1 : prev - 1);

        // Update localStorage
        const likedArtworks = JSON.parse(localStorage.getItem('likedArtworks') || '[]');
        if (newLikedState) {
            localStorage.setItem('likedArtworks', JSON.stringify([...likedArtworks, artworkId]));
        } else {
            localStorage.setItem('likedArtworks', JSON.stringify(likedArtworks.filter((id: string) => id !== artworkId)));
        }

        startTransition(async () => {
            try {
                const result = await toggleLike(artworkId, newLikedState);
                if (result.success) {
                    // Update likes with the actual value from server
                    setLikes(result.newLikes);
                } else {
                    // Revert UI on failure
                    setIsLiked(!newLikedState);
                    setLikes(prev => !newLikedState ? prev + 1 : prev - 1);
                     const likedArtworks = JSON.parse(localStorage.getItem('likedArtworks') || '[]');
                    if (!newLikedState) {
                        localStorage.setItem('likedArtworks', JSON.stringify([...likedArtworks, artworkId]));
                    } else {
                        localStorage.setItem('likedArtworks', JSON.stringify(likedArtworks.filter((id: string) => id !== artworkId)));
                    }
                }
            } catch (error) {
                 // Revert UI on error
                setIsLiked(!newLikedState);
                setLikes(prev => !newLikedState ? prev + 1 : prev - 1);
            }
        });
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLike}
            disabled={isPending}
            className="flex items-center gap-2 transition-colors"
        >
            <Heart className={cn(
                "w-4 h-4 transition-all",
                isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground"
            )} />
            <span className={cn("font-semibold", isLiked && "text-primary")}>{likes}</span>
        </Button>
    );
}

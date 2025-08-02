
"use client";

import { useState } from 'react';
import { CommentSection } from '@/components/comment-section';
import type { Artwork } from '@/lib/types';

interface ArtworkDetailClientProps {
    artwork: Artwork;
}

export function ArtworkDetailClient({ artwork: initialArtwork }: ArtworkDetailClientProps) {
    const [artwork, setArtwork] = useState(initialArtwork);

    const handleArtworkUpdate = (updatedArtwork: Artwork) => {
        setArtwork(updatedArtwork);
    };

    return (
        <CommentSection artwork={artwork} onArtworkUpdate={handleArtworkUpdate} />
    );
}

    
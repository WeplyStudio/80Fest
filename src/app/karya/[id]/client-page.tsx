
"use client";

import { useState } from "react";
import type { Artwork, Comment } from "@/lib/types";
import { CommentSection } from "@/components/comment-section";

interface ArtworkClientPageProps {
  artwork: Artwork;
  initialComments: Comment[];
}

export function ArtworkClientPage({ artwork, initialComments }: ArtworkClientPageProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const handleCommentAdded = (newComment: Comment) => {
    // In a real app, you might want to show this optimistically,
    // but here we wait for revalidation or a full refresh to show moderated comments.
    // For now, this function can be used to show a toast or message.
    console.log("Comment submitted, awaiting moderation:", newComment);
  };
  
  return (
    <CommentSection 
        artworkId={artwork.id}
        comments={comments}
        onCommentAdded={handleCommentAdded}
    />
  );
}

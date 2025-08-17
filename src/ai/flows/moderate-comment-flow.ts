'use server';
/**
 * @fileoverview A Genkit flow for moderating user-submitted comments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CommentModerationInputSchema = z.object({
  commentText: z.string().describe('The user-submitted comment text to be analyzed.'),
});
export type CommentModerationInput = z.infer<typeof CommentModerationInputSchema>;

const CommentModerationOutputSchema = z.object({
  decision: z.enum(['allow', 'deny']).describe("The final decision based on the analysis. 'allow' if the comment is appropriate, 'deny' otherwise."),
  reason: z.string().describe('A brief explanation for the decision, especially if denied.'),
});
export type CommentModerationOutput = z.infer<typeof CommentModerationOutputSchema>;


const moderationPrompt = ai.definePrompt({
    name: 'moderateCommentPrompt',
    input: { schema: CommentModerationInputSchema },
    output: { schema: CommentModerationOutputSchema },
    prompt: `You are a strict but fair content moderator for a school's poster design competition website. Your task is to analyze user comments and decide whether they should be allowed.

    Analyze the following comment:
    "{{{commentText}}}"

    Your decision must be based on these rules:
    1.  **ALLOW** comments that are positive, constructive, or neutral. Encouragement and respectful critiques are welcome.
    2.  **DENY** comments that contain:
        - Hate speech, bullying, or personal attacks.
        - Profanity, inappropriate language, or vulgarity.
        - Spam, advertisements, or unrelated links.
        - Gibberish or nonsensical text.
        - Negative, discouraging, or overly harsh criticism that is not constructive.

    Provide a clear 'allow' or 'deny' decision and a brief, clear reason for your choice.`,
});

export const moderateCommentFlow = ai.defineFlow(
  {
    name: 'moderateCommentFlow',
    inputSchema: CommentModerationInputSchema,
    outputSchema: CommentModerationOutputSchema,
  },
  async (input) => {
    const { output } = await moderationPrompt(input);
    return output!;
  }
);

export async function moderateComment(commentText: string): Promise<CommentModerationOutput> {
    return await moderateCommentFlow({ commentText });
}

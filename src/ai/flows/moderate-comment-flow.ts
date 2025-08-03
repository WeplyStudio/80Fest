
'use server';
/**
 * @fileOverview A comment moderation AI agent.
 *
 * - moderateComment - A function that handles the comment moderation process.
 * - ModerateCommentInput - The input type for the moderateComment function.
 * - ModerateCommentOutput - The return type for the moderateComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCommentInputSchema = z.object({
  commentText: z.string().describe('The user-submitted comment text.'),
});
export type ModerateCommentInput = z.infer<typeof ModerateCommentInputSchema>;

const ModerateCommentOutputSchema = z.object({
  isAppropriate: z.boolean().describe('Whether the comment is appropriate and not spam. True if it is safe, false if it contains hate speech, spam, harassment, or is otherwise inappropriate.'),
  reason: z.string().nullish().describe('If the comment is not appropriate, a brief reason why.'),
});
export type ModerateCommentOutput = z.infer<typeof ModerateCommentOutputSchema>;


export async function moderateComment(input: ModerateCommentInput): Promise<ModerateCommentOutput> {
  return moderateCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCommentPrompt',
  input: {schema: ModerateCommentInputSchema},
  output: {schema: ModerateCommentOutputSchema},
  prompt: `You are a content moderator for a student art competition website. Your task is to determine if a user-submitted comment is appropriate.

The comment is for a public discussion about a student's artwork. It should be respectful and constructive.

Flag comments as inappropriate if they contain:
- Hate speech
- Harassment or bullying
- Personal attacks
- Spam or advertisements
- Profanity or explicit language
- Anything else that would be inappropriate for a school environment.

If a comment is borderline, err on the side of caution and flag it as inappropriate.

Analyze the following comment:
"{{{commentText}}}"`,
  config: {
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
        },
    ]
  }
});

const moderateCommentFlow = ai.defineFlow(
  {
    name: 'moderateCommentFlow',
    inputSchema: ModerateCommentInputSchema,
    outputSchema: ModerateCommentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

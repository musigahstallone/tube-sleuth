// A flow that suggests related videos based on a search query.

'use server';

/**
 * @fileOverview A flow that suggests related videos based on a search query.
 *
 * - suggestRelatedVideos - A function that handles the suggestion of related videos.
 * - SuggestRelatedVideosInput - The input type for the suggestRelatedVideos function.
 * - SuggestRelatedVideosOutput - The return type for the suggestRelatedVideos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedVideosInputSchema = z.object({
  query: z.string().describe('The search query to find related videos for.'),
});
export type SuggestRelatedVideosInput = z.infer<typeof SuggestRelatedVideosInputSchema>;

const SuggestRelatedVideosOutputSchema = z.object({
  relatedVideos: z
    .array(z.string())
    .describe('An array of suggested related video titles.'),
});
export type SuggestRelatedVideosOutput = z.infer<typeof SuggestRelatedVideosOutputSchema>;

export async function suggestRelatedVideos(input: SuggestRelatedVideosInput): Promise<SuggestRelatedVideosOutput> {
  return suggestRelatedVideosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedVideosPrompt',
  input: {schema: SuggestRelatedVideosInputSchema},
  output: {schema: SuggestRelatedVideosOutputSchema},
  prompt: `You are a helpful assistant that suggests related videos based on a search query.

  Suggest videos related to the following query:
  {{query}}

  Return a list of related video titles.
  `,
});

const suggestRelatedVideosFlow = ai.defineFlow(
  {
    name: 'suggestRelatedVideosFlow',
    inputSchema: SuggestRelatedVideosInputSchema,
    outputSchema: SuggestRelatedVideosOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

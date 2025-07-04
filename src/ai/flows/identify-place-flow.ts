'use server';
/**
 * @fileOverview An AI flow to identify a place from a picture.
 *
 * - identifyPlace - A function that takes a photo and returns a description.
 * - IdentifyPlaceInput - The input type for the identifyPlace function.
 * - IdentifyPlaceOutput - The return type for the identifyPlace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a historical site or building, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPlaceInput = z.infer<typeof IdentifyPlaceInputSchema>;

const IdentifyPlaceOutputSchema = z.object({
  description: z.string().describe("A detailed description of the place in the image."),
});
export type IdentifyPlaceOutput = z.infer<typeof IdentifyPlaceOutputSchema>;

export async function identifyPlace(input: IdentifyPlaceInput): Promise<IdentifyPlaceOutput> {
  return identifyPlaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlacePrompt',
  model: 'gemini-2-pro',
  input: {schema: IdentifyPlaceInputSchema},
  output: {schema: IdentifyPlaceOutputSchema},
  prompt: `You are an expert historian and architectural specialist. Analyze the provided image of a historical site or building.
Provide a detailed description covering the following aspects:
1.  **Historical Background:** Key events, figures, and eras associated with the place.
2.  **Architectural Style:** Identify the style and describe its key features.
3.  **Cultural Significance:** Explain its importance in culture, art, or society.

**IMPORTANT INSTRUCTIONS:**
- Your entire response MUST be in Hebrew.
- However, you MUST keep specific, internationally recognized proper names or specialized terms in their original English. For example: "Gothic", "Byzantine", "World War II", "Art Deco", "Shogun".

Analyze this image: {{media url=photoDataUri}}`,
});

const identifyPlaceFlow = ai.defineFlow(
  {
    name: 'identifyPlaceFlow',
    inputSchema: IdentifyPlaceInputSchema,
    outputSchema: IdentifyPlaceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

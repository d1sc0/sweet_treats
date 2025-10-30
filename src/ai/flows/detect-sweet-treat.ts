'use server';

/**
 * @fileOverview This file defines a Genkit flow to detect if an image contains a sweet treat.
 *
 * It exports:
 * - `detectSweetTreat`: An async function that takes an image data URI as input and returns a boolean indicating if a sweet treat is detected.
 * - `DetectSweetTreatInput`: The input type for the `detectSweetTreat` function.
 * - `DetectSweetTreatOutput`: The output type for the `detectSweetTreat` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectSweetTreatInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type DetectSweetTreatInput = z.infer<typeof DetectSweetTreatInputSchema>;

const DetectSweetTreatOutputSchema = z.object({
  isSweetTreat: z.boolean().describe('Whether or not the image contains a sweet treat.'),
});
export type DetectSweetTreatOutput = z.infer<typeof DetectSweetTreatOutputSchema>;

export async function detectSweetTreat(input: DetectSweetTreatInput): Promise<DetectSweetTreatOutput> {
  return detectSweetTreatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectSweetTreatPrompt',
  input: {schema: DetectSweetTreatInputSchema},
  output: {schema: DetectSweetTreatOutputSchema},
  prompt: `You are an AI expert in identifying sweet treats in images.  A sweet treat is a dessert item, candy, or baked good high in sugar.  A savory item like bread is not a sweet treat.

  Analyze the image provided to determine if it contains a sweet treat. Return true if a sweet treat is present, and false otherwise.
  Image: {{media url=photoDataUri}}
  `,
});

const detectSweetTreatFlow = ai.defineFlow(
  {
    name: 'detectSweetTreatFlow',
    inputSchema: DetectSweetTreatInputSchema,
    outputSchema: DetectSweetTreatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

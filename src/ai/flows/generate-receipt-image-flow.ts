'use server';
/**
 * @fileOverview Generates an image for a transaction receipt using AI.
 *
 * - generateReceiptImage - A function that creates a themed image based on a prompt.
 * - GenerateReceiptImageInput - The input type for the generateReceiptImage function.
 * - GenerateReceiptImageOutput - The return type for the generateReceiptImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateReceiptImageInputSchema = z.object({
  prompt: z.string().describe("A short description of the theme for the image, e.g., 'birthday celebration', 'congratulations on a new car'."),
});
export type GenerateReceiptImageInput = z.infer<typeof GenerateReceiptImageInputSchema>;

const GenerateReceiptImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI."),
});
export type GenerateReceiptImageOutput = z.infer<typeof GenerateReceiptImageOutputSchema>;

export async function generateReceiptImage(input: GenerateReceiptImageInput): Promise<GenerateReceiptImageOutput> {
  return generateReceiptImageFlow(input);
}

const generateReceiptImageFlow = ai.defineFlow(
  {
    name: 'generateReceiptImageFlow',
    inputSchema: GenerateReceiptImageInputSchema,
    outputSchema: GenerateReceiptImageOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a vibrant, positive, and modern background image suitable for a digital bank transaction receipt. The theme is: "${prompt}". The image should be abstract or thematic, avoiding text and sensitive content. It should evoke a feeling of celebration and happiness.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed.');
    }

    return { imageDataUri: media.url };
  }
);

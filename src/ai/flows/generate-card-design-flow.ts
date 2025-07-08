'use server';
/**
 * @fileOverview Generates a background image for a custom debit card.
 *
 * - generateCardDesign - A function that creates a themed image based on a prompt.
 * - GenerateCardDesignInput - The input type for the generateCardDesign function.
 * - GenerateCardDesignOutput - The return type for the generateCardDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateCardDesignInputSchema = z.object({
  prompt: z.string().describe("A short description of the theme for the image, e.g., 'abstract lines', 'galaxy stars', 'blue waves'."),
});
export type GenerateCardDesignInput = z.infer<typeof GenerateCardDesignInputSchema>;

const GenerateCardDesignOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI."),
});
export type GenerateCardDesignOutput = z.infer<typeof GenerateCardDesignOutputSchema>;

export async function generateCardDesign(input: GenerateCardDesignInput): Promise<GenerateCardDesignOutput> {
  return generateCardDesignFlow(input);
}

const generateCardDesignFlow = ai.defineFlow(
  {
    name: 'generateCardDesignFlow',
    inputSchema: GenerateCardDesignInputSchema,
    outputSchema: GenerateCardDesignOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a vibrant, modern, and abstract background image suitable for a bank debit card. The theme is: "${prompt}". The image must not contain any text, logos, or recognizable faces. Focus on beautiful colors and patterns that are visually appealing and professional. The image should be suitable for a financial product.`,
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

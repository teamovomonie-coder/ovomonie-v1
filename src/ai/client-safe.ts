/**
 * Client-safe AI wrapper that prevents server-only code from being bundled on client
 */

export type GenerateCardDesignInput = {
  prompt: string;
};

export type GenerateCardDesignOutput = {
  imageDataUri: string;
};

export async function generateCardDesign(input: GenerateCardDesignInput): Promise<GenerateCardDesignOutput> {
  // This will be handled by API route instead of direct Genkit calls
  const response = await fetch('/api/generate-card-design', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to generate card design');
  }

  return response.json();
}
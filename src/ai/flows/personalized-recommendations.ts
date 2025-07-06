
'use server';

/**
 * @fileOverview Recommends financial products to users based on their past financial behavior.
 *
 * - getPersonalizedRecommendations - A function that returns personalized financial product recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  recentTransactions: z.string().describe('A description of the users recent transactions'),
  financialGoals: z.string().describe('A description of the financial goals of the user.'),
});
export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of personalized financial product recommendations.'),
});
export type PersonalizedRecommendationsOutput = z.infer<
  typeof PersonalizedRecommendationsOutputSchema
>;

export async function getPersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are a financial advisor providing personalized financial product recommendations to users.

  Based on the user's past financial behavior and stated financial goals, recommend relevant financial products such as savings plans or investment opportunities.

  User ID: {{{userId}}}
  Recent Transactions: {{{recentTransactions}}}
  Financial Goals: {{{financialGoals}}}

  Please provide a list of financial product recommendations tailored to the user's needs and goals.
  The output should be a list of strings. Each string is a short description of the product. Example: ['High yield savings account', 'Balanced investment portfolio', 'Retirement savings plan'].
  `,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

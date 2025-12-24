
'use server';
/**
 * @fileOverview Stub implementation for personalized recommendations (Firebase removed)
 */

import {z} from 'zod';

const PersonalizedRecommendationsInputSchema = z.object({
  userName: z.string().describe("The user's full name."),
  userId: z.string().describe("The user's unique ID for data fetching."),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendation: z.string().describe("A brief, friendly, and actionable financial insight or question for the user."),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function getPersonalizedRecommendation(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return {
    recommendation: `Hello ${input.userName}, welcome to Ovo Thrive! How can I help you manage your finances today?`
  };
}

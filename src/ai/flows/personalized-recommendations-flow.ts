
'use server';
/**
 * @fileOverview A flow for generating proactive, personalized financial recommendations.
 *
 * - getPersonalizedRecommendation - A function that analyzes user data to provide a helpful insight.
 * - PersonalizedRecommendationsInput - The input type for the function.
 * - PersonalizedRecommendationsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// --- Schemas ---
const PersonalizedRecommendationsInputSchema = z.object({
  userName: z.string().describe("The user's full name."),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendation: z.string().describe("A brief, friendly, and actionable financial insight or question for the user."),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

// --- Mock Data ---
// In a real app, this data would be fetched from a database for the specific user.
const MOCK_FINANCIAL_DATA = {
    balance: '₦1,250,345.00',
    monthlyBudget: {
        total: '₦300,000',
        airtime: { spent: '₦15,000', budget: '₦5,000' }, // Over budget
        transport: { spent: '₦45,000', budget: '₦40,000' }, // Slightly over
        food: { spent: '₦80,000', budget: '₦100,000' },
    },
    recentTransactions: [
        'DSTV Subscription -₦12,500',
        'MTN Airtime -₦5,000',
        'Uber Ride -₦4,500',
        'The Place Restaurant -₦8,500',
        'MTN Airtime -₦2,000',
    ],
    savingsGoal: 'Save ₦50,000 for new phone. Progress: ₦30,000.',
    unusedFeatures: ['Ovo-Wealth investment', 'Automated bill payments'],
};


// --- Main Exported Function ---
export async function getPersonalizedRecommendation(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}


// --- Genkit Flow Definition ---
const systemPrompt = `You are a friendly and proactive financial assistant named OVO.
Your goal is to find ONE interesting insight or potential issue from the user's financial data and formulate a brief, helpful, and engaging question to start a conversation.
Your tone should be warm and conversational, not alarming. Start by addressing the user by their name.

**Analysis & Response Rules:**
1.  **Single Focus:** Identify only ONE key area to talk about. This could be budget overspending, an opportunity to save, or a useful app feature they haven't tried.
2.  **Be Specific:** Mention specific categories (e.g., "airtime", "transport").
3.  **Propose Action:** Your question should naturally lead to a helpful action you can assist with (e.g., setting a budget, starting a savings plan, setting up a recurring payment).
4.  **Keep it Short:** The entire recommendation should be one or two sentences.

**Example Insight -> Output:**
-   *Insight:* User has spent ₦15,000 on airtime, but their budget is ₦5,000.
-   *Output:* "Hello {{userName}}, I noticed you've spent a bit more on airtime than usual this month. Would you like me to help you set up a spending alert?"

-   *Insight:* User has no savings goal for rent, a common major expense.
-   *Output:* "Hi {{userName}}, planning for big expenses like rent can be tricky. I can help you set up an 'Ovo-Goals' savings plan to make it easier, would you like to try?"

-   *Insight:* User pays for DSTV every month manually but hasn't used the automated payment feature.
-   *Output:* "Hello {{userName}}, I see you've been paying for your DSTV subscription regularly. Did you know you can automate that payment so you never miss a due date? I can set that up for you."

**User's Financial Data:**
\`\`\`json
${JSON.stringify(MOCK_FINANCIAL_DATA, null, 2)}
\`\`\`
`;

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const promptText = systemPrompt.replace('{{userName}}', input.userName);
    
    const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-pro-latest'),
        prompt: promptText,
        output: {
            schema: PersonalizedRecommendationsOutputSchema
        }
    });

    return output!;
  }
);


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
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

// --- Schemas ---
const PersonalizedRecommendationsInputSchema = z.object({
  userName: z.string().describe("The user's full name."),
  userId: z.string().describe("The user's unique ID for data fetching."),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendation: z.string().describe("A brief, friendly, and actionable financial insight or question for the user."),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

// --- Live Data Fetching ---
async function getLiveFinancialData(userId: string) {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    const balance = `₦${(userData.balance / 100).toLocaleString()}`;
    
    const transactionsQuery = query(collection(db, "financialTransactions"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(20));
    const txSnapshot = await getDocs(transactionsQuery);

    const recentTransactions = txSnapshot.docs.map(doc => {
        const data = doc.data();
        return `${data.narration} -₦${(data.amount / 100).toLocaleString()}`;
    });

    // In a real app, budget and savings data would come from their own collections.
    // For this demonstration, we derive insights from transaction data.
    const airtimeSpending = txSnapshot.docs
        .filter(doc => doc.data().category === 'airtime' && doc.data().type === 'debit')
        .reduce((sum, doc) => sum + doc.data().amount, 0) / 100;
        
    const transportSpending = txSnapshot.docs
        .filter(doc => doc.data().category === 'transport' && doc.data().type === 'debit')
        .reduce((sum, doc) => sum + doc.data().amount, 0) / 100;

    return {
        balance,
        recentTransactions: recentTransactions.slice(0, 5), // Keep it brief for the prompt
        spending: {
            airtime: airtimeSpending,
            transport: transportSpending,
        },
        unusedFeatures: ['Ovo-Wealth investment', 'Automated bill payments'],
    };
}


// --- Main Exported Function ---
export async function getPersonalizedRecommendation(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}


// --- Genkit Flow Definition ---
const systemPrompt = `You are a friendly and proactive financial assistant named OVO.
Your goal is to find ONE interesting insight or potential issue from the user's financial data and formulate a brief, helpful, and engaging question to start a conversation.
Your tone should be warm and conversational, not alarming. You MUST start by addressing the user by their name.

**Analysis & Response Rules:**
1.  **Single Focus:** Identify only ONE key area to talk about. This could be high spending in a category, an opportunity to save, or a useful app feature they haven't tried.
2.  **Be Specific:** Mention specific categories (e.g., "airtime", "transport").
3.  **Propose Action:** Your question should naturally lead to a helpful action you can assist with (e.g., setting a budget, starting a savings plan, setting up a recurring payment).
4.  **Keep it Short:** The entire recommendation should be one or two sentences.
5.  **Use Provided Data ONLY:** Base your recommendation solely on the JSON data provided in the prompt. Do not invent categories or spending amounts.

**Example Insight -> Output:**
-   *Insight:* User has spent ₦15,000 on airtime.
-   *Output:* "Hello Jane, I noticed you've spent a bit more on airtime than usual this month. Would you like me to help you set up a spending alert?"

-   *Insight:* User has no investment data but has a good balance.
-   *Output:* "Hi David, I was just thinking, you've been doing great with your account. Have you considered making your money work for you with our Ovo-Wealth feature?"

-   *Insight:* User pays for DSTV every month manually but hasn't used the automated payment feature.
-   *Output:* "Hello Tunde, I see you've been paying for your DSTV subscription regularly. Did you know you can automate that payment so you never miss a due date? I can set that up for you."
`;

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const financialData = await getLiveFinancialData(input.userId);
    if (!financialData) {
        return { recommendation: `Hello ${input.userName}, I'm just checking in. How can I help you manage your finances today?` };
    }
      
    const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        system: systemPrompt,
        prompt: `The user's name is ${input.userName}. Analyze the following financial data for them:\n\`\`\`json\n${JSON.stringify(financialData, null, 2)}\n\`\`\``,
        output: {
            schema: PersonalizedRecommendationsOutputSchema
        }
    });

    return output!;
  }
);

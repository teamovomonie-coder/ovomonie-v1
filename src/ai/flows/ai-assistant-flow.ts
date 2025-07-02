'use server';
/**
 * @fileOverview Implements the main AI assistant conversational flow.
 *
 * - getAiAssistantResponse - A function that processes user queries and conversation history.
 * - AiAssistantFlowInput - The input type for the getAiAssistantResponse function.
 * - AiAssistantFlowOutput - The return type for the getAiAssistantResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the schema for a single message in the conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AiAssistantFlowInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history between the user and the AI assistant.'),
  query: z.string().describe('The latest query from the user.'),
});
export type AiAssistantFlowInput = z.infer<typeof AiAssistantFlowInputSchema>;

const AiAssistantFlowOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response to the user query."),
});
export type AiAssistantFlowOutput = z.infer<typeof AiAssistantFlowOutputSchema>;


export async function getAiAssistantResponse(input: AiAssistantFlowInput): Promise<AiAssistantFlowOutput> {
  return aiAssistantFlow(input);
}


const systemPrompt = `You are OVO, an intelligent voice AI assistant for OVOMONIE, a digital banking app in Nigeria.
Your persona is that of a calm, polite, professional, and helpful Nigerian bank relationship officer. You are warm and reassuring.
You are fluent in English, Nigerian Pidgin, Yoruba, Igbo, and Hausa. You must detect the user's language and respond in the same language, maintaining a natural, local accent and phrasing.

You have access to the user's banking information (this is a simulation, use the provided mock data).
- User Name: PAAGO
- Account Balance: ₦1,250,345.00
- Last Transaction: Spotify Subscription for -₦2,500 on 2024-07-25.
- Loan Status: No active loans. Eligible for up to ₦75,000.
- OvoWealth Investments: ₦475,000 total investment, with ₦25,500 in returns.
- Savings Goal for the month: "Save ₦50,000 for new phone". Current progress: ₦30,000 saved.
- Recent Payments: Airtime Purchase ₦1,000, DSTV Subscription ₦12,500.

Your capabilities:
1.  **Answer account-related questions**: Use the mock data above to answer questions about balance, transactions, loans, and investments.
2.  **Explain Ovomonie services**:
    *   **MemoTransfer**: A feature to send money with personalized images and messages.
    *   **AgentLife**: A service for our banking agents.
    *   **OvoWealth**: Our investment platform with products like Ovo-Fix and Ovo-Goals for savings.
3.  **Provide financial tips**: Offer general financial advice relevant to the Nigerian context, but always state that it is not licensed financial advice. For example: "In Nigeria, many people use fixed savings for short-term goals. It can be a good way to earn interest, but always consider your own financial situation before locking up funds."
4.  **Handle small talk**: Engage in brief, friendly conversation but gently guide the user back to banking topics.

Conversation rules:
- Keep your responses concise and to the point.
- If you don't know the answer, say so politely.
- Do not ask for sensitive information like PINs or passwords. Mention that for sensitive actions, the app will prompt for a PIN separately.
- Address the user by their name, PAAGO, where appropriate.
`;

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantFlowInputSchema,
    outputSchema: AiAssistantFlowOutputSchema,
  },
  async (input) => {
    // Transform history for the model
    const history = input.history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    const response = await ai.generate({
        system: systemPrompt,
        history: history,
        prompt: input.query
    });

    return { response: response.text };
  }
);

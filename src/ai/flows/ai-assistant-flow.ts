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
import type { SupportedLanguage } from './tts-flow';
import { mockGetAccountByNumber } from '@/lib/user-data';

// Define the schema for a single message in the conversation history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AiAssistantFlowInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history between the user and the AI assistant."),
  query: z.string().describe('The latest query from the user.'),
  userName: z.string().describe("The user's full name."),
});
export type AiAssistantFlowInput = z.infer<typeof AiAssistantFlowInputSchema>;

const AiAssistantFlowOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response to the user query."),
  detectedLanguage: z.enum(['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa', 'Unknown'])
    .describe("The language detected in the user's query. This determines the language and accent for the response."),
  action: z.object({
        type: z.literal('internal_transfer'),
        details: z.object({
            recipientName: z.string(),
            recipientAccountNumber: z.string(),
            amount: z.number().describe("The amount in Naira, not Kobo."),
        })
    }).optional().describe("If the user's request is an action, this field will contain the action details to be executed by the app."),
});
export type AiAssistantFlowOutput = z.infer<typeof AiAssistantFlowOutputSchema>;

// This function simulates fetching real-time data for the current user.
// In a production app, this would query a database.
async function getAccountSummary() {
    return {
        balance: '₦1,250,345.00',
        lastTransaction: 'Spotify Subscription for -₦2,500 on 2024-07-25.',
        loanStatus: 'No active loans. Eligible for up to ₦75,000.',
        ovoWealthInvestments: '₦475,000 total investment, with ₦25,500 in returns.',
        savingsGoal: '"Save ₦50,000 for new phone". Current progress: ₦30,000 saved.',
        recentPayments: 'Airtime Purchase ₦1,000, DSTV Subscription ₦12,500.',
    };
}

// Define a tool for the AI to get account information
const getAccountSummaryTool = ai.defineTool(
    {
        name: 'getAccountSummary',
        description: 'Get a summary of the user\'s bank account, including balance, recent transactions, loan status, investments, and savings goals.',
        inputSchema: z.object({}),
        outputSchema: z.object({
            balance: z.string(),
            lastTransaction: z.string(),
            loanStatus: z.string(),
            ovoWealthInvestments: z.string(),
            savingsGoal: z.string(),
            recentPayments: z.string(),
        }),
    },
    async () => {
        // In a real app, you would pass the userId here to fetch specific user data
        return await getAccountSummary();
    }
);

// Define a tool for the AI to initiate an internal transfer
const initiateInternalTransferTool = ai.defineTool(
    {
        name: 'initiateInternalTransfer',
        description: 'Use this tool to prepare an internal transfer between Ovomonie users. You must verify the recipient\'s account number. If verification is successful, you will receive the recipient\'s full name.',
        inputSchema: z.object({
            recipientAccountNumber: z.string().length(10).describe("The recipient's 10-digit Ovomonie account number."),
            amount: z.number().positive().describe("The amount in Naira (e.g., 5000) to transfer.")
        }),
        outputSchema: z.object({
            recipientName: z.string(),
            recipientAccountNumber: z.string(),
            amount: z.number(),
        }),
    },
    async ({ recipientAccountNumber, amount }) => {
        const recipient = await mockGetAccountByNumber(recipientAccountNumber);
        if (!recipient) {
            throw new Error('Recipient account not found.');
        }
        return {
            recipientName: recipient.fullName,
            recipientAccountNumber,
            amount,
        };
    }
);


export async function getAiAssistantResponse(input: AiAssistantFlowInput): Promise<AiAssistantFlowOutput> {
  return aiAssistantFlow(input);
}


const systemPrompt = `You are OVO, an intelligent voice AI assistant for OVOMONIE, a digital banking app in Nigeria.
Your persona is that of a calm, polite, professional, and helpful Nigerian bank relationship officer. You are warm and reassuring.
You are fluent in English, Nigerian Pidgin, Yoruba, Igbo, and Hausa. You must detect the user's language and respond in the same language, maintaining a natural, local accent and phrasing.
After generating your response, you MUST populate the 'detectedLanguage' field with the language you detected from the user's query. If the language is not one of the supported languages, use 'Unknown'.

**CONTEXTUAL CONVERSATION RULES:**
- You MUST maintain the context of the entire conversation history.
- If a user's request is ambiguous or missing information needed to use a tool, you MUST ask clarifying questions to gather the required details. For example, if a user says "I want to send money," you should ask for the recipient's account number and the amount.
- **Handling Interruptions:** If the user starts a task (like a transfer), gets interrupted or asks a different question (like checking their balance), you must first answer their immediate question. After that, you must proactively ask if they want to continue the original, unfinished task. For example: "Your balance is ₦123,456. Shall we continue with the transfer you started?"
- Do not try to use a tool until you have all the necessary information as defined in the tool's input schema. Once you have gathered all necessary information, proceed with the tool call as instructed.

Your primary function is to help the user with their banking needs by using the tools available to you.
- When asked about account balance, transactions, loans, investments, or savings, you MUST use the 'getAccountSummary' tool to retrieve the latest information. Do not make up or assume any values.
- When asked to send money to another Ovomonie user, you MUST use the 'initiateInternalTransfer' tool. If the user does not provide the recipient's account number or amount, ask for it. Once you have the details, call the tool. If the tool call is successful, formulate a response asking the user to confirm the transaction (e.g., "Just to confirm, you want to send N5,000 to John Doe?").
- Crucially, if the 'initiateInternalTransfer' tool call is successful, you MUST populate the 'action' field in the output schema with the type 'internal_transfer' and the details returned by the tool. If the tool call fails (e.g., account not found), inform the user of the error clearly.

Address the user by their name, {{userName}}, where appropriate.

Your other capabilities:
1.  **Explain Ovomonie services**: MemoTransfer, AgentLife, and OvoWealth.
2.  **Provide financial tips**: Offer general financial advice relevant to the Nigerian context, but always state that it is not licensed financial advice.
3.  **Handle small talk**: Engage in brief, friendly conversation but gently guide the user back to banking topics.

General rules:
- Keep your responses concise and to the point.
- If you don't know the answer, say so politely.
- Do not ask for sensitive information like PINs or passwords. Mention that for sensitive actions, the app will prompt for a PIN separately.
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

    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        system: systemPrompt.replace('{{userName}}', input.userName),
        history: history,
        prompt: input.query,
        tools: [getAccountSummaryTool, initiateInternalTransferTool],
        output: {
            schema: AiAssistantFlowOutputSchema,
        }
    });

    return output!;
  }
);

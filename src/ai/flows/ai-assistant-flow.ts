
'use server';
/**
 * @fileOverview Stub implementation for AI assistant flow (Firebase removed)
 */

import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AiAssistantFlowInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history between the user and the AI assistant."),
  query: z.string().describe('The latest query from the user.'),
  userName: z.string().describe("The user's full name."),
  userId: z.string().describe("The user's unique ID for data fetching."),
});
export type AiAssistantFlowInput = z.infer<typeof AiAssistantFlowInputSchema>;

const AiAssistantFlowOutputSchema = z.object({
  response: z.string().describe("The AI assistant's response to the user query."),
  detectedLanguage: z.enum(['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa', 'Unknown'])
    .describe("The language detected in the user's query."),
  action: z.object({
        type: z.literal('internal_transfer'),
        details: z.object({
            recipientName: z.string(),
            recipientAccountNumber: z.string(),
            amount: z.number().describe("The amount in Naira, not Kobo."),
        })
    }).nullable().optional().describe("If the user's request is an action, this field will contain the action details."),
});
export type AiAssistantFlowOutput = z.infer<typeof AiAssistantFlowOutputSchema>;

export async function getAiAssistantResponse(input: AiAssistantFlowInput): Promise<AiAssistantFlowOutput> {
  return {
    response: `Hello ${input.userName}, I'm here to help with your banking needs. How can I assist you today?`,
    detectedLanguage: 'English',
    action: null
  };
}

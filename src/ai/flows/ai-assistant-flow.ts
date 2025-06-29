'use server';

/**
 * @fileOverview Implements the AI assistant flow for handling user voice commands to check account balance in multiple languages.
 *
 * - checkBalanceWithVoiceCommand - A function that processes voice commands to check account balance.
 * - CheckBalanceWithVoiceCommandInput - The input type for the checkBalanceWithVoiceCommand function.
 * - CheckBalanceWithVoiceCommandOutput - The return type for the checkBalanceWithVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckBalanceWithVoiceCommandInputSchema = z.object({
  voiceCommand: z.string().describe('The voice command from the user in English, Hausa, Yoruba, or Igbo.'),
});
export type CheckBalanceWithVoiceCommandInput = z.infer<typeof CheckBalanceWithVoiceCommandInputSchema>;

const CheckBalanceWithVoiceCommandOutputSchema = z.object({
  accountBalance: z.string().describe('The account balance of the user.'),
  spokenResponse: z.string().describe('A spoken response in the same language as the input voice command confirming the balance.'),
});
export type CheckBalanceWithVoiceCommandOutput = z.infer<typeof CheckBalanceWithVoiceCommandOutputSchema>;

export async function checkBalanceWithVoiceCommand(input: CheckBalanceWithVoiceCommandInput): Promise<CheckBalanceWithVoiceCommandOutput> {
  return checkBalanceWithVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkBalanceWithVoiceCommandPrompt',
  input: {schema: CheckBalanceWithVoiceCommandInputSchema},
  output: {schema: CheckBalanceWithVoiceCommandOutputSchema},
  prompt: `You are a multilingual AI assistant for a banking application. A user has requested to know their account balance via voice command.

  The user may speak in English, Hausa, Yoruba, or Igbo. Respond in the same language the user used.

  Here is the user's voice command: {{{voiceCommand}}}

  Determine the language that the user used, check the user's account balance, and respond to the user with their account balance in the language they used. Return the account balance as a number and the spoken response as a string. Make the answer concise.

  For example, if the user said "What is my balance?" respond with {"accountBalance": "1000", "spokenResponse": "Your balance is 1000 Naira."}

  Assume the user's balance is 1000 Naira if you can't determine the language.
  `,
});

const checkBalanceWithVoiceCommandFlow = ai.defineFlow(
  {
    name: 'checkBalanceWithVoiceCommandFlow',
    inputSchema: CheckBalanceWithVoiceCommandInputSchema,
    outputSchema: CheckBalanceWithVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

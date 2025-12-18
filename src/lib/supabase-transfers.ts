import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function performSupabaseTransfer(
  senderUserId: string,
  recipientAccountNumber: string,
  amountInKobo: number,
  clientReference: string,
  narration?: string
): Promise<{ success: true; newSenderBalance: number; recipientName: string } | { success: false; message: string }> {
  
  try {
    // Get sender
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('*')
      .eq('id', senderUserId)
      .single();

    if (senderError || !sender) {
      return { success: false, message: 'Sender not found' };
    }

    // Get recipient
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('*')
      .eq('account_number', recipientAccountNumber)
      .single();

    if (recipientError || !recipient) {
      return { success: false, message: 'Recipient not found' };
    }

    if (sender.balance < amountInKobo) {
      return { success: false, message: 'Insufficient funds' };
    }

    // Update balances
    const newSenderBalance = sender.balance - amountInKobo;
    const newRecipientBalance = recipient.balance + amountInKobo;

    const { error: updateError } = await supabase.rpc('perform_transfer', {
      p_sender_id: senderUserId,
      p_recipient_id: recipient.id,
      p_amount: amountInKobo,
      p_reference: clientReference,
      p_narration: narration || `Transfer to ${recipient.full_name}`,
      p_sender_name: sender.full_name,
      p_sender_phone: sender.phone,
      p_sender_account: sender.account_number,
      p_recipient_name: recipient.full_name,
      p_recipient_phone: recipient.phone,
      p_recipient_account: recipient.account_number
    });

    if (updateError) {
      console.error('Transfer error:', updateError);
      return { success: false, message: updateError.message };
    }

    return {
      success: true,
      newSenderBalance,
      recipientName: recipient.full_name
    };
  } catch (error) {
    console.error('Transfer failed:', error);
    return { success: false, message: 'Transfer failed' };
  }
}

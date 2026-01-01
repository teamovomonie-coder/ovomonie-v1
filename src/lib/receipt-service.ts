import { supabaseAdmin } from './supabase';

export interface ReceiptTemplate {
  id: string;
  template_type: string;
  template_name: string;
  template_config: {
    title: string;
    icon: string;
    color: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface TransactionReceipt {
  id: string;
  user_id: string;
  transaction_id: string;
  transaction_reference: string;
  template_id: string;
  receipt_data: {
    amount: number;
    network?: string;
    phoneNumber?: string;
    platform?: string;
    accountId?: string;
    biller?: string;
    verifiedName?: string;
    transactionId: string;
    completedAt: string;
    [key: string]: any;
  };
  created_at: string;
}

export class ReceiptService {
  private async getTemplateByType(templateType: string): Promise<string> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }
    
    try {
      const { data, error } = await supabaseAdmin
        .from('receipt_templates')
        .select('id')
        .eq('template_type', templateType)
        .single();

      if (error || !data) {
        // Create default template if not exists
        const { data: newTemplate, error: createError } = await supabaseAdmin
          .from('receipt_templates')
          .insert({
            template_type: templateType,
            template_name: `${templateType} Receipt`,
            template_config: {
              title: 'Transaction Successful',
              icon: 'check',
              color: '#13284d'
            }
          })
          .select('id')
          .single();

        if (createError) throw createError;
        return newTemplate.id;
      }

      return data.id;
    } catch (error) {
      console.error('[ReceiptService] Template error:', error);
      throw error;
    }
  }

  async saveReceipt(
    userId: string,
    transactionId: string,
    transactionReference: string,
    templateType: string,
    receiptData: any
  ): Promise<string | null> {
    if (!supabaseAdmin) {
      console.error('[ReceiptService] Supabase admin client not available');
      return null;
    }
    
    try {
      const templateId = await this.getTemplateByType(templateType);

      const { data, error } = await supabaseAdmin
        .from('transaction_receipts')
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          transaction_reference: transactionReference,
          template_id: templateId,
          receipt_data: receiptData
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('[ReceiptService] Save error:', error);
      return null;
    }
  }

  async getReceiptByReference(reference: string): Promise<TransactionReceipt | null> {
    if (!supabaseAdmin) {
      console.error('[ReceiptService] Supabase admin client not available');
      return null;
    }
    
    try {
      const { data, error } = await supabaseAdmin
        .from('transaction_receipts')
        .select(`
          *,
          receipt_templates (
            template_type,
            template_name,
            template_config
          )
        `)
        .eq('transaction_reference', reference)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ReceiptService] Get error:', error);
      return null;
    }
  }
}

export const receiptService = new ReceiptService();
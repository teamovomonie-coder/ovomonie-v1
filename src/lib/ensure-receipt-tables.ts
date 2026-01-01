import { supabaseAdmin } from '@/lib/supabase';

export async function ensureReceiptTables() {
  if (!supabaseAdmin) {
    console.error('[EnsureReceiptTables] No supabaseAdmin available');
    return false;
  }

  try {
    // Check if receipt_templates table exists by trying to query it
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('receipt_templates')
      .select('id')
      .limit(1);

    if (templatesError && templatesError.code === 'PGRST116') {
      console.log('[EnsureReceiptTables] Receipt templates table does not exist');
      // Table doesn't exist, but we can't create it via RPC in hosted Supabase
      // The migration needs to be run manually
      return false;
    }

    // Check if we have default templates
    const { data: existingTemplates, error: checkError } = await supabaseAdmin
      .from('receipt_templates')
      .select('template_type');

    if (checkError) {
      console.error('[EnsureReceiptTables] Failed to check existing templates:', checkError);
      return false;
    }

    const existingTypes = existingTemplates?.map(t => t.template_type) || [];
    const requiredTypes = ['betting', 'utility', 'airtime', 'internal-transfer', 'external-transfer', 'memo-transfer'];
    const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));

    if (missingTypes.length > 0) {
      console.log('[EnsureReceiptTables] Inserting missing templates:', missingTypes);
      
      const templates = [
        {
          template_type: 'betting',
          template_name: 'Betting Receipt',
          template_config: {
            title: 'Betting Payment Successful',
            icon: 'gamepad',
            color: '#10b981',
            fields: [
              { key: 'platform', label: 'Betting Platform', type: 'text' },
              { key: 'accountId', label: 'Account ID', type: 'text' },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        },
        {
          template_type: 'utility',
          template_name: 'Utility Bill Receipt',
          template_config: {
            title: 'Bill Payment Successful',
            icon: 'zap',
            color: '#3b82f6',
            fields: [
              { key: 'biller', label: 'Service Provider', type: 'text' },
              { key: 'accountId', label: 'Meter/Account Number', type: 'text' },
              { key: 'verifiedName', label: 'Account Name', type: 'text', optional: true },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'token', label: 'Energy Token', type: 'token', optional: true },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        },
        {
          template_type: 'airtime',
          template_name: 'Airtime/Data Receipt',
          template_config: {
            title: 'Airtime Purchase Successful',
            icon: 'smartphone',
            color: '#8b5cf6',
            fields: [
              { key: 'network', label: 'Service Provider', type: 'text' },
              { key: 'phoneNumber', label: 'Recipient Number', type: 'phone' },
              { key: 'planName', label: 'Plan', type: 'text', optional: true },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        },
        {
          template_type: 'internal-transfer',
          template_name: 'Internal Transfer Receipt',
          template_config: {
            title: 'Transfer Successful!',
            icon: 'landmark',
            color: '#3b82f6',
            fields: [
              { key: 'recipientName', label: 'Recipient', type: 'text' },
              { key: 'bankName', label: 'Bank', type: 'text' },
              { key: 'accountNumber', label: 'Account Number', type: 'text' },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'narration', label: 'Narration', type: 'text', optional: true },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        },
        {
          template_type: 'external-transfer',
          template_name: 'External Transfer Receipt',
          template_config: {
            title: 'Transfer Successful!',
            icon: 'landmark',
            color: '#3b82f6',
            fields: [
              { key: 'recipientName', label: 'Recipient', type: 'text' },
              { key: 'bankName', label: 'Bank', type: 'text' },
              { key: 'accountNumber', label: 'Account Number', type: 'text' },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'narration', label: 'Narration', type: 'text', optional: true },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        },
        {
          template_type: 'memo-transfer',
          template_name: 'Memo Transfer Receipt',
          template_config: {
            title: 'Transfer Successful!',
            icon: 'landmark',
            color: '#3b82f6',
            fields: [
              { key: 'recipientName', label: 'Recipient', type: 'text' },
              { key: 'bankName', label: 'Bank', type: 'text' },
              { key: 'accountNumber', label: 'Account Number', type: 'text' },
              { key: 'amount', label: 'Amount', type: 'currency' },
              { key: 'message', label: 'Message', type: 'text', optional: true },
              { key: 'transactionId', label: 'Reference', type: 'reference' },
              { key: 'completedAt', label: 'Date', type: 'datetime' }
            ]
          }
        }
      ];

      const templatesToInsert = templates.filter(t => missingTypes.includes(t.template_type));
      
      const { error: insertError } = await supabaseAdmin
        .from('receipt_templates')
        .insert(templatesToInsert);

      if (insertError) {
        console.error('[EnsureReceiptTables] Failed to insert templates:', insertError);
        return false;
      }

      console.log('[EnsureReceiptTables] Templates inserted successfully');
    }

    console.log('[EnsureReceiptTables] Receipt system ready');
    return true;
  } catch (error) {
    console.error('[EnsureReceiptTables] Error:', error);
    return false;
  }
}
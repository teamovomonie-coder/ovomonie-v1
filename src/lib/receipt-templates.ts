/**
 * Receipt Template Service
 * Manages bill payment receipt templates from Supabase
 */

import { supabase } from './supabase';

export interface ReceiptTemplate {
  id: string;
  category: string;
  template_name: string;
  fields: string[];
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  icon: string;
  created_at?: string;
}

export interface ReceiptData {
  template: ReceiptTemplate;
  data: {
    biller: { id: string; name: string };
    amount: number;
    accountId: string;
    verifiedName?: string | null;
    bouquet?: any;
    transactionId: string;
    completedAt: string;
    token?: string | null;
    KCT1?: string | null;
    KCT2?: string | null;
    [key: string]: any;
  };
}

class ReceiptTemplateService {
  private templates: Map<string, ReceiptTemplate> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach((template: ReceiptTemplate) => {
          this.templates.set(template.category.toLowerCase(), template);
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('[Receipt Templates] Failed to load:', error);
      this.loadDefaultTemplates();
    }
  }

  private loadDefaultTemplates() {
    const defaults: ReceiptTemplate[] = [
      {
        id: 'utility-default',
        category: 'utility',
        template_name: 'Utility Bill Receipt',
        fields: ['meterNumber', 'token', 'units', 'tariff'],
        color_scheme: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fef3c7' },
        icon: 'zap',
      },
      {
        id: 'cabletv-default',
        category: 'cable tv',
        template_name: 'Cable TV Receipt',
        fields: ['smartCardNumber', 'bouquet', 'duration', 'renewalDate'],
        color_scheme: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#ede9fe' },
        icon: 'tv',
      },
      {
        id: 'internet-default',
        category: 'internet subscription',
        template_name: 'Internet Subscription Receipt',
        fields: ['accountNumber', 'package', 'speed', 'validUntil'],
        color_scheme: { primary: '#06b6d4', secondary: '#22d3ee', accent: '#cffafe' },
        icon: 'wifi',
      },
      {
        id: 'betting-default',
        category: 'betting',
        template_name: 'Betting Wallet Receipt',
        fields: ['accountId', 'walletBalance', 'bonusAmount'],
        color_scheme: { primary: '#10b981', secondary: '#34d399', accent: '#d1fae5' },
        icon: 'trophy',
      },
      {
        id: 'water-default',
        category: 'water',
        template_name: 'Water Bill Receipt',
        fields: ['accountNumber', 'meterReading', 'consumption'],
        color_scheme: { primary: '#3b82f6', secondary: '#60a5fa', accent: '#dbeafe' },
        icon: 'droplet',
      },
    ];

    defaults.forEach(template => {
      this.templates.set(template.category.toLowerCase(), template);
    });
  }

  async getTemplate(category: string): Promise<ReceiptTemplate> {
    if (!this.initialized) {
      await this.initialize();
    }

    const template = this.templates.get(category.toLowerCase());
    if (template) return template;

    // Fallback to generic template
    return {
      id: 'generic-default',
      category: 'generic',
      template_name: 'Bill Payment Receipt',
      fields: ['accountId', 'reference'],
      color_scheme: { primary: '#6366f1', secondary: '#818cf8', accent: '#e0e7ff' },
      icon: 'receipt',
    };
  }

  async createReceipt(category: string, data: any): Promise<ReceiptData> {
    const template = await this.getTemplate(category);
    return { template, data };
  }
}

export const receiptTemplateService = new ReceiptTemplateService();

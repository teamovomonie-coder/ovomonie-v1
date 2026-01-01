export interface ReceiptData {
  data: {
    transactionId: string;
    amount: number;
    completedAt: string;
    biller: {
      name: string;
    };
  };
  template: {
    category: string;
  };
}

export const receiptTemplateService = {
  getTemplate: (category: string) => ({ category }),
  generateReceipt: (data: any) => ({ data, template: { category: 'default' } })
};
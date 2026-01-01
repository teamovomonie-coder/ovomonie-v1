import { Card } from "@/components/ui/card";

export function BettingReceipt({ receipt }: { receipt: any }) {
  return (
    <Card className="p-4">
      <h3 className="font-bold">Betting Receipt</h3>
      <p>Transaction ID: {receipt.data.transactionId}</p>
      <p>Amount: ₦{receipt.data.amount.toLocaleString()}</p>
    </Card>
  );
}
import { Card } from "@/components/ui/card";

export function AirtimeReceipt({ receipt }: { receipt: any }) {
  return (
    <Card className="p-4">
      <h3 className="font-bold">Airtime Receipt</h3>
      <p>Transaction ID: {receipt.data.transactionId}</p>
      <p>Amount: ₦{receipt.data.amount.toLocaleString()}</p>
    </Card>
  );
}
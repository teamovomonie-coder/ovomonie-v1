import { AppShell } from "@/components/layout/app-shell";
import { BillerList } from "@/components/bill-payment/biller-list";

export default function BillPaymentPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Bill Payments</h2>
        <BillerList />
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Send,
  CreditCard,
  QrCode,
  Receipt,
} from "lucide-react";

const features = [
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
  { href: "/memo-transfer", label: "MemoTransfer", icon: Send },
  { href: "/custom-card", label: "Custom Card", icon: CreditCard },
  { href: "/scan-to-pay", label: "Scan to Pay", icon: QrCode },
  { href: "/bill-payment", label: "Bill Payments", icon: Receipt },
];

export function QuickAccess() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Access</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.label} passHref>
              <Button variant="outline" className="flex flex-col h-20 w-full">
                <feature.icon className="h-6 w-6 mb-1 text-primary" />
                <span className="text-xs font-medium">{feature.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

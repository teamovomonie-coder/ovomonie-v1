import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StockTradingPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Stock Trading</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Buy and sell stocks, track your portfolio, and access market data.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

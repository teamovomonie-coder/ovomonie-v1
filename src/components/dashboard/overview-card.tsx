import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";

export function OverviewCard() {
  const accountNumber = "8012345678"; // Last 10 digits of a sample phone number

  return (
    <>
      <Card className="col-span-4 md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦1,250,345.00</div>
          <p className="text-xs text-muted-foreground">
            Account Number: {accountNumber}
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button className="w-full">
            <ArrowUp className="mr-2 h-4 w-4" /> Send
          </Button>
        </CardContent>
      </Card>
      <Card className="col-span-2 md:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium invisible">Placeholder</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
            <Button className="w-full" variant="secondary">
              <ArrowDown className="mr-2 h-4 w-4" /> Receive
            </Button>
        </CardContent>
      </Card>
    </>
  );
}

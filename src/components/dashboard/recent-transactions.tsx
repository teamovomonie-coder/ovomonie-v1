import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: 1, description: "Spotify Subscription", date: "2024-07-25", amount: -2500, status: "Success" },
  { id: 2, description: "Groceries from MarketSquare", date: "2024-07-24", amount: -15200, status: "Success" },
  { id: 3, description: "Salary Deposit", date: "2024-07-24", amount: 450000, status: "Success" },
  { id: 4, description: "Airtime Purchase", date: "2024-07-23", amount: -1000, status: "Success" },
  { id: 5, description: "Transfer to John Doe", date: "2024-07-22", amount: -50000, status: "Pending" },
  { id: 6, description: "Netflix Subscription", date: "2024-07-21", amount: -4500, status: "Failed" },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (₦)</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground">{transaction.date}</div>
                </TableCell>
                <TableCell className={`text-right font-semibold ${transaction.amount > 0 ? "text-green-600" : ""}`}>
                  {transaction.amount.toLocaleString('en-NG')}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={transaction.status === 'Success' ? 'default' : transaction.status === 'Pending' ? 'secondary' : 'destructive'}
                   className={`${transaction.status === 'Success' ? 'bg-green-500/20 text-green-700' : transaction.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-red-500/20 text-red-700'}`}>
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

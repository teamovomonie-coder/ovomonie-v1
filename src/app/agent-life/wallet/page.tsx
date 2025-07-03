
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from 'lucide-react';

export default function WalletPage() {
    return (
        <AppShell>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Business Wallet</h2>
                </div>
                 <p className="text-muted-foreground -mt-4">Manage your business funds, view statements, and more.</p>
                <Card className="text-center py-20">
                    <CardHeader>
                        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Wallet Feature Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This section will contain your wallet balance, transaction history, and float management tools.</p>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}

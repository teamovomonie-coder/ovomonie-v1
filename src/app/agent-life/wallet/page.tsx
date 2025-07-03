
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from 'lucide-react';

export default function WalletPage() {
    return (
        <AppShell>
            <div className="p-4 space-y-4">
                <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
                    <h2 className="text-2xl font-bold tracking-tight">Business Wallet</h2>
                    <p className="text-primary-foreground/80 text-sm">Manage your business funds, view statements, and more.</p>
                </header>
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

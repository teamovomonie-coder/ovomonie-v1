
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from 'lucide-react';

export default function MerchantMorePage() {
    return (
        <AppShell>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">More Options</h2>
                </div>
                <p className="text-muted-foreground -mt-4">Manage your profile, settings, and get support.</p>
                <Card className="text-center py-20">
                    <CardHeader>
                        <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>More Features Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This section will include your merchant profile, KYC upgrades, support chat, and other settings.</p>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}

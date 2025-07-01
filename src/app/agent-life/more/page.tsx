
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from 'lucide-react';

export default function MerchantMorePage() {
    return (
        <div className="p-4 space-y-4">
             <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">More Options</h2>
                <p className="text-primary-foreground/80 text-sm">Manage your profile, settings, and get support.</p>
            </header>
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
    );
}

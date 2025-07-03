
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from 'lucide-react';

export default function ReportsPage() {
    return (
        <AppShell>
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Analytics & Reports</h2>
                </div>
                 <p className="text-muted-foreground -mt-4">Gain insights into your business performance.</p>

                <Card className="text-center py-20">
                    <CardHeader>
                        <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Analytics Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This section will feature real-time charts, downloadable reports, and performance monitoring.</p>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}

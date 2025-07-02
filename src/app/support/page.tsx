import { AppShell } from "@/components/layout/app-shell";
import { SupportDashboard } from "@/components/support/support-dashboard";

export default function SupportPage() {
    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
                <SupportDashboard />
            </div>
        </AppShell>
    );
}

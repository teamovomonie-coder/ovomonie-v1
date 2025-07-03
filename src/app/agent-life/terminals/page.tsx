
import { AppShell } from "@/components/layout/app-shell";
import { TerminalManagement } from "@/components/merchant/terminal-management";

export default function TerminalsPage() {
    return (
        <AppShell>
            <TerminalManagement />
        </AppShell>
    );
}

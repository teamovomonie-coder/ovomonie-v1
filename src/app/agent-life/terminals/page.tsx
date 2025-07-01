
import { TerminalManagement } from "@/components/merchant/terminal-management";

export default function TerminalsPage() {
    return (
        <div className="p-4 space-y-4">
            <header className="bg-primary text-primary-foreground -mx-4 -mt-4 p-4 py-6 rounded-b-2xl shadow-lg">
                <h2 className="text-2xl font-bold tracking-tight">POS Terminal Management</h2>
                <p className="text-primary-foreground/80 text-sm">Monitor and manage all your POS devices.</p>
            </header>
            <TerminalManagement />
        </div>
    );
}

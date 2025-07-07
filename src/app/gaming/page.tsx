import { AppShell } from "@/components/layout/app-shell";
import { GamingHub } from "@/components/gaming/gaming-hub";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function GamingPage() {
  return (
    <AppShell>
      <div className="flex-1 p-0 sm:p-4">
        <GamingHub />
      </div>
    </AppShell>
  );
}

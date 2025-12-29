import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamingPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Gamepad2 className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Gaming</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">Coming Soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Play games, earn rewards, and compete with friends.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function CacRegistrationPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">CAC Business Registration</CardTitle>
            <CardDescription className="text-center text-lg">
              Coming Soon
            </CardDescription>
            <p className="text-center text-muted-foreground max-w-md">
              Register your business with the Corporate Affairs Commission seamlessly.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

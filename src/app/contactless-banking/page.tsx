import { AppShell } from "@/components/layout/app-shell";
import { ContactlessUI } from "@/components/contactless/contactless-ui";

export default function ContactlessBankingPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <ContactlessUI />
      </div>
    </AppShell>
  );
}

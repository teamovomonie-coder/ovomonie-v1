import { AppShell } from "@/components/layout/app-shell";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <NotificationCenter />
      </div>
    </AppShell>
  );
}

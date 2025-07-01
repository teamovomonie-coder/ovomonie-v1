import { AppShell } from "@/components/layout/app-shell";
import { RideBooking } from "@/components/ride-booking/ride-booking";

export default function RideBookingPage() {
  return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center p-0 sm:p-4">
        <RideBooking />
      </div>
    </AppShell>
  );
}

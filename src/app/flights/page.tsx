import { AppShell } from "@/components/layout/app-shell";
import { FlightBooking } from "@/components/flights/flight-booking";

export default function FlightsPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <FlightBooking />
      </div>
    </AppShell>
  );
}

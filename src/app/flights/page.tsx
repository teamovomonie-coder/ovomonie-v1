import { AppShell } from "@/components/layout/app-shell";
import { FlightBooking } from "@/components/flights/flight-booking";

export default function FlightsPage() {
  return (
    <AppShell>
      <FlightBooking />
    </AppShell>
  );
}

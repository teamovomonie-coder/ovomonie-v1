
import { AppShell } from "@/components/layout/app-shell";
import { HotelBooking } from "@/components/hotel-booking/hotel-booking";

export default function HotelBookingPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <HotelBooking />
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { FlightBooking } from "@/components/flights/flight-booking";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FlightsPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Flight Booking</h2>
        </div>
        <Card>
            <CardContent className="p-4 sm:p-6">
                 <FlightBooking />
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

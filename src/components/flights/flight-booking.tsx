"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";

export function FlightBooking() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
            <Plane className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4">Flight Ticket Booking</CardTitle>
            <CardDescription>
                Search and book local and international flights with ease. This feature is currently under construction.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground p-8">
                <p>Coming soon...</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

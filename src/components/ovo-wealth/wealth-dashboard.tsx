"use client"

import { WealthNotificationProvider } from "@/context/wealth-notification-context";
import { OvomonieWealthMain } from "./ovomonie-wealth-main";

export function WealthDashboard() {
  console.log('WealthDashboard rendering');
  return (
    <WealthNotificationProvider>
      <OvomonieWealthMain />
    </WealthNotificationProvider>
  );
}
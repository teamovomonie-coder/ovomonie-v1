"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { format } from "date-fns";

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

interface SecurityActivity {
  id: string;
  event_type: string;
  description: string;
  ip_address: string;
  location: string;
  created_at: string;
}

function LogoutAllDevicesDialog({ onLogoutAll }: { onLogoutAll: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();

  const handleLogoutAll = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch("/api/auth/logout-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to log out other devices.");

      toast({ title: "Success! Please Log In Again.", description: "You have been logged out of all devices for your security." });
      logout();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="ml-auto" disabled={isLoading}>
          {isLoading ? <Icons.Loader2 className="mr-2 animate-spin" /> : <Icons.LogOut className="mr-2" />}
          Log Out All Other Devices
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out of all other devices?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign you out of Ovomonie on all other web browsers and devices, including this one. You will need to sign in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogoutAll}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SecurityCenterPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<SecurityActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevicesAndActivities();
  }, []);

  const fetchDevicesAndActivities = async () => {
    try {
      const token = localStorage.getItem("ovo-auth-token");
      
      // Fetch devices
      const devicesRes = await fetch("/api/security/devices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData.devices || []);
      }

      // Fetch security activities
      const activitiesRes = await fetch("/api/security/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch security data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const token = localStorage.getItem("ovo-auth-token");
      const response = await fetch(`/api/security/devices/${deviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to remove device");
      
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast({ title: "Device Removed", description: "The device has been unlinked from your account." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove device" });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Icons.Smartphone className="h-5 w-5 text-primary" />;
      case "tablet":
        return <Icons.Tablet className="h-5 w-5 text-primary" />;
      default:
        return <Icons.Monitor className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Icons.ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="text-2xl font-semibold text-slate-900">Security Center</h1>
        </div>

        <div className="space-y-4 max-w-4xl">
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Managed Devices</CardTitle>
              <CardDescription>These devices have recently accessed your account.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : devices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No devices found</p>
              ) : (
                devices.map(device => (
                  <div key={device.id} className="flex items-center justify-between py-3 border-b last:border-none">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.device_type)}
                      <div>
                        <p className="font-semibold">{device.device_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {device.browser} • {device.os}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.location} • {device.ip_address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {format(new Date(device.last_active), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      {device.is_current && <Badge variant="secondary">Current Device</Badge>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveDevice(device.id)} 
                      disabled={device.is_current}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <LogoutAllDevicesDialog onLogoutAll={fetchDevicesAndActivities} />
            </CardFooter>
          </Card>

          <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Recent Security Activity</CardTitle>
              <CardDescription>Monitor important security events on your account</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map(activity => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{activity.event_type}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{activity.location}</TableCell>
                        <TableCell className="font-mono text-xs">{activity.ip_address}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {format(new Date(activity.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

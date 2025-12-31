import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data: devices, error } = await supabaseAdmin
      .from("user_devices")
      .select("*")
      .eq("user_id", userId)
      .order("last_used", { ascending: false });

    if (error) {
      logger.error("Error fetching devices from database", { error, userId });
      throw error;
    }

    // Map database columns to frontend expected format
    const mappedDevices = (devices || []).map((device: any) => ({
      id: device.id,
      device_name: device.device_name || `Device ${device.device_fingerprint.substring(0, 8)}`,
      device_type: device.device_type || "Unknown",
      browser: device.browser || "Unknown Browser",
      os: device.os || "Unknown OS",
      ip_address: device.ip_address || "N/A",
      location: device.location || "Unknown",
      last_active: device.last_used || device.created_at,
      is_current: false, // Will be determined on frontend if needed
      is_trusted: device.is_trusted,
      liveness_verified: device.liveness_verified,
      device_fingerprint: device.device_fingerprint
    }));

    return NextResponse.json({ devices: mappedDevices });
  } catch (error: any) {
    logger.error("Error fetching devices", { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: "Failed to fetch devices", details: error.message },
      { status: 500 }
    );
  }
}

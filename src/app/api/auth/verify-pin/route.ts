import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/auth-helpers";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    const headersList = await headers();
    const userId = await getUserIdFromToken(headersList);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
=======
    const userId = getUserIdFromToken(request.headers) || 'dev-user-fallback';
>>>>>>> 2df66c9c09cc07b6cf12ffa753372777fb2cf6b2

    const { pin } = await request.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ message: "Invalid PIN format" }, { status: 400 });
    }

    // Accept any 4-digit PIN for demo mode
    logger.info("PIN verified (demo mode)", { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("PIN verification error", { error });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

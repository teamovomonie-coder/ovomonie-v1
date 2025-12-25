import { NextRequest } from "next/server";
import { verifyAuthToken } from "./auth";

export function getUserIdFromToken(headers: Headers | Record<string, any> | any): string | null {
  try {
    const authHeader =
      (typeof headers?.get === 'function' && headers.get('authorization')) ||
      headers?.authorization ||
      headers?.['authorization'];

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyAuthToken(token);
    if (!payload || !payload.sub) return null;
    return payload.sub;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.substring(7);
    const payload = verifyAuthToken(token);
    if (!payload || !payload.sub) return null;
    return payload.sub;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

export async function getUserIdFromSupabase(token: string): Promise<string | null> {
  try {
    const { supabase } = await import("./supabase");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (error) {
    console.error("Error getting user from Supabase:", error);
    return null;
  }
}

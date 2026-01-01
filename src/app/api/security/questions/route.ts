import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUserIdFromToken } from "@/lib/auth-helpers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("security_questions")
      .select("question1, question2, question3")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("Failed to fetch security questions", { error, userId });
      return NextResponse.json({ error: "Failed to fetch security questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: data || null });
  } catch (error) {
    logger.error("Error in GET /api/security/questions", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken(headers());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question1, answer1, question2, answer2, question3, answer3 } = body;

    if (!question1 || !answer1 || !question2 || !answer2 || !question3 || !answer3) {
      return NextResponse.json({ error: "All questions and answers are required" }, { status: 400 });
    }

    // Hash answers
    const answer1Hash = await bcrypt.hash(answer1.toLowerCase().trim(), 10);
    const answer2Hash = await bcrypt.hash(answer2.toLowerCase().trim(), 10);
    const answer3Hash = await bcrypt.hash(answer3.toLowerCase().trim(), 10);

    // Check if user already has security questions
    const { data: existing } = await supabaseAdmin
      .from("security_questions")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabaseAdmin
        .from("security_questions")
        .update({
          question1,
          answer1_hash: answer1Hash,
          question2,
          answer2_hash: answer2Hash,
          question3,
          answer3_hash: answer3Hash,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        logger.error("Failed to update security questions", { error, userId });
        return NextResponse.json({ error: "Failed to update security questions" }, { status: 500 });
      }
    } else {
      // Insert new
      const { error } = await supabaseAdmin
        .from("security_questions")
        .insert({
          user_id: userId,
          question1,
          answer1_hash: answer1Hash,
          question2,
          answer2_hash: answer2Hash,
          question3,
          answer3_hash: answer3Hash,
        });

      if (error) {
        logger.error("Failed to create security questions", { error, userId });
        return NextResponse.json({ error: "Failed to create security questions" }, { status: 500 });
      }
    }

    logger.info("Security questions saved", { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in POST /api/security/questions", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

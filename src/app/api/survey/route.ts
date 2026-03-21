import { type NextRequest, NextResponse } from "next/server";
import { pgDb } from "@/lib/db/pg/db.pg";
import { SurveyResponseTable } from "@/lib/db/pg/schema.pg";
import { auth } from "auth/server";
import { headers } from "next/headers";
import { desc } from "drizzle-orm";

// POST - Submit a new survey response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rating, feedback } = body;

    if (!rating || !["like", "dislike"].includes(rating)) {
      return NextResponse.json(
        { error: "Rating is required and must be 'like' or 'dislike'" },
        { status: 400 },
      );
    }

    // Get the current user session (optional - guests can also submit)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id || null;
    const userEmail = session?.user?.email || null;
    const userName = session?.user?.name || "Guest";

    await pgDb.insert(SurveyResponseTable).values({
      userId,
      userEmail,
      userName,
      rating,
      feedback: feedback || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error submitting survey:", error);
    return NextResponse.json(
      { error: "Failed to submit survey" },
      { status: 500 },
    );
  }
}

// GET - Get all survey responses (admin only)
export async function GET() {
  try {
    // Check admin session
    const headersList = await headers();
    const adminSession = headersList.get("cookie")?.includes("admin_session=");

    if (!adminSession) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const surveys = await pgDb
      .select({
        id: SurveyResponseTable.id,
        userId: SurveyResponseTable.userId,
        userEmail: SurveyResponseTable.userEmail,
        userName: SurveyResponseTable.userName,
        rating: SurveyResponseTable.rating,
        feedback: SurveyResponseTable.feedback,
        createdAt: SurveyResponseTable.createdAt,
      })
      .from(SurveyResponseTable)
      .orderBy(desc(SurveyResponseTable.createdAt));

    return NextResponse.json(surveys);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 },
    );
  }
}

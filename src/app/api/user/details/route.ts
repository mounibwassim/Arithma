import { getSession } from "auth/server";
import { getUser } from "lib/user/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      // Return empty object for guest users instead of 401
      return NextResponse.json({});
    }
    const user = await getUser(session.user.id);
    return NextResponse.json(user ?? {});
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get user details" },
      { status: 500 },
    );
  }
}

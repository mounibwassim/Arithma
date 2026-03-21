import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        username: session.username,
        name: session.name,
      },
    });
  } catch (error) {
    console.error("Admin session check error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

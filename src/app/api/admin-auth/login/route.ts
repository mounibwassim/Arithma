import { type NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  createAdminSession,
} from "@/lib/admin/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const result = await validateAdminCredentials(username, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await createAdminSession(result.admin);

    return NextResponse.json({
      success: true,
      admin: {
        username: result.admin.username,
        name: result.admin.name,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}

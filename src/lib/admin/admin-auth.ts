import "server-only";
import { cookies } from "next/headers";
import { pgDb } from "@/lib/db/pg/db.pg";
import { AdminCredentialsTable } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcrypt-ts";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  adminId: string;
  username: string;
  name: string;
  role: "admin" | "super_admin";
  expiresAt: number;
}

/**
 * Hash a password for storing in database
 */
export async function hashAdminPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

/**
 * Validate admin credentials against database
 */
export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<
  | {
      success: true;
      admin: {
        id: string;
        username: string;
        name: string;
        role: "admin" | "super_admin";
      };
    }
  | { success: false; error: string }
> {
  try {
    const admins = await pgDb
      .select()
      .from(AdminCredentialsTable)
      .where(eq(AdminCredentialsTable.username, username))
      .limit(1);

    if (admins.length === 0) {
      return { success: false, error: "Invalid admin ID or password" };
    }

    const admin = admins[0];
    const isValidPassword = await compare(password, admin.password);

    if (!isValidPassword) {
      return { success: false, error: "Invalid admin ID or password" };
    }

    // Update last login time
    await pgDb
      .update(AdminCredentialsTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(AdminCredentialsTable.id, admin.id));

    return {
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role as "admin" | "super_admin",
      },
    };
  } catch (error) {
    console.error("Error validating admin credentials:", error);
    return { success: false, error: "An error occurred during authentication" };
  }
}

/**
 * Create an admin session and set cookie
 */
export async function createAdminSession(admin: {
  id: string;
  username: string;
  name: string;
  role: "admin" | "super_admin";
}): Promise<void> {
  const session: AdminSession = {
    adminId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  const sessionData = Buffer.from(JSON.stringify(session)).toString("base64");
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

/**
 * Get the current admin session from cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: AdminSession = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8"),
    );

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      await clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Error getting admin session:", error);
    return null;
  }
}

/**
 * Clear the admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: ADMIN_SESSION_COOKIE,
    path: "/",
  });
}

/**
 * Require admin session or throw error
 */
export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized: Admin session required");
  }

  return session;
}

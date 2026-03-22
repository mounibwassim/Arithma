// Base auth instance without "server-only" - can be used in seed scripts
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { pgDb } from "lib/db/pg/db.pg";
import { headers } from "next/headers";
import {
  AccountTable,
  SessionTable,
  UserTable,
  VerificationTable,
} from "lib/db/pg/schema.pg";
import { getAuthConfig } from "./config";
import logger from "logger";
import { DEFAULT_USER_ROLE, USER_ROLES } from "app-types/roles";
import { admin, editor, user, ac } from "./roles";

const {
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

const options = {
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    adminPlugin({
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [USER_ROLES.ADMIN],
      ac,
      roles: {
        admin,
        editor,
        user,
      },
    }),
    nextCookies(),
  ],
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_ENV === "preview" ? "https://*.vercel.app" : undefined,
  ].filter(Boolean) as string[],
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserTable,
      session: SessionTable,
      account: AccountTable,
      verification: VerificationTable,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // This hook ONLY runs during user creation (sign-up), not on sign-in
          // Use our optimized getIsFirstUser function with caching
          const isFirstUser = await getIsFirstUser();

          // Set role based on whether this is the first user
          const role = isFirstUser ? USER_ROLES.ADMIN : DEFAULT_USER_ROLE;

          logger.info(
            `User creation hook: ${user.email} will get role: ${role} (isFirstUser: ${isFirstUser})`,
          );

          return {
            data: {
              ...user,
              role,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true, // EXPLICITLY SET AS REQUESTED
    disableSignUp: !signUpEnabled,
    resetPasswordTokenExpiresIn: 120, // 2 minutes
    sendResetPassword: async ({ user, url }) => {
      logger.info(`Password reset requested for: ${user.email}`);
      try {
        const { sendPasswordResetEmail } = await import("lib/email/email");
        const success = await sendPasswordResetEmail(user.email, url);
        if (success) {
          logger.info(
            `Password reset email sent successfully to: ${user.email}`,
          );
        } else {
          logger.error(`Failed to send password reset email to: ${user.email}`);
        }
      } catch (error) {
        logger.error("Error sending password reset email:", error);
        throw error; // Re-throw to let better-auth know it failed
      }
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  advanced: {
    // @ts-expect-error user explicitly requested crossTab
    crossTab: true,
    disableCsrfCheck: process.env.NODE_ENV === "development",
    crossSubDomainCookies: process.env.VERCEL_ENV === "preview" ? {
      enabled: true,
      domain: ".vercel.app",
    } : undefined,
    useSecureCookies:
      process.env.NO_HTTPS === "1"
        ? false
        : process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "preview",
    database: {
      generateId: false,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  socialProviders: socialAuthenticationProviders,
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? [])],
});

export const getSession = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return null;
    }
    return session;
  } catch (error: any) {
    logger.error("Error getting session:", error);
    
    // Prevent catching expected Next.js core errors
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    if (error?.digest?.includes("NEXT_REDIRECT")) throw error;
    if (error?.digest?.includes("DYNAMIC_SERVER_USAGE")) throw error;
    
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    return null;
  }
};

// Cache the first user check to avoid repeated DB queries
let isFirstUserCache: boolean | null = null;

export const getIsFirstUser = async () => {
  if (isFirstUserCache === false) {
    return false;
  }

  try {
    const { count } = await import("drizzle-orm");
    const [result] = await pgDb.select({ count: count() }).from(UserTable);
    const isFirstUser = result?.count === 0;

    if (!isFirstUser) {
      isFirstUserCache = false;
    }

    return isFirstUser;
  } catch (error) {
    logger.error("Error checking if first user:", error);
    isFirstUserCache = false;
    return false;
  }
};

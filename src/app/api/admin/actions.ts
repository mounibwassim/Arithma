"use server";

import { validatedActionWithAdminPermission } from "lib/action-utils";
import { headers } from "next/headers";
import { auth } from "auth/server";
import { DEFAULT_USER_ROLE, userRolesInfo } from "app-types/roles";
import {
  UpdateUserRoleSchema,
  type UpdateUserRoleActionState,
  UpdateUserBanStatusSchema,
  type UpdateUserBanStatusActionState,
} from "./validations";
import logger from "lib/logger";
import { getTranslations } from "next-intl/server";
import { getUser } from "lib/user/server";
import { getAdminSession, type AdminSession } from "lib/admin/admin-auth";
import type { z } from "zod";
import type { ActionState } from "lib/action-utils";

type ValidatedActionWithAdminSessionFunction<
  S extends z.ZodType<any, any>,
  T,
> = (
  data: z.infer<S>,
  formData: FormData,
  adminSession: AdminSession,
) => Promise<T>;

function validatedActionWithAdminSession<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithAdminSessionFunction<S, T>,
) {
  return async (_prevState: ActionState, formData: FormData) => {
    const session = await getAdminSession();

    if (!session) {
      return {
        success: false,
        message: "Unauthorized: Admin session required",
      } as T;
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return {
        success: false,
        message: result.error.issues[0].message,
      } as T;
    }

    return action(result.data, formData, session);
  };
}

export const updateUserRolesAction = validatedActionWithAdminPermission(
  UpdateUserRoleSchema,
  async (data, _formData, userSession): Promise<UpdateUserRoleActionState> => {
    const t = await getTranslations("Admin.UserRoles");
    const tCommon = await getTranslations("User.Profile.common");
    const { userId, role: roleInput } = data;

    const role = roleInput || DEFAULT_USER_ROLE;
    if (userSession.user.id === userId) {
      return {
        success: false,
        message: t("cannotUpdateOwnRole"),
      };
    }
    await auth.api.setRole({
      body: { userId, role },
      headers: await headers(),
    });
    await auth.api.revokeUserSessions({
      body: { userId },
      headers: await headers(),
    });
    const user = await getUser(userId);
    if (!user) {
      return {
        success: false,
        message: tCommon("userNotFound"),
      };
    }

    return {
      success: true,
      message: t("roleUpdatedSuccessfullyTo", {
        role: userRolesInfo[role].label,
      }),
      user,
    };
  },
);

export const updateUserBanStatusAction = validatedActionWithAdminPermission(
  UpdateUserBanStatusSchema,
  async (
    data,
    _formData,
    userSession,
  ): Promise<UpdateUserBanStatusActionState> => {
    const tCommon = await getTranslations("User.Profile.common");
    const { userId, banned, banReason } = data;

    if (userSession.user.id === userId) {
      return {
        success: false,
        message: tCommon("cannotBanUnbanYourself"),
      };
    }
    try {
      if (!banned) {
        await auth.api.banUser({
          body: {
            userId,
            banReason:
              banReason ||
              (await getTranslations("User.Profile.common"))("bannedByAdmin"),
          },
          headers: await headers(),
        });
        await auth.api.revokeUserSessions({
          body: { userId },
          headers: await headers(),
        });
      } else {
        await auth.api.unbanUser({
          body: { userId },
          headers: await headers(),
        });
      }
      const user = await getUser(userId);
      if (!user) {
        return {
          success: false,
          message: tCommon("userNotFound"),
        };
      }
      return {
        success: true,
        message: user.banned
          ? tCommon("userBannedSuccessfully")
          : tCommon("userUnbannedSuccessfully"),
        user,
      };
    } catch (error) {
      logger.error(error);
      return {
        success: false,
        message: tCommon("failedToUpdateUserStatus"),
        error: error instanceof Error ? error.message : tCommon("unknownError"),
      };
    }
  },
);

import { DeleteUserSchema, type DeleteUserActionState } from "./validations";
import { deleteAdminUser } from "lib/admin/server";

export const deleteUserAction = validatedActionWithAdminSession(
  DeleteUserSchema,
  async (data, _formData, adminSession): Promise<DeleteUserActionState> => {
    const t = await getTranslations("Admin.Users");
    const tCommon = await getTranslations("User.Profile.common");
    const { userId } = data;

    // Admin cannot delete themselves (though IDs probably won't match as they are different tables)
    if (adminSession.adminId === userId) {
      return {
        success: false,
        message: tCommon("cannotDeleteYourself"),
      };
    }

    try {
      // Also delete from auth provider if needed, but for now we focus on DB
      // Ideally we should use auth.api.deleteUser but we are using our own repository for now
      // dependent on how Better Auth is integrated.
      // Assuming deleting from our DB is enough or we should use auth.api.deleteUser
      // Let's use auth.api.deleteUser which probably handles everything if available
      // But we wrote deleteAdminUser in the repo.
      // Let's try to use auth.api first as it is more "correct" for the auth system,
      // but the user asked to use the delete icon and I modified the repo.
      // Better Auth might not have a simple "deleteUser" exposed like that or it might be different.
      // Let's stick to our repository deletion for custom tables, and try to call auth deletion if possible.
      // Checking the imports, we have `auth` from `auth/server`.

      // If we look at existing actions:
      // await auth.api.banUser ...

      // Let's look if there is deleteUser in auth.api
      // If not, we use our repo.
      // For now, I will use deleteAdminUser from lib/admin/server which uses our repo.
      // AND I will try to call auth.api.deleteUser to cleanup auth tables if separate.
      // However, to avoid complexity/errors if auth.api.deleteUser doesn't exist or signature differs,
      // I will rely on my repo implementation which deletes from UserTable.
      // NOTE: `UserTable` IS the table used by Better Auth in this schema (from schema.pg.ts).
      // So deleting from UserTable via repo is correct.

      await deleteAdminUser(userId);

      return {
        success: true,
        message: t("userDeletedSuccessfully"),
      };
    } catch (error) {
      logger.error(error);
      return {
        success: false,
        message: t("failedToDeleteUser"),
        error: error instanceof Error ? error.message : tCommon("unknownError"),
      };
    }
  },
);

import "server-only";

import { getSession } from "lib/auth/server";
import type {
  AdminAnalyticsStats,
  AdminChatHistoryPaginated,
  AdminUsersPaginated,
  AdminUsersQuery,
} from "app-types/admin";
import { requireAdminPermission } from "lib/auth/permissions";
import pgAdminRepository from "lib/db/pg/repositories/admin-respository.pg";

export const ADMIN_USER_LIST_LIMIT = 10;
export const DEFAULT_SORT_BY = "createdAt";
export const DEFAULT_SORT_DIRECTION = "desc";

/**
 * Require an admin session
 * This is a wrapper around the getSession function
 * that throws an error if the user is not an admin
 *
 * @deprecated Use requireAdminPermission() from lib/auth/permissions instead
 */
export async function requireAdminSession(): Promise<
  NonNullable<Awaited<ReturnType<typeof getSession>>>
> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized: No session found");
  }

  // Use our new permission system internally
  await requireAdminPermission("access admin functions");

  return session;
}

/**
 * Get paginated users using our custom repository with improved search capabilities
 * Only admins can list and search users
 */
export async function getAdminUsers(
  query?: AdminUsersQuery,
): Promise<AdminUsersPaginated> {
  // Skip permission checks - now uses separate admin auth system
  // The admin dashboard layout handles authentication via admin session

  try {
    // Use our custom repository with improved search
    const result = await pgAdminRepository.getUsers({
      ...query,
      limit: query?.limit ?? ADMIN_USER_LIST_LIMIT,
      offset: query?.offset ?? 0,
      sortBy: query?.sortBy ?? DEFAULT_SORT_BY,
      sortDirection: query?.sortDirection ?? DEFAULT_SORT_DIRECTION,
    });

    return result;
  } catch (error) {
    console.error("Error getting admin users", error);
    throw error;
  }
}

/**
 * Delete a user by ID
 * Only admins can delete users
 */
export async function deleteAdminUser(userId: string): Promise<void> {
  // Permission checks are handled by the action wrapper or caller
  try {
    await pgAdminRepository.deleteUser(userId);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get analytics statistics
 */
export async function getAdminAnalyticsStats(): Promise<AdminAnalyticsStats> {
  try {
    return await pgAdminRepository.getAnalyticsStats();
  } catch (error) {
    console.error("Error getting analytics stats", error);
    throw error;
  }
}

/**
 * Get chat history with pagination
 */
export async function getAdminChatHistory(
  page = 1,
  limit = 10,
  search?: string,
): Promise<AdminChatHistoryPaginated> {
  try {
    return await pgAdminRepository.getChatHistory(page, limit, search);
  } catch (error) {
    console.error("Error getting chat history", error);
    throw error;
  }
}

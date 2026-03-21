import type {
  AdminAnalyticsStats,
  AdminChatHistoryPaginated,
  AdminRepository,
  AdminUsersPaginated,
  AdminUsersQuery,
} from "app-types/admin";
import { pgDb as db } from "../db.pg";
import {
  ChatMessageTable,
  ChatThreadTable,
  SessionTable,
  UserTable,
} from "../schema.pg";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  ilike,
  or,
  sql,
} from "drizzle-orm";

// Helper function to get user columns without password
const getUserColumnsWithoutPassword = () => {
  const { password, ...userColumns } = getTableColumns(UserTable);
  return userColumns;
};

const pgAdminRepository: AdminRepository = {
  getUsers: async (query?: AdminUsersQuery): Promise<AdminUsersPaginated> => {
    const {
      searchValue,
      limit = 10,
      offset = 0,
      sortBy = "createdAt",
      sortDirection = "desc",
      filterField,
      filterValue,
      filterOperator = "eq",
    } = query || {};

    // Base query with user columns (excluding password) and last login
    const baseQuery = db
      .select({
        ...getUserColumnsWithoutPassword(),
        lastLogin: sql<Date | null>`(
          SELECT MAX(${SessionTable.updatedAt}) 
          FROM ${SessionTable} 
          WHERE ${SessionTable.userId} = ${UserTable.id}
        )`.as("lastLogin"),
      })
      .from(UserTable);

    // Build WHERE conditions
    const whereConditions: any[] = [];

    // Search across multiple fields (case insensitive)
    if (searchValue?.trim()) {
      const searchTerm = `%${searchValue.trim()}%`;
      whereConditions.push(
        or(
          ilike(UserTable.name, searchTerm),
          ilike(UserTable.email, searchTerm),
        ),
      );
    }

    // Apply filters
    if (filterField && filterValue !== undefined) {
      const filterCondition = buildFilterCondition(
        filterField,
        filterValue,
        filterOperator,
      );
      if (filterCondition) {
        whereConditions.push(filterCondition);
      }
    }

    // Build the final WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? whereConditions.length === 1
          ? whereConditions[0]
          : and(...whereConditions)
        : undefined;

    // Build ORDER BY
    const orderByClause = buildOrderBy(sortBy, sortDirection);

    // Execute main query
    const usersQueryBuilder = baseQuery
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
    const users = whereClause
      ? await usersQueryBuilder.where(whereClause)
      : await usersQueryBuilder;

    // Get total count with same WHERE conditions
    const countQueryBuilder = db.select({ count: count() }).from(UserTable);
    const [totalResult] = whereClause
      ? await countQueryBuilder.where(whereClause)
      : await countQueryBuilder;

    return {
      users: users.map((user) => ({
        ...user,
        preferences: undefined, // Exclude preferences from admin list
      })),
      total: totalResult?.count || 0,
      limit,
      offset,
    };
  },
  deleteUser: async (userId: string): Promise<void> => {
    await db.delete(UserTable).where(eq(UserTable.id, userId));
  },

  getAnalyticsStats: async (): Promise<AdminAnalyticsStats> => {
    const [userCount] = await db.select({ count: count() }).from(UserTable);
    const [threadCount] = await db
      .select({ count: count() })
      .from(ChatThreadTable);
    const [messageCount] = await db
      .select({ count: count() })
      .from(ChatMessageTable);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeUsers] = await db
      .select({ count: count(SessionTable.userId) })
      .from(SessionTable)
      .where(gt(SessionTable.updatedAt, oneDayAgo))
      .groupBy(SessionTable.userId);

    // If no active users found, activeUsers might be undefined
    const activeUsersCount = activeUsers?.count ?? 0;

    return {
      totalUsers: Number(userCount?.count ?? 0),
      totalThreads: Number(threadCount?.count ?? 0),
      totalMessages: Number(messageCount?.count ?? 0),
      activeUsersLast24h: Number(activeUsersCount),
    };
  },

  getChatHistory: async (
    page: number,
    limit: number,
    search?: string,
  ): Promise<AdminChatHistoryPaginated> => {
    const offset = (page - 1) * limit;

    // Build search condition
    const searchCondition = search?.trim()
      ? or(
          ilike(UserTable.name, `%${search.trim()}%`),
          ilike(UserTable.email, `%${search.trim()}%`),
        )
      : undefined;

    // When searching, return all matching results (no limit)
    // When not searching, apply pagination
    const dataQuery = db
      .select({
        id: ChatThreadTable.id,
        title: ChatThreadTable.title,
        userId: UserTable.id,
        userName: UserTable.name,
        userEmail: UserTable.email,
        createdAt: ChatThreadTable.createdAt,
        messageCount: count(ChatMessageTable.id),
      })
      .from(ChatThreadTable)
      .leftJoin(UserTable, eq(ChatThreadTable.userId, UserTable.id))
      .leftJoin(
        ChatMessageTable,
        eq(ChatThreadTable.id, ChatMessageTable.threadId),
      )
      .groupBy(ChatThreadTable.id, UserTable.id)
      .orderBy(desc(ChatThreadTable.createdAt));

    // Apply search condition and pagination
    const data = searchCondition
      ? await dataQuery.where(searchCondition) // No limit when searching - return all matches
      : await dataQuery.limit(limit).offset(offset);

    // Get total count (with or without search)
    const countQuery = db
      .select({ count: count() })
      .from(ChatThreadTable)
      .leftJoin(UserTable, eq(ChatThreadTable.userId, UserTable.id));

    const [totalCount] = searchCondition
      ? await countQuery.where(searchCondition)
      : await countQuery;

    return {
      data: data.map((item) => ({
        ...item,
        // messageCount returns a number, no need to cast if Drizzle typed it correctly,
        // but often count() returns number or string depending on driver.
        // For pg-drive/postgres.js it is often string.
        messageCount: Number(item.messageCount),
        userName: item.userName ?? "Unknown", // Handle null if user deleted
        userEmail: item.userEmail ?? "Unknown",
        userId: item.userId ?? "Unknown",
      })),
      total: totalCount?.count ?? 0,
    };
  },
};

// Helper function to build filter conditions
function buildFilterCondition(
  field: string,
  value: string | number | boolean,
  operator: string,
) {
  // Map common field names to actual columns
  let column;
  switch (field) {
    case "name":
      column = UserTable.name;
      break;
    case "email":
      column = UserTable.email;
      break;
    case "role":
      column = UserTable.role;
      break;
    case "banned":
      column = UserTable.banned;
      break;
    case "createdAt":
      column = UserTable.createdAt;
      break;
    case "updatedAt":
      column = UserTable.updatedAt;
      break;
    default:
      return null; // Unknown field
  }

  switch (operator) {
    case "eq":
      return eq(column, value);
    case "ne":
      return sql`${column} != ${value}`;
    case "lt":
      return sql`${column} < ${value}`;
    case "lte":
      return sql`${column} <= ${value}`;
    case "gt":
      return sql`${column} > ${value}`;
    case "gte":
      return sql`${column} >= ${value}`;
    case "contains":
      return ilike(column, `%${value}%`);
    default:
      return eq(column, value);
  }
}

// Helper function to build ORDER BY clause
function buildOrderBy(sortBy: string, direction: "asc" | "desc") {
  // Map common sort fields to actual columns
  let column;
  switch (sortBy) {
    case "name":
      column = UserTable.name;
      break;
    case "email":
      column = UserTable.email;
      break;
    case "role":
      column = UserTable.role;
      break;
    case "createdAt":
      column = UserTable.createdAt;
      break;
    case "updatedAt":
      column = UserTable.updatedAt;
      break;
    default:
      // Default to createdAt if invalid sortBy
      column = UserTable.createdAt;
      break;
  }
  return direction === "asc" ? asc(column) : desc(column);
}

export default pgAdminRepository;

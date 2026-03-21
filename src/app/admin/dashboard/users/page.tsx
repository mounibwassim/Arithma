import { UsersTable } from "@/components/admin/users-table";
import {
  ADMIN_USER_LIST_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  getAdminUsers,
} from "@/lib/admin/server";
import { getAdminSession } from "@/lib/admin/admin-auth";
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid static generation issues with session
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    query?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10);
  const limit = Number.parseInt(params.limit ?? ADMIN_USER_LIST_LIMIT.toString(), 10);
  const offset = (page - 1) * limit;
  const sortBy = params.sortBy ?? DEFAULT_SORT_BY;
  const sortDirection = params.sortDirection ?? DEFAULT_SORT_DIRECTION;

  const result = await getAdminUsers({
    searchValue: params.query,
    searchField: "email",
    searchOperator: "contains",
    limit,
    offset,
    sortBy,
    sortDirection,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          View and manage all registered users in the system
        </p>
      </div>
      <UsersTable
        users={result.users}
        currentUserId={session.adminId}
        total={result.total}
        page={page}
        limit={limit}
        query={params.query}
        baseUrl="/admin/dashboard/users"
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </div>
  );
}

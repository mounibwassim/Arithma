"use client";

import { useTransition, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMalaysiaDate } from "lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { Badge } from "ui/badge";
import { Input } from "ui/input";
import { Button, buttonVariants } from "ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Search, Trash2, X } from "lucide-react";

import type { AdminUserListItem } from "app-types/admin";
import { cn } from "lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { TablePagination } from "ui/table-pagination";
import Form from "next/form";
import Link from "next/link";
import { SortableHeader } from "ui/sortable-header";
import { getUserAvatar } from "lib/user/utils";
import { useTranslations } from "next-intl";
import { UserStatusBadge } from "@/components/user/user-detail/user-status-badge";
import { deleteUserAction } from "@/app/api/admin/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "ui/alert-dialog";

const DEFAULT_SORT_BY = "createdAt";
const DEFAULT_SORT_DIRECTION = "desc";

interface UsersTableProps {
  users: AdminUserListItem[];
  currentUserId: string;
  total: number;
  page: number;
  limit: number;
  query?: string;
  baseUrl?: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export function UsersTable({
  users,
  currentUserId,
  total,
  page,
  limit,
  query,
  baseUrl = "/admin/users",
  sortBy = DEFAULT_SORT_BY,
  sortDirection = DEFAULT_SORT_DIRECTION,
}: UsersTableProps) {
  const router = useRouter();

  const [_, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("Admin.Users");
  const shouldAutoFocusRef = useRef<boolean>(false);

  const submitForm = useCallback(() => {
    // Track that we're about to submit and should maintain focus
    formRef.current?.requestSubmit();
  }, []);

  const debouncedSetUrlQuery = useDebounce(submitForm, 300);

  const totalPages = Math.ceil(total / limit);

  const buildUrl = useCallback(
    (
      params: {
        page?: number;
        sortBy?: string;
        sortDirection?: "asc" | "desc";
        query?: string;
      } = {},
    ) => {
      const searchParams = new URLSearchParams();

      // Use provided values or fall back to current values
      const finalPage = params.page ?? page;
      const finalSortBy = params.sortBy ?? sortBy;
      const finalSortDirection = params.sortDirection ?? sortDirection;
      const finalQuery = params.query ?? query;

      // Only add non-default values to keep URLs clean
      if (finalPage && finalPage !== 1) {
        searchParams.set("page", finalPage.toString());
      }
      if (finalSortBy && finalSortBy !== DEFAULT_SORT_BY) {
        searchParams.set("sortBy", finalSortBy);
      }
      if (finalSortDirection && finalSortDirection !== DEFAULT_SORT_DIRECTION) {
        searchParams.set("sortDirection", finalSortDirection);
      }
      if (finalQuery) {
        searchParams.set("query", finalQuery);
      }

      const queryString = searchParams.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    },
    [baseUrl, page, sortBy, sortDirection, query],
  );

  const handleSort = useCallback(
    (field: string) => {
      const newSortDirection =
        sortBy === field && sortDirection === "asc" ? "desc" : "asc";

      router.push(
        buildUrl({
          sortBy: field,
          sortDirection: newSortDirection,
          page: 1,
        }),
      );
    },
    [sortBy, sortDirection, router, buildUrl],
  );

  const [userToDelete, setUserToDelete] = useState<AdminUserListItem | null>(
    null,
  );
  const [confirmInput, setConfirmInput] = useState("");

  const handleDeleteClick = (e: React.MouseEvent, user: AdminUserListItem) => {
    e.stopPropagation();
    setUserToDelete(user);
    setConfirmInput("");
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userToDelete.id);
      const result = await deleteUserAction(null, formData);

      if (result?.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result?.message || "Failed to delete user");
      }
      setUserToDelete(null);
    });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Form action={baseUrl} ref={formRef}>
            {page !== 1 && <input type="hidden" name="page" value={1} />}
            {sortBy !== DEFAULT_SORT_BY && (
              <input type="hidden" name="sortBy" value={sortBy} />
            )}
            {sortDirection !== DEFAULT_SORT_DIRECTION && (
              <input type="hidden" name="sortDirection" value={sortDirection} />
            )}
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              autoFocus={shouldAutoFocusRef.current}
              key={query ?? "empty"}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
              name="query"
              defaultValue={query}
              onFocus={() => {
                shouldAutoFocusRef.current = true;
              }}
              onChange={() => {
                debouncedSetUrlQuery();
              }}
              data-testid="users-search-input"
            />
          </Form>
        </div>
        {(query ||
          sortBy !== DEFAULT_SORT_BY ||
          sortDirection !== DEFAULT_SORT_DIRECTION) && (
          <Link
            href={baseUrl}
            className={cn("shrink-0", buttonVariants({ variant: "outline" }))}
          >
            <X className="h-4 w-4 mr-1" />
            {t("clear")}
          </Link>
        )}
        <div
          className="text-sm text-muted-foreground"
          data-testid="users-total-count"
        >
          {t("totalCount", { count: total })}
        </div>
      </div>

      <div className="rounded-lg border bg-card w-full overflow-x-auto">
        <Table data-testid="users-table" className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHeader
                field="name"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={handleSort}
                data-testid="sort-header-name"
              >
                <span className="px-2">{t("user")}</span>
              </SortableHeader>
              <TableHead className="font-semibold" data-testid="header-status">
                {t("status")}
              </TableHead>
              <SortableHeader
                field="createdAt"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={handleSort}
                data-testid="sort-header-createdAt"
              >
                {t("joined")}
              </SortableHeader>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors"
                  data-testid={`user-row-${user.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3 px-2">
                      <Avatar className="size-8 rounded-full">
                        <AvatarImage src={getUserAvatar(user)} />
                        <AvatarFallback className="text-sm">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.id === currentUserId && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              data-testid="current-user-badge"
                            >
                              {t("youBadge")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <UserStatusBadge
                      user={{ ...user, lastLogin: user.lastLogin || null }}
                      currentUserId={currentUserId}
                      showClickable={false}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMalaysiaDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(e, user)}
                      data-testid={`delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        buildUrl={buildUrl}
      />

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">
              {t("deleteUserTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>{t("deleteUserConfirmation")}</div>
              <div>
                {t.rich("typeToConfirm", {
                  name: userToDelete?.name ?? "",
                  strong: (chunks) => (
                    <span className="font-semibold text-foreground">
                      {chunks}
                    </span>
                  ),
                })}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={userToDelete?.name}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={false}
              onClick={() => {
                setUserToDelete(null);
                setConfirmInput("");
              }}
            >
              {useTranslations("Common")("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={confirmInput !== userToDelete?.name}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              {t("deleteUser")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

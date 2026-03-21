"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminChatHistoryItem } from "@/types/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatHistoryTableProps {
  data: AdminChatHistoryItem[];
  total: number;
  page: number;
  limit: number;
  search?: string;
}

export function ChatHistoryTable({
  data,
  total,
  page,
  limit,
  search,
}: ChatHistoryTableProps) {
  const t = useTranslations("Admin.Analytics");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(search || "");

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (search || "")) {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        params.set("page", "1"); // Reset to page 1 on new search
        router.push(`/admin/dashboard/analytics?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, router, search]);

  const handlePreviousPage = () => {
    if (page > 1) {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", (page - 1).toString());
      router.push(`/admin/dashboard/analytics?${params.toString()}`);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", (page + 1).toString());
      router.push(`/admin/dashboard/analytics?${params.toString()}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/admin/dashboard/analytics");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Chat Records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  t("searchPlaceholder") || "Search by user or email..."
                }
                className="pl-9 pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {total === 0 ? "0 / 0" : `${startItem}-${endItem} of ${total}`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            {searchQuery ? t("noMatchingChats") : t("noChatsFound")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("recentActivity")}</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Thread</TableHead>
                <TableHead>Messages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(
                      new Date(
                        new Date(item.createdAt).getTime() - 8 * 60 * 60 * 1000,
                      ),
                      "dd MMM yyyy, hh:mm a",
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.userEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {item.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t("messageCount", { count: item.messageCount })}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

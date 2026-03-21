import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  getAdminAnalyticsStats,
  getAdminChatHistory,
} from "@/lib/admin/server";
import { AnalyticsStatsCards } from "@/components/admin/analytics-stats";
import { ChatHistoryTable } from "@/components/admin/chat-history-table";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/admin-auth";
import { RefreshButton } from "@/components/admin/refresh-button";

interface AdminAnalyticsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  // Ensure admin access
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const t = await getTranslations("Admin.Analytics");
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || "";
  const limit = 10;

  const [stats, chatHistory] = await Promise.all([
    getAdminAnalyticsStats(),
    getAdminChatHistory(page, limit, search || undefined),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">
            View user usage statistics and chat records
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <AnalyticsStatsCards stats={stats} />
      </Suspense>

      <div className="space-y-4">
        <Suspense fallback={<div>Loading chat history...</div>}>
          <ChatHistoryTable
            data={chatHistory.data}
            total={chatHistory.total}
            page={page}
            limit={limit}
            search={search}
          />
        </Suspense>
      </div>
    </div>
  );
}

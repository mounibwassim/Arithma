"use client";

import { useTranslations } from "next-intl";
import type { AdminAnalyticsStats } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Activity, MessageCircle } from "lucide-react";

interface AnalyticsStatsCardsProps {
  stats: AdminAnalyticsStats;
}

export function AnalyticsStatsCards({ stats }: AnalyticsStatsCardsProps) {
  const t = useTranslations("Admin.Analytics");

  const cards = [
    {
      title: t("totalUsers"),
      value: stats.totalUsers,
      icon: Users,
    },
    {
      title: t("activeUsers"),
      value: stats.activeUsersLast24h,
      icon: Activity,
    },
    {
      title: t("totalChats"),
      value: stats.totalThreads,
      icon: MessageSquare,
    },
    {
      title: t("totalMessages"),
      value: stats.totalMessages,
      icon: MessageCircle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

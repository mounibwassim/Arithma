"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const t = useTranslations("Admin.Analytics");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();

    // Reset loading state after a short delay since router.refresh()
    // doesn't return a promise we can await for completion
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {t("refresh")}
    </Button>
  );
}

"use client";

import type { BasicUser } from "app-types/user";
import { useMemo } from "react";
import { SWRConfig, type SWRConfiguration } from "swr";

export function SWRConfigProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: BasicUser;
}) {
  const config = useMemo<SWRConfiguration>(() => {
    return {
      focusThrottleInterval: 30000,
      dedupingInterval: 2000,
      errorRetryCount: 1,
      fallback: {
        "/api/user/details": user,
      },
    };
  }, [user]);


  return <SWRConfig value={config}>{children}</SWRConfig>;
}

import { SidebarProvider } from "ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";
import { cookies } from "next/headers";

import { getSession } from "lib/auth/server";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";
import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { SWRConfigProvider } from "./swr-config";
import { UserDetailContent } from "@/components/user/user-detail/user-detail-content";
import { UserDetailContentSkeleton } from "@/components/user/user-detail/user-detail-content-skeleton";
import { LoginPromptDialog } from "@/components/auth/login-prompt-dialog";

import { Suspense } from "react";
export const experimental_ppr = true;

export default async function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession();
  // Allow access even without session (guest mode)
  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <SWRConfigProvider user={session?.user}>
        <LoginPromptDialog isAuthenticated={!!session?.user} />
        <AppPopupProvider
          userSettingsComponent={
            <Suspense fallback={<UserDetailContentSkeleton />}>
              <UserDetailContent view="user" />
            </Suspense>
          }
        />
        <AppSidebar user={session?.user} />
        <main className="relative bg-background  w-full flex flex-col h-screen">
          <AppHeader />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </SWRConfigProvider>
    </SidebarProvider>
  );
}

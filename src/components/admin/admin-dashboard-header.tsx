"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Sigma } from "lucide-react";

interface AdminDashboardHeaderProps {
  adminName: string;
  adminRole: "admin" | "super_admin";
}

export function AdminDashboardHeader({
  adminName,
  adminRole,
}: AdminDashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin-auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // Display role label
  const roleLabel = adminRole === "super_admin" ? "Super Admin" : "Teacher";
  const roleColor =
    adminRole === "super_admin"
      ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
      : "border-white/50 text-white bg-white/10";

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sigma className="size-6" />
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            Welcome,{" "}
            <span className="font-medium text-foreground">{adminName}</span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${roleColor}`}
            >
              {roleLabel}
            </span>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

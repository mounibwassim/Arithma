import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/admin-auth";
import { AdminDashboardHeader } from "@/components/admin/admin-dashboard-header";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader adminName={session.name} adminRole={session.role} />
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}

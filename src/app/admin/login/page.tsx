import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/admin-auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Arithma_Admin",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  // If already logged in, redirect to dashboard
  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <AdminLoginForm />
    </div>
  );
}

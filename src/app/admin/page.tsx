import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/admin-auth";

export default async function AdminPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin/dashboard");
  } else {
    redirect("/admin/login");
  }
}

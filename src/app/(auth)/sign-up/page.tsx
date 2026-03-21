import { getAuthConfig } from "auth/config";
import { redirect } from "next/navigation";

export default async function SignUp() {
  const { signUpEnabled } = getAuthConfig();

  if (!signUpEnabled) {
    redirect("/sign-in");
  }

  // Redirect directly to email sign-up form
  redirect("/sign-up/email");
}

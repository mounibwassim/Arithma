"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useObjectState } from "@/hooks/use-object-state";

import { Loader, Sigma, Eye, EyeOff, X } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { GoogleIcon } from "ui/google-icon";
import { useTranslations } from "next-intl";
import type { SocialAuthenticationProvider } from "app-types/authentication";

export default function SignIn({
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
  isFirstUser,
}: {
  emailAndPasswordEnabled: boolean;
  signUpEnabled: boolean;
  socialAuthenticationProviders: SocialAuthenticationProvider[];
  isFirstUser: boolean;
}) {
  const t = useTranslations("Auth.SignIn");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
  });

  const emailAndPasswordSignIn = () => {
    setLoading(true);
    safe(() =>
      authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/",
        },
        {
          onError(ctx) {
            // Replace "Invalid email" with more user-friendly message
            const errorMessage = ctx.error.message || ctx.error.statusText;
            if (errorMessage === "Invalid email") {
              toast.error("Email is required");
            } else {
              toast.error(errorMessage);
            }
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  const handleSocialSignIn = (provider: SocialAuthenticationProvider) => {
    authClient.signIn.social({ provider }).catch((e) => {
      toast.error(e.error);
    });
  };
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
        <CardHeader className="my-4">
          <div className="flex justify-center mb-4">
            <div className="flex aspect-square size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sigma className="size-10" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center my-1">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {emailAndPasswordEnabled && !isFirstUser && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    autoFocus
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData({ email: e.target.value })}
                    type="email"
                    placeholder="math@bot.com"
                    required
                    className="pr-9"
                  />
                  {formData.email && (
                    <button
                      type="button"
                      onClick={() => setFormData({ email: "" })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-muted-foreground hover:text-primary underline-offset-4"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    disabled={loading}
                    value={formData.password}
                    placeholder="********"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        emailAndPasswordSignIn();
                      }
                    }}
                    onChange={(e) => setFormData({ password: e.target.value })}
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={() => setShowPassword(true)}
                    onTouchEnd={() => setShowPassword(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={emailAndPasswordSignIn}
                disabled={loading}
                data-testid="signin-submit-button"
              >
                {loading ? (
                  <Loader className="size-4 animate-spin ml-1" />
                ) : (
                  t("signIn")
                )}
              </Button>
            </div>
          )}
          {socialAuthenticationProviders.length > 0 && (
            <>
              {emailAndPasswordEnabled && (
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-accent" />
                  <span className="px-4 text-sm text-muted-foreground">
                    {t("orContinueWith")}
                  </span>
                  <div className="flex-1 h-px bg-accent" />
                </div>
              )}
              <div className="flex flex-col gap-2 w-full">
                {socialAuthenticationProviders.includes("google") && (
                  <Button
                    variant="outline"
                    onClick={() => handleSocialSignIn("google")}
                    className="flex-1 w-full"
                  >
                    <GoogleIcon className="size-4 fill-foreground" />
                    Google
                  </Button>
                )}
              </div>
            </>
          )}
          {signUpEnabled && (
            <div className="my-8 text-center text-sm text-muted-foreground">
              {t("noAccount")}
              <Link href="/sign-up" className="underline-offset-4 text-primary">
                {t("signUp")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

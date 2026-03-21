"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Loader,
  ChevronLeft,
  X,
  Eye,
  EyeOff,
  Clock,
  Check,
} from "lucide-react";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Step = "email" | "reset";

export default function ResetPassword() {
  const t = useTranslations("Auth.ResetPassword");
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const TOKEN_EXPIRY_SECONDS = 120; // 2 minutes

  // Password validation checklist
  const passwordValidation = useMemo(() => {
    const password = newPassword;
    return {
      hasMinLength: password.length >= 8 && password.length <= 20,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [newPassword]);

  // Start countdown when moving to reset step
  const startCountdown = useCallback(() => {
    setTimeLeft(TOKEN_EXPIRY_SECONDS);
    setIsExpired(false);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        setIsExpired(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendResetEmail = async () => {
    if (!email) {
      toast.error(t("emailRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        console.error("Forget password error:", result.error);
        // Show specific error message from better-auth
        const errorMsg =
          result.error.message || result.error.statusText || t("sendFailed");
        toast.error(errorMsg);
      } else {
        toast.success(t("emailSent"));
        // Stay on the same page and show the verification code form
        setStep("reset");
        startCountdown();
      }
    } catch (error: any) {
      console.error("Forget password exception:", error);
      toast.error(error?.message || t("sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      toast.error(t("passwordRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        toast.error(result.error.message || t("resetFailed"));
      } else {
        toast.success(t("resetSuccess"));
        window.location.href = "/sign-in";
      }
    } catch (_error) {
      toast.error(t("resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Check for token in URL on mount
  if (typeof window !== "undefined" && !token) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      setStep("reset");
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
        <CardHeader className="my-4">
          <CardTitle className="text-2xl text-center my-1">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {step === "email" ? t("description") : t("newPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {step === "email" ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <div className="relative">
                  <Input
                    id="email"
                    autoFocus
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    required
                    className="pr-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendResetEmail();
                      }
                    }}
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleSendResetEmail}
                disabled={loading}
              >
                {loading ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  t("sendCode")
                )}
              </Button>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Clock className="size-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive">
                  {t("codeExpired")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("codeExpiredDescription")}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setStep("email");
                  setToken("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setTimeLeft(null);
                  setIsExpired(false);
                }}
              >
                {t("requestNewCode")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Timer display */}
              {timeLeft !== null && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span
                    className={`font-mono ${timeLeft <= 60 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {t("codeExpiresIn")} {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              {/* Verification code input */}
              <div className="grid gap-2">
                <Label htmlFor="token">{t("codeLabel")}</Label>
                <Input
                  id="token"
                  autoFocus
                  disabled={loading}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  type="text"
                  placeholder={t("codePlaceholder")}
                  required
                />
              </div>
              {/* Password fields - disabled until code is entered */}
              <div className="grid gap-2">
                <Label htmlFor="newPassword">{t("newPasswordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    disabled={loading || !token.trim()}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      !token.trim()
                        ? t("enterCodeFirst")
                        : t("newPasswordPlaceholder")
                    }
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
                    disabled={loading || !token.trim()}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasMinLength ? (
                        <Check className="size-3 text-primary" />
                      ) : (
                        <X className="size-3 text-destructive" />
                      )}
                      <span
                        className={
                          passwordValidation.hasMinLength
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        8-20 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasLetter ? (
                        <Check className="size-3 text-primary" />
                      ) : (
                        <X className="size-3 text-destructive" />
                      )}
                      <span
                        className={
                          passwordValidation.hasLetter
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        At least one letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordValidation.hasNumber ? (
                        <Check className="size-3 text-primary" />
                      ) : (
                        <X className="size-3 text-destructive" />
                      )}
                      <span
                        className={
                          passwordValidation.hasNumber
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        At least one number
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Create a strong password to secure your account
                    </p>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">
                  {t("confirmPasswordLabel")}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    disabled={loading || !token.trim()}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={
                      !token.trim()
                        ? t("enterCodeFirst")
                        : t("confirmPasswordPlaceholder")
                    }
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleResetPassword();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowConfirmPassword(true)}
                    onMouseUp={() => setShowConfirmPassword(false)}
                    onMouseLeave={() => setShowConfirmPassword(false)}
                    onTouchStart={() => setShowConfirmPassword(true)}
                    onTouchEnd={() => setShowConfirmPassword(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading || !token.trim()}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleResetPassword}
                disabled={loading || !token.trim()}
              >
                {loading ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  t("continue")
                )}
              </Button>
            </div>
          )}
          <div className="my-8 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/sign-in")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              {t("backToLogin")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

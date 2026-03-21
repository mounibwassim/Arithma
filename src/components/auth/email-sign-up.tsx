"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { cn } from "lib/utils";
import { ChevronLeft, Loader, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { UserZodSchema } from "app-types/user";
import { existsByEmailAction, signUpAction } from "@/app/api/auth/actions";
import { useTranslations } from "next-intl";

const SIGNUP_SUCCESS_KEY = "signup_success";

export default function EmailSignUp({
  isFirstUser,
}: {
  isFirstUser: boolean;
}) {
  const t = useTranslations();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successRef = useRef(false); // Persists through re-renders
  const [formData, setFormData] = useObjectState({
    email: "",
    name: "",
    password: "",
  });

  // Check sessionStorage on mount to persist success state through remounts
  useEffect(() => {
    const storedSuccess = sessionStorage.getItem(SIGNUP_SUCCESS_KEY);
    if (storedSuccess === "true") {
      setShowSuccess(true);
      successRef.current = true;
      // Redirect after delay
      setTimeout(() => {
        sessionStorage.removeItem(SIGNUP_SUCCESS_KEY);
        window.location.href = "/";
      }, 3000);
    }
  }, []);

  const steps = [
    t("Auth.SignUp.step1"),
    t("Auth.SignUp.step2"),
    t("Auth.SignUp.step3"),
  ];

  // Password validation checklist
  const passwordValidation = useMemo(() => {
    const password = formData.password;
    return {
      hasMinLength: password.length >= 8 && password.length <= 20,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [formData.password]);

  const safeProcessWithLoading = <T,>(fn: () => Promise<T>) => {
    setIsLoading(true);
    return safe(() => fn()).watch(() => setIsLoading(false));
  };

  const backStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const successEmailStep = async () => {
    const { success } = UserZodSchema.shape.email.safeParse(formData.email);
    if (!success) {
      toast.error(t("Auth.SignUp.invalidEmail"));
      return;
    }
    const exists = await safeProcessWithLoading(() =>
      existsByEmailAction(formData.email),
    ).orElse(false);
    if (exists) {
      toast.error(t("Auth.SignUp.emailAlreadyExists"));
      return;
    }
    setStep(2);
  };

  const successNameStep = () => {
    const { success } = UserZodSchema.shape.name.safeParse(formData.name);
    if (!success) {
      toast.error(t("Auth.SignUp.nameRequired"));
      return;
    }
    setStep(3);
  };

  const successPasswordStep = async () => {
    // client side validation
    const { success: passwordSuccess, error: passwordError } =
      UserZodSchema.shape.password.safeParse(formData.password);
    if (!passwordSuccess) {
      const errorMessages = passwordError.issues.map((e) => e.message);
      toast.error(errorMessages.join("\n\n"));
      return;
    }

    // server side validation and admin user creation if first user
    setIsLoading(true);
    safe(() =>
      signUpAction({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      }),
    )
      .ifOk((result) => {
        if (result.success) {
          // Save to sessionStorage FIRST - survives component remount
          sessionStorage.setItem(SIGNUP_SUCCESS_KEY, "true");
          // Then set local state
          successRef.current = true;
          setShowSuccess(true);
          // Delay redirect to show success animation
          setTimeout(() => {
            sessionStorage.removeItem(SIGNUP_SUCCESS_KEY);
            window.location.href = "/";
          }, 3000);
        } else {
          setIsLoading(false);
          toast.error(result.message);
        }
      })
      .ifFail((error) => {
        setIsLoading(false);
        toast.error(error.message || "An error occurred");
      });
  };

  // Success animation screen - check both state and ref to survive re-renders
  if (showSuccess || successRef.current) {
    return (
      <Card className="w-full md:max-w-md bg-background border-none mx-auto gap-0 shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-16">
          {/* Green checkmark circle with animation */}
          <div className="relative flex items-center justify-center">
            {/* Pulse rings - multiple for smoother effect */}
            <div className="absolute w-24 h-24 rounded-full bg-green-500/20 animate-[ping_1.5s_ease-in-out_infinite]" />
            <div className="absolute w-28 h-28 rounded-full bg-green-500/10 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
            {/* Main circle */}
            <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-500 shadow-lg shadow-green-500/30">
              <Check
                className="size-12 text-white animate-in zoom-in duration-300 delay-200"
                strokeWidth={3}
              />
            </div>
          </div>

          {/* Thank You text with fade-in animation */}
          <h2 className="text-2xl font-semibold mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <span className="text-foreground">ACCOUNT </span>
            <span className="text-muted-foreground">CREATED</span>
          </h2>

          <p className="text-muted-foreground text-sm mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            {t("Auth.SignUp.accountCreated")}
          </p>

          {/* Redirecting indicator */}
          <p className="text-muted-foreground/60 text-xs mt-6 animate-in fade-in duration-1000 delay-700">
            Auto Logging in...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full md:max-w-md bg-background border-none mx-auto gap-0 shadow-none animate-in fade-in duration-1000">
      <CardHeader>
        <CardTitle className="text-2xl text-center ">
          {isFirstUser ? t("Auth.SignUp.titleAdmin") : t("Auth.SignUp.title")}
        </CardTitle>
        <CardDescription className="py-8">
          <div className="flex items-center justify-center w-full">
            {[1, 2, 3].map((stepNumber, index) => (
              <div key={stepNumber} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      stepNumber < step
                        ? "bg-foreground text-background" // Completed
                        : stepNumber === step
                          ? "bg-foreground text-background" // Current
                          : "bg-muted-foreground/30 text-muted-foreground", // Future
                    )}
                  >
                    {stepNumber < step ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : stepNumber === step ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 font-medium uppercase tracking-wide",
                      stepNumber <= step
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Step {stepNumber}
                  </span>
                </div>
                {/* Connector Line */}
                {index < 2 && (
                  <div
                    className={cn(
                      "w-20 h-0.5 mx-2 mb-6 transition-all duration-300",
                      stepNumber < step
                        ? "bg-foreground" // Completed line
                        : "bg-muted-foreground/30", // Incomplete line
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {step === 1 && (
            <div className={cn("flex flex-col gap-2")}>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="E.g. math@bot.com"
                  disabled={isLoading}
                  autoFocus
                  value={formData.email}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successEmailStep();
                    }
                  }}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  required
                  className="pr-9"
                />
                {formData.email && (
                  <button
                    type="button"
                    onClick={() => setFormData({ email: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className={cn("flex flex-col gap-2")}>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  placeholder="E.g. Math Bot"
                  disabled={isLoading}
                  autoFocus
                  value={formData.name}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successNameStep();
                    }
                  }}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  className="pr-9"
                />
                {formData.name && (
                  <button
                    type="button"
                    onClick={() => setFormData({ name: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className={cn("flex flex-col gap-2")}>
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  disabled={isLoading}
                  autoFocus
                  value={formData.password}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successPasswordStep();
                    }
                  }}
                  onChange={(e) => setFormData({ password: e.target.value })}
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
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {formData.password && (
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
                </div>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs mb-6">
            {steps[step - 1]}
          </p>
          <div className="flex flex-row-reverse gap-2">
            <Button
              tabIndex={0}
              disabled={isLoading}
              className="w-1/2"
              onClick={() => {
                if (step === 1) successEmailStep();
                if (step === 2) successNameStep();
                if (step === 3) successPasswordStep();
              }}
            >
              {step === 3 ? t("Auth.SignUp.createAccount") : t("Common.next")}
              {isLoading && <Loader className="size-4 ml-2" />}
            </Button>
            <Button
              tabIndex={step === 1 ? -1 : 0}
              disabled={isLoading || step === 1}
              className={cn(step === 1 && "invisible", "w-1/2")}
              variant="ghost"
              onClick={backStep}
            >
              <ChevronLeft className="size-4" />
              {t("Common.back")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

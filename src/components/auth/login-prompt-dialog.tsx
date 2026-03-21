"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { LogIn, UserCircle } from "lucide-react";

interface LoginPromptDialogProps {
  isAuthenticated: boolean;
}

export function LoginPromptDialog({ isAuthenticated }: LoginPromptDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("Auth.LoginPrompt");

  useEffect(() => {
    // Don't show if user is already authenticated
    if (isAuthenticated) {
      return;
    }

    // Show dialog after a short delay for better UX
    const timer = setTimeout(() => {
      setOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleSignIn = () => {
    setOpen(false);
    router.push("/sign-in");
  };

  const handleContinueAsGuest = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-base pt-2 text-center">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={handleSignIn}
            className="w-full h-12 text-base"
            size="lg"
          >
            <LogIn className="size-5 mr-2" />
            {t("signIn")}
          </Button>

          <Button
            onClick={handleContinueAsGuest}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            <UserCircle className="size-5 mr-2" />
            {t("continueAsGuest")}
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <p className="text-xs text-muted-foreground text-center">
            {t("guestLimitations")}
            <span className="font-bold">{t("guestLimitationsSignIn")}</span>
            {t("guestLimitationsSuffix")}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

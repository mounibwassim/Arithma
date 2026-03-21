import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "ui/alert-dialog";
import { AlertDialogHeader } from "ui/alert-dialog";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "./user-submit-button";
import Form from "next/form";
import { updateUserPasswordAction } from "@/app/api/user/actions";
import {
  type UpdateUserPasswordActionState,
  UpdateUserPasswordError,
} from "@/app/api/user/validations";
import {
  passwordRegexPattern,
  passwordRequirementsText,
} from "lib/validations/password";

import { Input } from "ui/input";
import { useProfileTranslations } from "@/hooks/use-profile-translations";
import { useTranslations } from "next-intl";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export function UpdateUserPasswordDialog({
  children,
  userId,
  currentUserId,
  onReset,
  disabled,
  view,
}: {
  children: React.ReactNode;
  userId: string;
  currentUserId: string;
  onReset?: () => void;
  disabled?: boolean;
  view?: "admin" | "user";
}) {
  const { t } = useProfileTranslations(view);
  const tCommon = useTranslations("Common");
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [validationErrors, setValidationErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isCurrentUser = userId === currentUserId;

  const validateForm = (formData: FormData): boolean => {
    const errors: typeof validationErrors = {};

    if (isCurrentUser && !formData.get("currentPassword")) {
      errors.currentPassword = "Please fill out this field.";
    }
    if (!formData.get("newPassword")) {
      errors.newPassword = "Please fill out this field.";
    }
    if (!formData.get("confirmPassword")) {
      errors.confirmPassword = "Please fill out this field.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [_, resetPasswordFormAction, isPending] = useActionState<
    UpdateUserPasswordActionState,
    FormData
  >(async (_prevState, formData) => {
    // Clear validation errors
    setValidationErrors({});

    // Validate form
    if (!validateForm(formData)) {
      return {
        success: false,
        message: "Please fill out all required fields.",
      };
    }

    const result = await updateUserPasswordAction({}, formData);
    setErrorMessage(null);
    if (result?.success) {
      setShowResetPasswordDialog(false);
      onReset?.();
      toast.success(t("passwordUpdatedSuccessfully"));
    } else {
      const errorMsg = result?.message || t("failedToUpdatePassword");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
    return result;
  }, {});
  return (
    <AlertDialog
      open={showResetPasswordDialog}
      onOpenChange={(open) => {
        setShowResetPasswordDialog(open);
        if (!open) {
          setErrorMessage(null);
          setValidationErrors({});
        }
      }}
    >
      <AlertDialogTrigger asChild disabled={disabled}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("updatePasswordTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("changeUserPassword")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form action={resetPasswordFormAction}>
          <input type="hidden" name="userId" value={userId} />
          <input
            type="hidden"
            name="isCurrentUser"
            value={isCurrentUser ? "true" : "false"}
          />
          <div className="space-y-4 my-4">
            {isCurrentUser && (
              <div className="space-y-2">
                <Input
                  type="password"
                  name="currentPassword"
                  data-testid="current-password-input"
                  placeholder={t("currentPassword")}
                  onChange={() =>
                    setValidationErrors((prev) => ({
                      ...prev,
                      currentPassword: undefined,
                    }))
                  }
                  className={
                    validationErrors.currentPassword ? "border-orange-500" : ""
                  }
                />
                {validationErrors.currentPassword && (
                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-md text-sm">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{validationErrors.currentPassword}</span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  data-testid="new-password-input"
                  placeholder={t("newPasswordPlaceholder")}
                  pattern={passwordRegexPattern}
                  minLength={8}
                  maxLength={20}
                  onFocus={() => setErrorMessage(null)}
                  onChange={() =>
                    setValidationErrors((prev) => ({
                      ...prev,
                      newPassword: undefined,
                    }))
                  }
                  className={`pr-10 ${
                    errorMessage || validationErrors.newPassword
                      ? "border-orange-500"
                      : ""
                  }`}
                  title={passwordRequirementsText}
                />
                <button
                  type="button"
                  onMouseDown={() => setShowNewPassword(true)}
                  onMouseUp={() => setShowNewPassword(false)}
                  onMouseLeave={() => setShowNewPassword(false)}
                  onTouchStart={() => setShowNewPassword(true)}
                  onTouchEnd={() => setShowNewPassword(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {validationErrors.newPassword && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-md text-sm">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{validationErrors.newPassword}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  data-testid="confirm-password-input"
                  placeholder={t("confirmPassword")}
                  pattern={passwordRegexPattern}
                  minLength={8}
                  maxLength={20}
                  onFocus={() => setErrorMessage(null)}
                  onChange={() =>
                    setValidationErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }))
                  }
                  className={`pr-10 ${
                    errorMessage ===
                      UpdateUserPasswordError.PASSWORD_MISMATCH ||
                    validationErrors.confirmPassword
                      ? "border-orange-500"
                      : ""
                  }`}
                  title={passwordRequirementsText}
                />
                <button
                  type="button"
                  onMouseDown={() => setShowConfirmPassword(true)}
                  onMouseUp={() => setShowConfirmPassword(false)}
                  onMouseLeave={() => setShowConfirmPassword(false)}
                  onTouchStart={() => setShowConfirmPassword(true)}
                  onTouchEnd={() => setShowConfirmPassword(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-md text-sm">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <span>{validationErrors.confirmPassword}</span>
                </div>
              )}
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowResetPasswordDialog(false)}
              disabled={isPending}
              type="button"
            >
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <SubmitButton
                variant="default"
                data-testid="update-password-submit-button"
              >
                {t("updatePasswordButton")}
              </SubmitButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

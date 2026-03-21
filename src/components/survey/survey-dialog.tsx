"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";
import { Label } from "ui/label";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface SurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SurveyDialog({ open, onOpenChange }: SurveyDialogProps) {
  const t = useTranslations("Survey");
  const [rating, setRating] = useState<"like" | "dislike" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error(t("ratingRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit survey");
      }

      toast.success(t("submitSuccess"));
      setRating(null);
      setFeedback("");
      onOpenChange(false);
    } catch (error) {
      console.error("Survey submission error:", error);
      toast.error(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      onOpenChange(open);
      if (!open) {
        setRating(null);
        setFeedback("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Question */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("ratingQuestion")}</Label>
            <RadioGroup
              value={rating || ""}
              onValueChange={(value) => setRating(value as "like" | "dislike")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="like" id="like" />
                <Label
                  htmlFor="like"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ThumbsUp className="size-4 text-green-500" />
                  {t("like")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dislike" id="dislike" />
                <Label
                  htmlFor="dislike"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ThumbsDown className="size-4 text-red-500" />
                  {t("dislike")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Feedback Question */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-sm font-medium">
              {t("feedbackQuestion")}
            </Label>
            <Textarea
              id="feedback"
              placeholder={t("feedbackPlaceholder")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !rating}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

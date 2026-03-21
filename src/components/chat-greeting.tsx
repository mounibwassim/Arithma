"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { FlipWords } from "ui/flip-words";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import type { BasicUser } from "app-types/user";
import { fetcher } from "lib/utils";

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export const ChatGreeting = () => {
  const { data: user } = useSWR<BasicUser>("/api/user/details", fetcher);
  const t = useTranslations("Chat.Greeting");

  const word = useMemo(() => {
    // Show "Guest" if user is not authenticated (no id)
    const name = user?.id ? user.name : "Guest.";
    const words = [
      t(getGreetingByTime(), { name }),
      t("niceToSeeYouAgain", { name }),
      t("whatAreYouWorkingOnToday", { name }),
      t("letMeKnowWhenYoureReadyToBegin"),
      t("whatAreYourThoughtsToday"),
      t("whereWouldYouLikeToStart"),
      t("whatAreYouThinking", { name }),
      t("hello", { name }),
    ];
    return words[Math.floor(Math.random() * words.length)];
  }, [user?.name, user?.id]);

  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto my-4 h-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center">
        <h1 className="text-2xl md:text-3xl">
          {word ? <FlipWords words={[word]} className="text-primary" /> : ""}
        </h1>
      </div>
    </motion.div>
  );
};

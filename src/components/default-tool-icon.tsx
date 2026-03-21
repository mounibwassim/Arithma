"use client";
import { DefaultToolName } from "lib/ai/tools";
import { cn } from "lib/utils";
import { BookOpen } from "lucide-react";
import { useMemo } from "react";

export function DefaultToolIcon({
  name,
  className,
}: { name: DefaultToolName; className?: string }) {
  return useMemo(() => {
    if (name === DefaultToolName.AcademicResourcesSearch) {
      return <BookOpen className={cn("size-3.5 text-blue-500", className)} />;
    }
    return <BookOpen className={cn("size-3.5", className)} />;
  }, [name]);
}

"use client";

import { appStore } from "@/app/store";
import { cn } from "lib/utils";

import {
  Check,
  ClipboardCheck,
  Infinity,
  PenOff,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "ui/button";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";

import { useShallow } from "zustand/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

export const ToolModeDropdown = ({ disabled }: { disabled?: boolean }) => {
  const t = useTranslations("Chat.Tool");
  const [toolChoice, appStoreMutate] = appStore(
    useShallow((state) => [state.toolChoice, state.mutate]),
  );
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"ghost"}
                size={"sm"}
                className={cn(
                  "rounded-full p-2! data-[state=open]:bg-input! hover:bg-input!",
                  toolChoice === "none" && "text-muted-foreground",
                  open && "bg-input!",
                )}
                onClick={() => setOpen(true)}
              >
                <Settings2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2" side="top">
              {t("selectToolMode")}
            </TooltipContent>
          </Tooltip>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2">
          {t("selectToolMode")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => appStoreMutate({ toolChoice: "auto" })}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <Infinity />
                <span className="font-bold">Auto</span>
                {toolChoice === "auto" && <Check className="ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("autoToolModeDescription")}
              </p>
            </div>
          </DropdownMenuItem>
          <div className="px-2 py-1">
            <DropdownMenuSeparator />
          </div>
          <DropdownMenuItem
            onClick={() => appStoreMutate({ toolChoice: "manual" })}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <ClipboardCheck />
                <span className="font-bold">Manual</span>
                {toolChoice === "manual" && <Check className="ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("manualToolModeDescription")}
              </p>
            </div>
          </DropdownMenuItem>
          <div className="px-2 py-1">
            <DropdownMenuSeparator />
          </div>
          <DropdownMenuItem
            onClick={() => appStoreMutate({ toolChoice: "none" })}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <PenOff />
                <span className="font-bold">None</span>
                <span className="text-xs text-muted-foreground ml-4">
                  @mention only
                </span>
                {toolChoice === "none" && <Check className="ml-auto" />}
              </div>

              <p className="text-xs text-muted-foreground">
                {t("noneToolModeDescription")}
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

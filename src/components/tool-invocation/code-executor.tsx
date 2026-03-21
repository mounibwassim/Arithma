import { useCopy } from "@/hooks/use-copy";
import type { ToolUIPart } from "ai";

import { callCodeRunWorker } from "lib/code-runner/call-worker";

import type {
  CodeRunnerResult,
  LogEntry,
} from "lib/code-runner/code-runner.interface";
import { cn, isString, toAny } from "lib/utils";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRight,
  CopyIcon,
  Loader,
  Sigma,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CodeBlock } from "ui/CodeBlock";
import { Skeleton } from "ui/skeleton";
import { TextShimmer } from "ui/text-shimmer";

export const CodeExecutor = memo(function CodeExecutor({
  part,
  onResult,
  type,
}: {
  part: ToolUIPart;
  onResult?: (result?: any) => void;
  type: "javascript" | "python";
}) {
  const isRun = useRef(false);

  const { copy, copied } = useCopy();
  const [isExecuting, _setIsExecuting] = useState(false);

  const lastStartedAt = useRef<number>(Date.now());

  const [realtimeLogs, setRealtimeLogs] = useState<
    (CodeRunnerResult["logs"][number] & { time: number })[]
  >([]);

  const codeResultContainerRef = useRef<HTMLDivElement>(null);

  const runCode = useCallback(
    async (code: string, type: "javascript" | "python") => {
      lastStartedAt.current = Date.now();
      const result = await callCodeRunWorker(type, {
        code,
        timeout: 30000,
        onLog: (log) => {
          setRealtimeLogs((prev) => [...prev, { ...log, time: Date.now() }]);
        },
      });
      return result;
    },
    [],
  );

  const menualToolCall = useCallback(
    async (code: string) => {
      const result = await runCode(code, type);
      const logstring = JSON.stringify(result.logs);
      onResult?.({
        ...toAny({
          ...result,
          logs:
            logstring.length > 5000
              ? [
                  {
                    type: "info",
                    args: [
                      {
                        type: "data",
                        value:
                          "Log output exceeded storage limit (10KB). Full output was displayed to user but truncated for server storage.",
                      },
                    ],
                  },
                ]
              : result.logs,
        }),
        guide:
          "Execution finished. Provide: 1) Main results/outputs 2) Key insights or findings 3) Error explanations if any. Don't repeat code or raw logs - interpret and summarize for the user.",
      });
    },
    [onResult],
  );
  const isRunning = useMemo(() => {
    return isExecuting || part.state.startsWith("input");
  }, [isExecuting, part.state]);

  const scrollToCode = useCallback(() => {
    codeResultContainerRef.current?.scrollTo({
      top: codeResultContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const result = useMemo(() => {
    if (part.state.startsWith("input")) return null;
    return part.output as CodeRunnerResult;
  }, [part]);

  const logs = useMemo(() => {
    const error = result?.error;
    let logs: (LogEntry & { time?: number })[] = realtimeLogs.length
      ? realtimeLogs
      : (result?.logs ?? []);

    if (error) {
      logs.push({
        type: "error",
        args: [{ type: "data", value: error }],
        time: lastStartedAt.current,
      });
    }

    // Sort logs to put correct answers first
    // Detects various patterns that indicate correct answers
    logs = [...logs].sort((a, b) => {
      const aText = a.args
        .map((arg) => String(arg.value || ""))
        .join(" ")
        .toLowerCase();
      const bText = b.args
        .map((arg) => String(arg.value || ""))
        .join(" ")
        .toLowerCase();

      // Patterns that indicate a CORRECT answer
      const correctPatterns = [
        /\bcorrect\b/,
        /\btrue\b/,
        /\byes\b/,
        /\bright\b/,
        /\bvalid\b/,
        /\bpassed\b/,
        /\bsuccess/,
        /is equal to(?! false)/,
        /= true/,
        /✓|✔|☑/,
      ];

      // Patterns that indicate an INCORRECT answer (should NOT be prioritized)
      const incorrectPatterns = [
        /\bincorrect\b/,
        /\bfalse\b/,
        /\bno\b/,
        /\bwrong\b/,
        /\binvalid\b/,
        /\bfailed\b/,
        /\berror\b/,
        /is not equal/,
        /not equal to/,
        /= false/,
        /✗|✘|☒/,
      ];

      const aIsCorrect =
        correctPatterns.some((p) => p.test(aText)) &&
        !incorrectPatterns.some((p) => p.test(aText));
      const bIsCorrect =
        correctPatterns.some((p) => p.test(bText)) &&
        !incorrectPatterns.some((p) => p.test(bText));

      if (aIsCorrect && !bIsCorrect) return -1;
      if (!aIsCorrect && bIsCorrect) return 1;
      return 0;
    });

    return logs.map((log, i) => {
      return (
        <div
          key={i}
          className={cn(
            "block text-justify",
            i !== 0 && "md:pl-[85px]",
            log.type === "error" && "text-destructive",
            log.type === "warn" && "text-yellow-500",
          )}
        >
          {i === 0 && (
            <>
              <span className="hidden md:inline mr-2 font-bold">ANSWER</span>
              <ChevronRight className="size-3 inline-block mr-1" />
            </>
          )}
          {log.args.map((arg, j) => {
            if (arg.type === "image") {
              /* eslint-disable-next-line @next/next/no-img-element */
              return (
                <img
                  key={j}
                  src={arg.value}
                  alt="Code output"
                  className="inline"
                />
              );
            }
            return (
              <span key={j}>
                {isString(arg?.value)
                  ? arg.value.toString()
                  : JSON.stringify(arg.value ?? arg)}
                {j < log.args.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      );
    });
  }, [part, realtimeLogs]);

  const header = useMemo(() => {
    if (isRunning)
      return (
        <>
          <Loader className="size-3 animate-spin text-muted-foreground" />
          <TextShimmer className="text-xs">Generating Code...</TextShimmer>
        </>
      );
    return (
      <>
        {result?.error ? (
          <>
            <AlertTriangleIcon className="size-3 text-destructive" />
            <span className="text-destructive text-xs">ERROR</span>
          </>
        ) : (
          <div
            className={cn(
              "text-[7px] rounded-xs w-4 h-4 p-0.5 flex items-end justify-end font-bold",
              type === "python" && "bg-[#3776ab] text-[#ffd43b]",
              type === "javascript" && "bg-[#f7df1e] text-black",
            )}
          >
            {type === "javascript" ? "JS" : type === "python" ? "PY" : ">_"}
          </div>
        )}
      </>
    );
  }, [part.state, result, isRunning]);

  const fallback = useMemo(() => {
    return <CodeFallback />;
  }, []);

  const logContainer = useMemo(() => {
    if (!logs.length) return null;
    return (
      <div className="p-4 text-sm text-foreground border-t">
        <div className="flex items-center gap-1 mb-2">
          {isRunning ? (
            <Loader className="size-2 animate-spin" />
          ) : (
            <div className="w-1 h-1 mr-1 ring ring-border rounded-full" />
          )}
          math-bot_result
          <Sigma className="size-3" />
        </div>
        <div className="bg-zinc-800 rounded-lg px-4 py-3 text-white">
          {logs}
          {isRunning && <span className="ml-1 animate-caret-blink">|</span>}
        </div>
      </div>
    );
  }, [logs, isRunning]);

  useEffect(() => {
    if (
      onResult &&
      part.input &&
      part.state === "input-available" &&
      !isRun.current
    ) {
      isRun.current = true;
      menualToolCall(toAny(part.input)?.code);
    }
  }, [part.state, !!onResult]);

  useEffect(() => {
    if (isRunning) {
      const closeKey = setInterval(scrollToCode, 300);
      return () => clearInterval(closeKey);
    }if (part.state.startsWith("output") && isRun.current) {
      scrollToCode();
    }
  }, [isRunning]);

  return (
    <div className="flex flex-col">
      <div className="px-6 py-3">
        <div className="border overflow-x-hidden relative rounded-lg shadow fade-in animate-in duration-500">
          <div className="py-2.5 bg-border px-4 flex items-center gap-1.5 z-10 min-h-[37px]">
            {header}
            <div className="flex-1" />

            {part.state.startsWith("output") && (
              <div
                className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
                onClick={() => copy(toAny(part.input)?.code ?? "")}
              >
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
                Copy
              </div>
            )}
          </div>
          <div className="relative">
            <div className="absolute pointer-events-none top-0 left-0 w-full h-1/6 bg-gradient-to-b from-background to-transparent z-10" />
            <div className="absolute pointer-events-none bottom-0 left-0 w-full h-1/6 bg-gradient-to-t from-background to-transparent z-10" />
            <div className="absolute pointer-events-none top-0 left-0 w-1/6 h-full bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute pointer-events-none top-0 right-0 w-1/6 h-full bg-gradient-to-l from-background to-transparent z-10" />
            <div
              className="min-h-14 p-6 text-xs overflow-y-auto max-h-[40vh]"
              ref={codeResultContainerRef}
            >
              <CodeBlock
                className="p-4 text-sm overflow-x-auto"
                code={toAny(part.input)?.code}
                lang={type}
                fallback={fallback}
              />
            </div>
          </div>
          {logContainer}
        </div>
      </div>
    </div>
  );
});

function CodeFallback() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-1/6" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

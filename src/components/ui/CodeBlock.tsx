"use client";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useTheme } from "next-themes";
import { Fragment, useLayoutEffect, useState } from "react";
import type { JSX, ReactNode } from "react";
import { codeToHast } from "shiki/bundle/web";
import { safe } from "ts-safe";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "lib/utils";
import { useCopy } from "@/hooks/use-copy";
import { CheckIcon, CopyIcon } from "lucide-react";

const getLanguageIcon = (lang: string) => {
  const iconClass = "size-4";

  switch (lang.toLowerCase()) {
    case "python":
    case "py":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 256 255"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
        >
          <defs>
            <linearGradient
              x1="12.959%"
              y1="12.039%"
              x2="79.639%"
              y2="78.201%"
              id="python-a"
            >
              <stop stopColor="#387EB8" offset="0%" />
              <stop stopColor="#366994" offset="100%" />
            </linearGradient>
            <linearGradient
              x1="19.128%"
              y1="20.579%"
              x2="90.742%"
              y2="88.429%"
              id="python-b"
            >
              <stop stopColor="#FFE052" offset="0%" />
              <stop stopColor="#FFC331" offset="100%" />
            </linearGradient>
          </defs>
          <path
            d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"
            fill="url(#python-a)"
          />
          <path
            d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"
            fill="url(#python-b)"
          />
        </svg>
      );
    case "javascript":
    case "js":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 256 256"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
        >
          <path d="M0 0h256v256H0V0z" fill="#F7DF1E" />
          <path d="M67.312 213.932l19.59-11.856c3.78 6.701 7.218 12.371 15.465 12.371 7.905 0 12.89-3.092 12.89-15.12v-81.798h24.057v82.138c0 24.917-14.606 36.259-35.916 36.259-19.245 0-30.416-9.967-36.087-21.996M152.381 211.354l19.588-11.341c5.157 8.421 11.859 14.607 23.715 14.607 9.969 0 16.325-4.984 16.325-11.858 0-8.248-6.53-11.17-17.528-15.98l-6.013-2.58c-17.357-7.387-28.87-16.667-28.87-36.257 0-18.044 13.747-31.792 35.228-31.792 15.294 0 26.292 5.328 34.196 19.247L210.29 147.43c-4.125-7.389-8.591-10.31-15.465-10.31-7.046 0-11.514 4.468-11.514 10.31 0 7.217 4.468 10.14 14.778 14.608l6.014 2.577c20.45 8.765 31.963 17.7 31.963 37.804 0 21.654-17.012 33.51-39.867 33.51-22.339 0-36.774-10.654-43.819-24.574" />
        </svg>
      );
    case "typescript":
    case "ts":
      return (
        <svg
          className={iconClass}
          viewBox="0 0 256 256"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid"
        >
          <path d="M0 128v128h256V0H0z" fill="#3178C6" />
          <path
            d="M56.611 128.849l-.081 10.483h33.32v94.68h23.568v-94.68h33.321v-10.28c0-5.69-.122-10.444-.284-10.566-.122-.162-20.399-.244-44.983-.203l-44.739.122-.122 10.444zM206.567 118.108c6.501 1.626 11.459 4.51 16.01 9.224 2.357 2.52 5.851 7.111 6.136 8.208.08.325-11.053 7.802-17.798 11.988-.244.162-1.22-.894-2.317-2.52-3.291-4.795-6.745-6.867-12.028-7.233-7.76-.528-12.759 3.535-12.718 10.321 0 1.992.284 3.17 1.097 4.795 1.707 3.536 4.876 5.649 14.832 9.956 18.326 7.883 26.168 13.084 31.045 20.48 5.445 8.249 6.664 21.415 2.966 31.208-4.063 10.646-14.14 17.879-28.323 20.276-4.388.772-14.79.65-19.504-.203-10.28-1.828-20.033-6.908-26.047-13.572-2.357-2.6-6.949-9.387-6.664-9.874.122-.163 1.178-.813 2.356-1.504 1.138-.65 5.446-3.129 9.509-5.485l7.355-4.267 1.544 2.276c2.154 3.29 6.867 7.801 9.712 9.305 8.167 4.307 19.383 3.698 24.909-1.26 2.357-2.153 3.332-4.388 3.332-7.68 0-2.966-.366-4.266-1.91-6.501-1.99-2.845-6.054-5.242-17.595-10.24-13.206-5.69-18.895-9.224-24.096-14.832-3.007-3.25-5.852-8.452-7.03-12.8-.975-3.617-1.22-12.678-.447-16.335 2.723-12.76 12.353-21.659 26.25-24.3 4.51-.853 14.994-.528 19.424.569z"
            fill="#FFF"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V9L14 3H8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 3V9H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 12L8 14L10 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 12L16 14L14 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

export function CodeBlock({
  code,
  lang,
  fallback,
  className,
  showLineNumbers = true,
  showHeader = true,
}: {
  code?: string;
  lang: string;
  fallback?: ReactNode;
  className?: string;
  showLineNumbers?: boolean;
  showHeader?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const { copied, copy } = useCopy();

  const [component, setComponent] = useState<JSX.Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;

    const currentTheme = resolvedTheme || "dark";

    safe()
      .map(async () => {
        const out = await codeToHast(code || "", {
          lang: lang,
          theme: currentTheme === "dark" ? "dark-plus" : "github-light",
        });
        return toJsxRuntime(out, {
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: (props) => (
              <pre
                {...props}
                lang={lang}
                style={undefined}
                className={cn(props.className, className)}
              >
                <div
                  className={cn(showLineNumbers && "pl-12 relative")}
                  style={{
                    filter:
                      currentTheme === "dark" ? "brightness(1.3)" : undefined,
                  }}
                >
                  {showLineNumbers && (
                    <div className="absolute left-0 top-0 w-6 flex flex-col select-none text-right text-muted-foreground">
                      {code?.split("\n").map((_, index) => (
                        <span key={index}>{index + 1}</span>
                      ))}
                    </div>
                  )}
                  {props.children}
                </div>
              </pre>
            ),
          },
        }) as JSX.Element;
      })
      .ifOk(setComponent);
  }, [mounted, resolvedTheme, lang, code]);

  if (!code) return fallback;

  const codeContent = component ?? fallback;

  if (!showHeader) {
    return codeContent;
  }

  return (
    <div className="text-sm flex bg-secondary/40 shadow border flex-col rounded relative my-4 overflow-hidden">
      <div className="p-1.5 border-b z-20 bg-secondary">
        <div className="w-full flex z-20 py-0.5 px-4 items-center">
          <div className="flex items-center gap-2">
            {getLanguageIcon(lang)}
            <span className="text-sm text-muted-foreground">{lang}</span>
          </div>
          <div
            className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground px-2 py-1 transition-all rounded-sm cursor-pointer hover:bg-input hover:text-foreground font-semibold"
            onClick={() => {
              copy(code || "");
            }}
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            Copy
          </div>
        </div>
      </div>
      <div className="relative overflow-x-auto px-6 pb-6 pt-4">
        {codeContent}
      </div>
    </div>
  );
}

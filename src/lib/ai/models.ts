import "server-only";

import { google } from "@ai-sdk/google";

import type { LanguageModelV2 } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import type { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
} from "./file-support";



const staticModels = {
  google: {
    "gemini-2.5-flash": google("gemini-2.5-flash"),
  },
};

const staticUnsupportedModels = new Set<LanguageModel>([]);

const staticSupportImageInputModels = {
  ...staticModels.google,
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

// Google models
registerFileSupport(
  staticModels.google["gemini-2.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);


const defaultProviders = [
  {
    provider: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "", // Use environment variable to avoid GH push protection
    models: [
      {
        apiName: "llama-3.3-70b-versatile",
        uiName: "Llama 3.3 70B (Groq)",
        supportsTools: true,
      },
      {
        apiName: "llama-3.1-8b-instant",
        uiName: "Llama 3.1 8B (Groq)",
        supportsTools: true,
      },
    ],
  },
  {
    provider: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    apiKey: "ollama",
    models: [
      {
        apiName: "llama3.2",
        uiName: "Llama 3.2 (Ollama)",
        supportsTools: true,
      },
      {
        apiName: "llama3",
        uiName: "Llama 3 (Ollama)",
        supportsTools: false,
      },
    ],
  },
];

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA || JSON.stringify(defaultProviders),
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModelV2) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

const isVercel = process.env.VERCEL === "1";

const googleFallback = staticModels.google["gemini-2.5-flash"];

export const fallbackModel = (() => {
  const models = allModels as Record<string, Record<string, LanguageModel>>;

  // 1. Try explicit default model from env (handles both apiName and uiName)
  const envDefaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL;
  if (envDefaultModel) {
    for (const provider of Object.values(models)) {
      if (provider[envDefaultModel]) return provider[envDefaultModel];
      // Search by UI name if it includes the default model name
      for (const [uiName, model] of Object.entries(provider)) {
        if (uiName.includes(envDefaultModel)) return model;
      }
    }
  }

  // 2. Environment-aware defaults
  if (isVercel) {
    return (
      models.Groq?.["Llama 3.3 70B (Groq)"] ||
      models.Groq?.["Llama 3.1 8B (Groq)"] ||
      googleFallback
    );
  }

  // Local fallback
  return (
    models.Ollama?.["Llama 3.2 (Ollama)"] ||
    models.Ollama?.["Llama 3 (Ollama)"] ||
    googleFallback
  );
})();

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
      isImageInputUnsupported: isImageInputUnsupportedModel(model),
      supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
    })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  let key: string | undefined;
  switch (provider) {
    case "google":
      key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    default:
      return true; // assume the provider has an API key or is dynamic
  }
  return !!key && key !== "****";
}

import { smoothStream, streamText } from "ai";

import { customModelProvider } from "lib/ai/models";
import { CREATE_THREAD_TITLE_PROMPT } from "lib/ai/prompts";
import globalLogger from "logger";
import type { ChatModel } from "app-types/chat";
import { chatRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { handleError } from "../shared.chat";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", "Title API: "),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const {
      chatModel,
      message = "hello",
      threadId,
    } = json as {
      chatModel?: ChatModel;
      message: string;
      threadId: string;
    };

    const session = await getSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    logger.info(
      `chatModel: ${chatModel?.provider}/${chatModel?.model}, threadId: ${threadId}`,
    );

    // Fallback title generation if model fails or to save quota
    const getFallbackTitle = (text: string) => {
      const words = text.split(/\s+/).slice(0, 8).join(" ");
      return words.length < text.length ? `${words}...` : words;
    };

    const model = customModelProvider.getModel(chatModel);
    
    // Check if we should even call the model (e.g., if message is too short)
    if (message.length < 10) {
      const title = getFallbackTitle(message);
      chatRepository.upsertThread({
        id: threadId,
        title,
        userId: session.user.id,
      }).catch(err => logger.error(err));
      return new Response(title);
    }

    const result = streamText({
      model,
      system: CREATE_THREAD_TITLE_PROMPT,
      experimental_transform: smoothStream({ chunking: "word" }),
      prompt: message,
      maxRetries: 1, // Minimize retries for non-essential title generation
      abortSignal: request.signal,
      onFinish: (ctx) => {
        chatRepository
          .upsertThread({
            id: threadId,
            title: ctx.text || getFallbackTitle(message),
            userId: session.user.id,
          })
          .catch((err) => logger.error(err));
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return new Response(handleError(err), { status: 500 });
  }
}

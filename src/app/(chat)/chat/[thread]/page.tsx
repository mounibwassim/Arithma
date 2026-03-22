import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import Arithma from "@/components/chat-bot";

import type { ChatMessage, ChatThread } from "app-types/chat";
import { redirect, RedirectType } from "next/navigation";

const fetchThread = async (
  threadId: string,
): Promise<(ChatThread & { messages: ChatMessage[] }) | null> => {
  return await selectThreadWithMessagesAction(threadId);
};

export default async function Page({
  params,
}: { params: Promise<{ thread: string }> }) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  if (!thread) redirect("/", RedirectType.replace);

  return <Arithma threadId={threadId} initialMessages={thread.messages} />;
}

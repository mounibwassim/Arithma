import Arithma from "@/components/chat-bot";
import { generateUUID } from "lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const id = generateUUID();
  return <Arithma initialMessages={[]} threadId={id} key={id} />;
}

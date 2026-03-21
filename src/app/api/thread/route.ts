import { getSession } from "auth/server";
import { chatRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    // Return empty array for guest users
    return Response.json([]);
  }

  const threads = await chatRepository.selectThreadsByUserId(session.user.id);
  return Response.json(threads);
}

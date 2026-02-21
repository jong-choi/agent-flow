import { connection } from "next/server";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { getChatsByUser } from "@/features/chats/server/queries";

export async function GET() {
  await connection();

  try {
    const chats = await getChatsByUser();
    return Response.json({ data: chats });
  } catch (error) {
    console.error("GET /api/chat/persistent error:", error);
    return apiErrorResponse(error);
  }
}

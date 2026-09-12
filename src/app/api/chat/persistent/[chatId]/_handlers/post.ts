import { z } from "zod";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
import { insertChatMessage } from "@/features/chats/server/mutations";
import { getChatById } from "@/features/chats/server/queries";

const chatMessageSchema = z.object({
  message: z.string(),
});

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/chat/persistent/[chatId]">,
) {
  try {
    const { chatId } = await params;

    const json = await request.json();
    const parsed = chatMessageSchema.safeParse(json);

    if (!parsed.success) {
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Invalid body.",
      });
    }

    const { message } = parsed.data;

    const chat = await getChatById(chatId);
    await insertChatMessage({ chatId, role: "user", content: message });

    return Response.json({ ok: true, hasTitle: Boolean(chat.title) });
  } catch (error) {
    console.error("POST /api/chat/persistent/[chatId] error:", error);
    return apiErrorResponse(error);
  }
}

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { chatTags } from "@/features/chats/server/cache/tags";
import { insertChatMessage } from "@/features/chats/server/actions";
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
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { message } = parsed.data;

    const chat = await getChatById(chatId);
    await insertChatMessage({ chatId, role: "user", content: message });
    revalidateTag(chatTags.messagesByChat(chat.id), "max");
    revalidateTag(chatTags.detailByChat(chat.id), "max");
    revalidateTag(chatTags.listByUser(chat.userId), "max");

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "사용자 정보가 없습니다.") {
        return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
      }
      if (error.message === "채팅을 찾을 수 없습니다.") {
        return Response.json(
          { error: "채팅을 찾을 수 없습니다." },
          { status: 404 },
        );
      }
      if (error.message === "채팅에 대한 접근 권한이 없습니다.") {
        return Response.json(
          { error: "채팅에 대한 접근 권한이 없습니다." },
          { status: 403 },
        );
      }
    }
    console.error("POST /api/chat/persistent/[chatId] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

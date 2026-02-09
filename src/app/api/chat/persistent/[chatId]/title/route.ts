import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { getSmallestModel } from "@/app/api/chat/_nodes/chat-node/models";
import { getChatById } from "@/features/chats/server/queries";

const titleRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/chat/persistent/[chatId]/title">,
) {
  try {
    const { chatId } = await params;
    const json = await request.json();
    const parsed = titleRequestSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { message: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { message } = parsed.data;

    await getChatById(chatId);

    const model = getSmallestModel();
    const prompt = [
      "Create one short, concise title from the user's message.",
      "Respect the user's language; generate the title in the same language as the message.",
      "Constraints: 3-12 characters, title only, no quotes, no newlines, no emojis.",
      "",
      `Message: ${message}`,
    ].join("\n");

    const response = await model.invoke([new HumanMessage(prompt)]);

    if (typeof response.content !== "string") {
      return Response.json(
        { error: "제목 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    const title = response.content.trim();

    if (!title) {
      return Response.json(
        { error: "제목 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    return Response.json({ title });
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
    console.error("POST /api/chat/persistent/[chatId]/title error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

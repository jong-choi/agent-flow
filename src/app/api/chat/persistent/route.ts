import { getChatsByUser } from "@/db/query/chat";

export async function GET() {
  try {
    const chats = await getChatsByUser();
    return Response.json({ data: chats });
  } catch (error) {
    if (error instanceof Error && error.message === "사용자 정보가 없습니다.") {
      return Response.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    console.error("GET /api/chat/persistent error:", error);
    return Response.json(
      { error: "채팅 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { apiErrorResponse } from "@/app/api/_errors/api-error";
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
      return apiErrorResponse({
        status: 400,
        type: "invalid_request_error",
        code: "invalid_body",
        message: "Invalid body.",
      });
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
      return apiErrorResponse({
        status: 500,
        type: "server_error",
        code: "internal_error",
        message: "Failed to generate title.",
      });
    }

    const title = response.content.trim();

    if (!title) {
      return apiErrorResponse({
        status: 500,
        type: "server_error",
        code: "internal_error",
        message: "Failed to generate title.",
      });
    }

    return Response.json({ title });
  } catch (error) {
    console.error("POST /api/chat/persistent/[chatId]/title error:", error);
    return apiErrorResponse(error);
  }
}

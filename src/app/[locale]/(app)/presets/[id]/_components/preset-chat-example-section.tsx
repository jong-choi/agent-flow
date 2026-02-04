import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicChatMessagesByChatId } from "@/db/query/chat";
import { PresetChatExamplePreview } from "@/features/preset/components/preset-chat-example-preview";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";

export async function PresetChatExampleSection({
  chatId,
}: {
  chatId?: string | null;
}) {
  const rawMessages = chatId
    ? await getPublicChatMessagesByChatId({ chatId })
    : [];

  const messages: ClientChatMessage[] = rawMessages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ? message.createdAt.toISOString() : null,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>채팅 예시</CardTitle>
        <CardDescription>마켓에 노출된 채팅 예시입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <PresetChatExamplePreview messages={messages} />
      </CardContent>
    </Card>
  );
}

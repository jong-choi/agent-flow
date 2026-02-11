import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicChatMessagesByChatId } from "@/features/chats/server/queries";
import { PresetChatExamplePreview } from "@/features/presets/components/preset-chat-example-preview";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { getTranslations } from "next-intl/server";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function PresetChatExampleSection({
  chatId,
}: {
  chatId?: string | null;
}) {
  const t = await getTranslations<AppMessageKeys>("Presets");
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
        <CardTitle>{t("chatExampleSection.title")}</CardTitle>
        <CardDescription>{t("chatExampleSection.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {chatId ? (
          <PresetChatExamplePreview messages={messages} />
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            {t("chatExampleSection.noLinkedChat")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

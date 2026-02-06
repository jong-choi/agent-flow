import { ChatSidebar } from "@/app/[locale]/(app)/chat/_components/chat-sidebar";
import { DVH_HEADER_OFFSET } from "@/app/_components/site-header/site-header";

export default function ChatLayout({
  children,
}: LayoutProps<"/[locale]/chat">) {
  return (
    <div className={`flex ${DVH_HEADER_OFFSET} w-full flex-1`}>
      <ChatSidebar />
      {children}
    </div>
  );
}

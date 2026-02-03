import { ChatSidebar } from "@/app/[locale]/(app)/chat/_components/chat-sidebar";

export default function ChatLayout({
  children,
}: LayoutProps<"/[locale]/chat">) {
  return (
    <div className="flex h-full w-full overflow-auto">
      <ChatSidebar />
      {children}
    </div>
  );
}

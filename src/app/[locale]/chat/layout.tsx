import { SidebarContainer } from "@/components/sidebar-container";
import { ChatSidebar } from "@/features/chats/components/chat-page/chat-sidebar";

export default function ChatLayout({
  children,
}: LayoutProps<"/[locale]/chat">) {
  return (
    <>
      <SidebarContainer>
        <ChatSidebar />
      </SidebarContainer>
      {children}
    </>
  );
}

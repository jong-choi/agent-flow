export default function ChatLayout({
  children,
}: LayoutProps<"/[locale]/chat">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

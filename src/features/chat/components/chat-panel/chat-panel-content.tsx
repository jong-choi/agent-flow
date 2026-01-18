"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownWrapper } from "@/features/chat/components/markdown/markdown-wrapper";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// 임시 데모 데이터 (나중에 실제 데이터로 교체)
const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "안녕하세요! 😊\n\n오늘은 어떤 예기 나눠볼까요? (집도도 좋고, 고민 상담/정보 찾기/글쓰기/정리도 다 도와드릴 수 있어요.)",
    timestamp: "오전 10:30",
  },
  {
    id: "2",
    role: "user",
    content: "안녕하세요! 오늘 날씨가 어떤가요?",
    timestamp: "오전 10:32",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "죄송하지만, 저는 실시간 날씨 정보에 접근할 수 없습니다.\n\n대신 다음을 도와드릴 수 있어요:\n- 날씨 앱이나 웹사이트 추천\n- 계절별 날씨 대비 팁\n- 날씨 관련 데이터 분석\n\n무엇을 도와드릴까요?",
    timestamp: "오전 10:33",
  },
];

export function ChatPanelContent() {
  return (
    <div className="flex h-full flex-col">
      {/* 메시지 영역 */}
      <div className="scrollbar-slim flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
        {DEMO_MESSAGES.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            {message.role === "user" ? (
              <div className="group relative max-w-[85%] sm:max-w-[70%]">
                <div className="rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-shadow hover:shadow-md">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <MarkdownWrapper className="text-sm leading-relaxed text-card-foreground">
                  {message.content}
                </MarkdownWrapper>
                <div className="mt-1 ml-2 flex items-center gap-6">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </span>
                  <Button
                    onClick={() =>
                      navigator.clipboard.writeText(message.content)
                    }
                    aria-label="복사"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <Copy />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex flex-col items-center gap-2">
          <Textarea placeholder="메시지를 입력하세요..." className="h-24" />
          <Button className="self-end-safe">전송</Button>
        </div>
      </div>
    </div>
  );
}

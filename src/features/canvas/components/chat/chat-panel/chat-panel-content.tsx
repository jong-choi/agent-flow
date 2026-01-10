"use client";

import { Suspense } from "react";
import { ChatPanelCloseButton } from "@/features/canvas/components/chat/chat-panel/chat-panel-close-button";

export function ChatPanelContent() {
  return (
    <section className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <Suspense>
            <ChatPanelCloseButton />
          </Suspense>
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Three
            </p>
            <h2 className="text-lg font-semibold">Chat</h2>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          3 online
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-sm">
        <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2">
          Need eyes on the new onboarding flow.
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground">
          On it. Dropping notes in 10 min.
        </div>
        <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2">
          I can cover analytics after lunch.
        </div>
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground">
          <span className="flex-1">Write a message to the team...</span>
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
            Send
          </span>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ReactMarkdownApp } from "@/features/chat/components/markdown/react-markdown-app";
import "@/features/chat/styles/small-header-markdown.css";
import { formatKoreanDate } from "@/lib/utils";

type DocumentEditClientProps = {
  document: {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
  };
  updateAction: (formData: FormData) => void | Promise<void>;
};

type EditorTab = "raw" | "preview";

export function DocumentEditClient({
  document,
  updateAction,
}: DocumentEditClientProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("raw");
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);

  return (
    <form
      action={updateAction}
      className="flex min-h-0 flex-1 flex-col bg-muted/30"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/docs/${document.id}`}>
                <ArrowLeft className="size-4" />
                문서로 돌아가기
              </Link>
            </Button>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">문서 편집</p>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                마크다운 문서를 수정하고 저장합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                업데이트 {formatKoreanDate(document.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" className="ml-auto">
              저장
            </Button>
          </div>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>문서 편집</CardTitle>
            <CardDescription>
              Raw에서 편집하고 Preview로 미리 보기 합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                문서 제목
              </label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "raw" ? "secondary" : "outline"}
                onClick={() => setActiveTab("raw")}
              >
                raw
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "preview" ? "secondary" : "outline"}
                onClick={() => setActiveTab("preview")}
              >
                preview
              </Button>
            </div>
            {activeTab === "raw" ? (
              <Textarea
                id="content"
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[320px] font-mono"
                placeholder="마크다운 내용을 입력하세요."
              />
            ) : (
              <>
                <input type="hidden" name="content" value={content} />
                <div className="new-york-small min-h-[320px] rounded-md border bg-background/70 p-4 leading-relaxed">
                  <ReactMarkdownApp>{content}</ReactMarkdownApp>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ReactMarkdownApp } from "@/features/chat/components/markdown/react-markdown-app";
import "@/features/chat/styles/small-header-markdown.css";
import { formatKoreanDate } from "@/lib/utils";

type DocumentDetail = {
  id: string;
  title: string;
  summary: string;
  content: string;
  updatedAt: string;
  status: "draft" | "published";
  tags: string[];
};

const documents: DocumentDetail[] = [
  {
    id: "drizzle-setup-note",
    title: "Drizzle 초기 세팅 메모",
    summary: "프로젝트 초기 설정과 마이그레이션 규칙을 정리한 문서입니다.",
    content:
      "# Drizzle 기본 세팅\n\n프로젝트에서 사용하는 드리즐 설정과 팀 규칙을 정리합니다.\n\n## 체크리스트\n\n- [x] 데이터베이스 연결\n- [x] 스키마 파일 구조\n- [ ] 마이그레이션 자동화\n\n## 기본 스키마 예시\n\n```ts\nimport { pgTable, text } from \"drizzle-orm/pg-core\";\n\nexport const users = pgTable(\"users\", {\n  id: text(\"id\").primaryKey(),\n});\n```\n\n## 참고 사항\n\n- 스키마 변경 시 `drizzle-kit` 마이그레이션 실행\n- 배포 전 로컬에서 한번씩 테스트\n",
    updatedAt: "2026-01-22",
    status: "draft",
    tags: ["세팅", "DB"],
  },
  {
    id: "markdown-guideline",
    title: "문서 마크다운 가이드",
    summary: "문서 품질을 맞추기 위한 마크다운 작성 규칙입니다.",
    content:
      "# 마크다운 작성 규칙\n\n1. 제목은 # ~ ### 까지만 사용\n2. 코드 블록에는 언어 태그 추가\n3. 체크리스트는 - [ ] 형식 사용\n\n## 링크 표기\n\n[링크 텍스트](https://example.com) 형태를 사용합니다.\n\n> 팀 공통 규칙을 변경할 때는 회의를 거친 뒤 업데이트합니다.\n",
    updatedAt: "2026-01-20",
    status: "published",
    tags: ["가이드", "문서"],
  },
  {
    id: "release-note-draft",
    title: "1월 릴리즈 노트 초안",
    summary: "1월 릴리즈에 포함될 기능과 작업 항목을 정리합니다.",
    content:
      "# 1월 릴리즈 노트\n\n## 주요 변경 사항\n\n- 문서 편집 화면 개선\n- 프리셋 탐색 필터 추가\n- 버그 수정 및 성능 최적화\n\n## 확인 사항\n\n- QA 체크리스트 완료 여부\n- 배포 일정 공유\n\n추가 항목은 이 문서에 계속 업데이트합니다.\n",
    updatedAt: "2026-01-18",
    status: "draft",
    tags: ["릴리즈", "초안"],
  },
];

const statusLabel = (status: DocumentDetail["status"]) =>
  status === "published" ? "공개" : "초안";

type EditorTab = "raw" | "preview";

export default function DocumentEditPage({
  params,
}: PageProps<"/docs/edit/[docId]">) {
  const router = useRouter();
  const { docId } = use(params);
  const document = documents.find((doc) => doc.id === docId);
  const [activeTab, setActiveTab] = useState<EditorTab>("raw");
  const [content, setContent] = useState(document?.content ?? "");

  if (!document) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
        <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>문서를 찾을 수 없습니다.</CardTitle>
              <CardDescription>
                목록으로 돌아가 다른 문서를 선택해 주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/docs">목록으로</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
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
              <h1 className="text-2xl font-semibold">{document.title}</h1>
              <p className="text-sm text-muted-foreground">
                {document.summary}
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
            <Badge variant="secondary">{statusLabel(document.status)}</Badge>
            {document.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            <Button
              onClick={() => router.push(`/docs/${document.id}`)}
              className="ml-auto"
            >
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
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-[320px] font-mono"
                placeholder="마크다운 내용을 입력하세요."
              />
            ) : (
              <div className="new-york-small min-h-[320px] rounded-md border bg-background/70 p-4 leading-relaxed">
                <ReactMarkdownApp>{content}</ReactMarkdownApp>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

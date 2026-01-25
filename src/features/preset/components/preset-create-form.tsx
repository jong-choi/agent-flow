import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const categoryOptions = [
  { label: "선택 안함", value: "" },
  { label: "영업", value: "영업" },
  { label: "고객지원", value: "고객지원" },
  { label: "마케팅", value: "마케팅" },
  { label: "데이터", value: "데이터" },
  { label: "운영", value: "운영" },
  { label: "개발", value: "개발" },
];

const selectClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(value);

type WorkflowOption = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
};

type PresetCreateFormProps = {
  workflows: WorkflowOption[];
  action: (formData: FormData) => void | Promise<void>;
};

export function PresetCreateForm({
  workflows,
  action,
}: PresetCreateFormProps) {
  const hasWorkflows = workflows.length > 0;

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>워크플로우 선택</CardTitle>
          <CardDescription>
            프리셋으로 공유할 워크플로우를 먼저 골라주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasWorkflows ? (
            <div className="grid gap-4 md:grid-cols-2">
              {workflows.map((workflow, index) => (
                <label
                  key={workflow.id}
                  className="group block cursor-pointer"
                >
                  <input
                    type="radio"
                    name="workflowId"
                    value={workflow.id}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                    required
                  />
                  <div className="rounded-xl border bg-card px-6 py-4 shadow-sm transition peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary/30">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        {workflow.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {workflow.description ?? "설명이 없습니다."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        최근 업데이트 {formatDate(workflow.updatedAt)}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              <p>아직 저장된 워크플로우가 없습니다.</p>
              <p className="mt-1">
                캔버스에서 워크플로우를 만든 뒤 다시 돌아와 주세요.
              </p>
              <Button variant="secondary" size="sm" className="mt-4" asChild>
                <Link href="/canvas">워크플로우 만들기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <fieldset
        disabled={!hasWorkflows}
        className="space-y-6 disabled:opacity-60"
      >
        <Card>
          <CardHeader>
            <CardTitle>프리셋 정보</CardTitle>
            <CardDescription>
              마켓에 노출될 프리셋 설명을 입력합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                프리셋 이름
              </label>
              <Input
                id="title"
                name="title"
                placeholder="예: 고객 문의 분류 + 답변 초안"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="summary" className="text-sm font-medium">
                요약
              </label>
              <Textarea
                id="summary"
                name="summary"
                rows={3}
                placeholder="카드에 노출될 짧은 설명을 작성해 주세요."
              />
              <p className="text-xs text-muted-foreground">
                마켓 리스트 카드에 표시됩니다.
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                상세 설명
              </label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                placeholder="프리셋의 목적, 사용 시나리오, 추천 대상 등을 적어주세요."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                카테고리
              </label>
              <select
                id="category"
                name="category"
                defaultValue=""
                className={selectClassName}
              >
                {categoryOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가격 및 공개 설정</CardTitle>
            <CardDescription>
              무료 또는 크레딧 가격을 설정할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="price" className="text-sm font-medium">
                가격 (크레딧)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
              />
              <p className="text-xs text-muted-foreground">
                0을 입력하면 무료 프리셋으로 표시됩니다.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                className="mt-1 size-4 rounded border border-input"
              />
              <div className="space-y-1">
                <label htmlFor="isPublished" className="text-sm font-medium">
                  생성 후 바로 공개하기
                </label>
                <p className="text-xs text-muted-foreground">
                  공개된 프리셋은 마켓에서 누구나 볼 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!hasWorkflows}>
          프리셋 생성
        </Button>
        <Button variant="outline" asChild>
          <Link href="/presets">취소</Link>
        </Button>
      </div>
    </form>
  );
}

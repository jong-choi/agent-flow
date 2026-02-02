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
import { categoryOptions } from "@/features/preset/constants/category-options";
import { formatKoreanDate } from "@/lib/utils";

const selectClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type PresetEditFormPreset = {
  id: string;
  workflowId: string;
  workflowTitle: string | null;
  workflowUpdatedAt: Date | null;
  title: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  price: number;
  isPublished: boolean;
};

type PresetEditFormProps = {
  preset: PresetEditFormPreset;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function PresetEditForm({
  preset,
  updateAction,
  deleteAction,
}: PresetEditFormProps) {
  return (
    <div className="space-y-6">
      <form action={updateAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>워크플로우 정보</CardTitle>
            <CardDescription>프리셋이 연결된 워크플로우</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {preset.workflowTitle ?? "워크플로우"}
              </p>
              <p className="text-xs text-muted-foreground">
                최근 업데이트{" "}
                {formatKoreanDate(preset.workflowUpdatedAt, "날짜 없음")}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/presets/workflows/${preset.workflowId}`}>
                워크플로우 보기
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>프리셋 정보</CardTitle>
            <CardDescription>마켓에 보여질 정보를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" name="presetId" value={preset.id} />
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                프리셋 이름
              </label>
              <Input
                id="title"
                name="title"
                defaultValue={preset.title}
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
                defaultValue={preset.summary ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                상세 설명
              </label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={preset.description ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                카테고리
              </label>
              <select
                id="category"
                name="category"
                defaultValue={preset.category ?? ""}
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
            <CardDescription>가격과 공개 여부를 조정합니다.</CardDescription>
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
                defaultValue={preset.price}
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                id="isPublished"
                name="isPublished"
                type="checkbox"
                defaultChecked={preset.isPublished}
                className="mt-1 size-4 rounded border border-input"
              />
              <div className="space-y-1">
                <label htmlFor="isPublished" className="text-sm font-medium">
                  마켓에 공개
                </label>
                <p className="text-xs text-muted-foreground">
                  공개하면 마켓에서 누구나 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit">수정 저장</Button>
          <Button variant="outline" asChild>
            <Link href={`/presets/${preset.id}`}>취소</Link>
          </Button>
        </div>
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="presetId" value={preset.id} />
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">프리셋 삭제</CardTitle>
            <CardDescription>
              삭제하면 복구할 수 없습니다. 신중하게 진행하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" type="submit">
              프리셋 삭제
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

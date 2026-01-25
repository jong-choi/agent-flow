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
import { PresetCreateSubmitButton } from "@/features/preset/components/preset-create-submit-button";
import { categoryOptions } from "@/features/preset/constants/category-options";

const selectClassName =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type PresetCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  submitLabel?: string;
};

export function PresetCreateForm({
  action,
  cancelHref = "/presets",
  submitLabel = "프리셋 생성",
}: PresetCreateFormProps) {
  return (
    <form action={action} className="space-y-6">
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

      <div className="flex flex-wrap gap-2">
        <PresetCreateSubmitButton label={submitLabel} />
        <Button variant="outline" asChild>
          <Link href={cancelHref}>취소</Link>
        </Button>
      </div>
    </form>
  );
}

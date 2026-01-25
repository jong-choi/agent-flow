import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db/client";
import { getPurchasedPresets } from "@/db/query/presets";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const libraryFilters = [
  { label: "전체", active: true },
  { label: "최근 사용" },
  { label: "업데이트 있음" },
  { label: "즐겨찾기" },
];

const categoryFilters = [
  { label: "전체", active: true },
  { label: "영업" },
  { label: "고객지원" },
  { label: "마케팅" },
  { label: "데이터" },
  { label: "운영" },
  { label: "개발" },
];

const sortOptions = [
  { label: "최근 사용순", active: true },
  { label: "구매일순" },
  { label: "이름순" },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(value);

export default async function PurchasedPresetsPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    notFound();
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    notFound();
  }

  const purchasedPresets = await getPurchasedPresets(user.id);
  const freeCount = purchasedPresets.filter(
    (preset) => preset.price === 0,
  ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">내 라이브러리</p>
            <h1 className="text-2xl font-semibold">구매한 프리셋</h1>
            <p className="text-sm text-muted-foreground">
              구매한 프리셋을 관리하고 캔버스에서 바로 불러옵니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets">프리셋 마켓</Link>
            </Button>
            <Button asChild>
              <Link href="/canvas">캔버스 열기</Link>
            </Button>
          </div>
        </div>

        <Card className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">내 프리셋 라이브러리</p>
              <p className="text-sm text-muted-foreground">
                구매 {purchasedPresets.length}개 · 무료 프리셋 {freeCount}개
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/canvas">내 프리셋 불러오기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">검색 및 필터</CardTitle>
            <CardDescription>
              상태와 카테고리로 내 프리셋을 빠르게 정리하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <Input placeholder="프리셋 이름이나 키워드로 검색" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary">검색</Button>
                <Button variant="outline">필터 초기화</Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  상태
                </p>
                <div className="flex flex-wrap gap-2">
                  {libraryFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant={filter.active ? "secondary" : "outline"}
                      size="sm"
                      className="rounded-full"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  카테고리
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant={filter.active ? "secondary" : "outline"}
                      size="sm"
                      className="rounded-full"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            내 프리셋 {purchasedPresets.length}개
          </p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.label}
                variant={option.active ? "secondary" : "outline"}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {purchasedPresets.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>구매한 프리셋이 없습니다</CardTitle>
              <CardDescription>
                프리셋 마켓에서 필요한 워크플로우를 구매해 보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/presets">프리셋 마켓 보기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {purchasedPresets.map((preset) => (
              <Card key={preset.id} className="h-full">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {preset.category ?? "미분류"}
                    </span>
                    <span>구매 {formatDate(preset.purchasedAt)}</span>
                  </div>
                  <CardTitle className="text-lg">{preset.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {preset.description ?? "설명이 없습니다."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>가격 {formatPrice(preset.price)}</span>
                    <span>제작자 {preset.ownerName ?? "알 수 없음"}</span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 border-t">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/canvas">캔버스에서 열기</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/presets/${preset.id}`}>상세 보기</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

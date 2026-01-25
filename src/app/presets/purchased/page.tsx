import Link from "next/link";
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

const purchasedPresets = [
  {
    id: "preset-support-002",
    title: "고객 문의 분류 + 답변 초안",
    description: "고객 문의를 자동으로 분류하고 답변 초안을 준비합니다.",
    category: "고객지원",
    price: 2,
    purchasedAt: "2024.08.12",
    lastUsed: "3일 전",
    version: "v1.2",
    hasUpdate: false,
    tags: ["FAQ", "분류", "Zendesk"],
  },
  {
    id: "preset-data-004",
    title: "리포트 자동 요약 배포",
    description: "주간 리포트를 요약해 팀 채널로 공유합니다.",
    category: "데이터",
    price: 5,
    purchasedAt: "2024.08.02",
    lastUsed: "어제",
    version: "v2.0",
    hasUpdate: true,
    tags: ["Google Sheets", "요약", "Slack"],
  },
  {
    id: "preset-ops-005",
    title: "신규 멤버 온보딩 플로우",
    description: "온보딩 체크리스트와 계정 세팅을 자동화합니다.",
    category: "운영",
    price: 0,
    purchasedAt: "2024.07.18",
    lastUsed: "1주 전",
    version: "v1.0",
    hasUpdate: false,
    tags: ["온보딩", "Notion", "Slack"],
  },
  {
    id: "preset-dev-006",
    title: "앱 로그 이상 탐지 알림",
    description: "에러 로그를 감지해 즉시 알림을 전송합니다.",
    category: "개발",
    price: 4,
    purchasedAt: "2024.08.20",
    lastUsed: "5일 전",
    version: "v1.3",
    hasUpdate: true,
    tags: ["Sentry", "Webhook", "알림"],
  },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

export default function PurchasedPresetsPage() {
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
                구매 {purchasedPresets.length}개 · 무료 프리셋 1개 · 업데이트
                2개
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {purchasedPresets.map((preset) => (
            <Card key={preset.id} className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {preset.category}
                  </span>
                  <span>구매 {preset.purchasedAt}</span>
                  {preset.hasUpdate ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      업데이트 있음
                    </span>
                  ) : null}
                </div>
                <CardTitle className="text-lg">{preset.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {preset.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>최근 사용 {preset.lastUsed}</span>
                  <span>버전 {preset.version}</span>
                  <span>가격 {formatPrice(preset.price)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="gap-2 border-t">
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/canvas">캔버스에서 열기</Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/presets/${preset.id}`}>상세 보기</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

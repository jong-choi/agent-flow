import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categoryFilters = [
  { label: "전체", active: true },
  { label: "마케팅" },
  { label: "영업" },
  { label: "고객지원" },
  { label: "데이터" },
  { label: "운영" },
  { label: "개발" },
];

const priceFilters = [
  { label: "전체", active: true },
  { label: "무료" },
  { label: "1~2 크레딧" },
  { label: "3~5 크레딧" },
];

const sortOptions = [
  { label: "인기순", active: true },
  { label: "최신순" },
  { label: "평점순" },
  { label: "가격 낮은 순" },
];

const presetList = [
  {
    id: "preset-sales-001",
    title: "세일즈 리드 수집 자동화",
    description: "폼 응답을 분류하고 CRM에 등록하는 B2B 리드 파이프라인.",
    category: "영업",
    price: 3,
    rating: 4.8,
    purchases: 128,
    tags: ["CRM", "Slack", "이메일"],
    updatedAt: "2일 전",
    author: "민아",
  },
  {
    id: "preset-support-002",
    title: "고객 문의 분류 + 답변 초안",
    description: "고객 문의를 자동으로 분류하고 답변 초안을 준비합니다.",
    category: "고객지원",
    price: 2,
    rating: 4.6,
    purchases: 92,
    tags: ["FAQ", "분류", "Zendesk"],
    updatedAt: "5일 전",
    author: "지훈",
  },
  {
    id: "preset-marketing-003",
    title: "콘텐츠 캘린더 생성기",
    description: "SNS 채널별 콘텐츠 캘린더를 자동으로 생성합니다.",
    category: "마케팅",
    price: 1,
    rating: 4.5,
    purchases: 76,
    tags: ["Notion", "SNS", "캘린더"],
    updatedAt: "1주 전",
    author: "서연",
  },
  {
    id: "preset-data-004",
    title: "리포트 자동 요약 배포",
    description: "주간 리포트를 요약해 팀 채널로 공유합니다.",
    category: "데이터",
    price: 5,
    rating: 4.9,
    purchases: 212,
    tags: ["Google Sheets", "요약", "Slack"],
    updatedAt: "3일 전",
    author: "도현",
  },
  {
    id: "preset-ops-005",
    title: "신규 멤버 온보딩 플로우",
    description: "온보딩 체크리스트와 계정 세팅을 자동화합니다.",
    category: "운영",
    price: 0,
    rating: 4.4,
    purchases: 310,
    tags: ["온보딩", "Notion", "Slack"],
    updatedAt: "2주 전",
    author: "민수",
  },
  {
    id: "preset-dev-006",
    title: "앱 로그 이상 탐지 알림",
    description: "에러 로그를 감지해 즉시 알림을 전송합니다.",
    category: "개발",
    price: 4,
    rating: 4.7,
    purchases: 54,
    tags: ["Sentry", "Webhook", "알림"],
    updatedAt: "4일 전",
    author: "지민",
  },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

export default function TemplateMarketPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">마켓플레이스</p>
            <h1 className="text-2xl font-semibold">프리셋 마켓</h1>
            <p className="text-sm text-muted-foreground">
              커뮤니티에서 만든 워크플로우 프리셋을 찾아보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/canvas">프리셋 만들기</Link>
            </Button>
            <Button asChild>
              <Link href="/canvas">캔버스 열기</Link>
            </Button>
          </div>
        </div>

        <Card className="py-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">구매한 프리셋</p>
              <p className="text-sm text-muted-foreground">
                구매한 프리셋은 캔버스에서 바로 불러올 수 있습니다.
              </p>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/presets/purchased">내 프리셋 보기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">검색 및 필터</CardTitle>
            <CardDescription>
              가격과 카테고리로 프리셋을 빠르게 찾아보세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <Input placeholder="워크플로우, 기능, 키워드로 검색" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary">검색</Button>
                <Button variant="outline">필터 초기화</Button>
              </div>
            </div>

            <div className="space-y-3">
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
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  가격
                </p>
                <div className="flex flex-wrap gap-2">
                  {priceFilters.map((filter) => (
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
            추천 {presetList.length}개 프리셋
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
          {presetList.map((preset) => (
            <Card key={preset.id} className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {preset.category}
                  </span>
                  <span>업데이트 {preset.updatedAt}</span>
                </div>
                <CardTitle className="text-lg">{preset.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {preset.description}
                </CardDescription>
                <CardAction>
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    {formatPrice(preset.price)}
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>평점 {preset.rating}</span>
                  <span>구매 {preset.purchases}</span>
                  <span>제작자 {preset.author}</span>
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
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/presets/${preset.id}`}>상세 보기</Link>
                </Button>
                <Button
                  size="sm"
                  variant={preset.price === 0 ? "secondary" : "default"}
                  className="flex-1"
                >
                  {preset.price === 0 ? "무료로 받기" : "구매하기"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

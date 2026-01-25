import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const presetDetails = [
  {
    id: "preset-sales-001",
    title: "세일즈 리드 수집 자동화",
    description: "폼 응답을 분류하고 CRM에 등록하는 B2B 리드 파이프라인.",
    summary:
      "리드 입력을 정제하고 우선순위를 자동으로 분류해 영업팀의 후속 작업 시간을 줄입니다.",
    category: "영업",
    price: 3,
    rating: 4.8,
    reviews: 32,
    purchases: 128,
    updatedAt: "2일 전",
    difficulty: "중급",
    nodes: 12,
    connections: 16,
    estimatedTime: "5분",
    author: {
      name: "민아",
      role: "Sales Ops",
      bio: "B2B 세일즈 파이프라인 자동화와 CRM 정합성 개선에 집중합니다.",
    },
    tags: ["CRM", "Slack", "이메일"],
    integrations: ["HubSpot", "Slack", "Gmail"],
    highlights: [
      {
        title: "리드 입력 정제",
        description: "폼 데이터를 표준화하고 중복을 제거합니다.",
      },
      {
        title: "CRM 자동 등록",
        description: "핵심 필드를 매핑해 CRM에 즉시 반영합니다.",
      },
      {
        title: "핫 리드 알림",
        description: "우선순위 리드는 슬랙으로 빠르게 공유합니다.",
      },
    ],
    steps: [
      {
        title: "리드 데이터 수집",
        description: "폼 응답 또는 메일 입력 데이터를 가져옵니다.",
      },
      {
        title: "검증 및 스코어링",
        description: "필드 누락을 보정하고 리드 점수를 계산합니다.",
      },
      {
        title: "CRM 등록",
        description: "지정된 파이프라인과 담당자에게 할당합니다.",
      },
      {
        title: "팀 알림",
        description: "핫 리드와 신규 리드를 팀 채널로 공유합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-001",
        name: "수현",
        rating: 5,
        comment: "리드 정리가 빨라져서 영업팀 회신 속도가 확실히 개선됐어요.",
      },
      {
        id: "review-002",
        name: "정우",
        rating: 4,
        comment: "CRM 등록 자동화가 깔끔합니다. 필드 매핑만 조금 손봤어요.",
      },
      {
        id: "review-003",
        name: "가은",
        rating: 5,
        comment: "핫 리드 알림 덕분에 우선 대응이 쉬워졌습니다.",
      },
    ],
    owned: false,
  },
  {
    id: "preset-support-002",
    title: "고객 문의 분류 + 답변 초안",
    description: "고객 문의를 자동으로 분류하고 답변 초안을 준비합니다.",
    summary:
      "수신된 문의를 분류하고 FAQ 기반 답변 초안을 생성해 응답 품질을 높입니다.",
    category: "고객지원",
    price: 2,
    rating: 4.6,
    reviews: 24,
    purchases: 92,
    updatedAt: "5일 전",
    difficulty: "초급",
    nodes: 10,
    connections: 13,
    estimatedTime: "3분",
    author: {
      name: "지훈",
      role: "CS Lead",
      bio: "고객 응대 워크플로우와 품질 관리 자동화를 설계합니다.",
    },
    tags: ["FAQ", "분류", "Zendesk"],
    integrations: ["Zendesk", "Slack", "Notion"],
    highlights: [
      {
        title: "문의 자동 분류",
        description: "문의 유형을 우선순위에 따라 자동 분류합니다.",
      },
      {
        title: "FAQ 추천",
        description: "관련 문서를 추천해 답변 초안을 만듭니다.",
      },
      {
        title: "핸드오프 준비",
        description: "긴급 문의는 담당자에게 바로 전달합니다.",
      },
    ],
    steps: [
      {
        title: "문의 수집",
        description: "지원 채널에서 최신 문의를 가져옵니다.",
      },
      {
        title: "문의 유형 분류",
        description: "긴급도와 카테고리를 자동으로 분류합니다.",
      },
      {
        title: "답변 초안 작성",
        description: "관련 FAQ를 기반으로 초안을 생성합니다.",
      },
      {
        title: "티켓 업데이트",
        description: "초안을 티켓에 자동 삽입합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-004",
        name: "하린",
        rating: 5,
        comment: "응답 시간이 줄어들고 품질이 일정해졌습니다.",
      },
      {
        id: "review-005",
        name: "태현",
        rating: 4,
        comment: "FAQ 연결만 보완하면 바로 사용할 수 있어요.",
      },
    ],
    owned: true,
  },
  {
    id: "preset-marketing-003",
    title: "콘텐츠 캘린더 생성기",
    description: "SNS 채널별 콘텐츠 캘린더를 자동으로 생성합니다.",
    summary:
      "캠페인 일정과 채널별 톤앤매너를 반영해 콘텐츠 캘린더를 자동 생성합니다.",
    category: "마케팅",
    price: 1,
    rating: 4.5,
    reviews: 18,
    purchases: 76,
    updatedAt: "1주 전",
    difficulty: "초급",
    nodes: 8,
    connections: 9,
    estimatedTime: "3분",
    author: {
      name: "서연",
      role: "Growth Marketer",
      bio: "캠페인 기획과 콘텐츠 운영 자동화를 돕습니다.",
    },
    tags: ["Notion", "SNS", "캘린더"],
    integrations: ["Notion", "Google Calendar", "Slack"],
    highlights: [
      {
        title: "채널별 캘린더",
        description: "채널 특성을 고려한 일정표를 만듭니다.",
      },
      {
        title: "캠페인 프리셋",
        description: "캠페인 목적에 맞는 아이디어를 제공합니다.",
      },
      {
        title: "편집 가이드 제공",
        description: "카피 작성 가이드를 함께 전달합니다.",
      },
    ],
    steps: [
      {
        title: "캠페인 브리프 수집",
        description: "목표와 기간, 채널 정보를 받습니다.",
      },
      {
        title: "콘텐츠 아이디어 생성",
        description: "채널별 주제를 자동으로 추천합니다.",
      },
      {
        title: "캘린더 생성",
        description: "일정표를 Notion에 정리합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-006",
        name: "윤지",
        rating: 4,
        comment: "캘린더 초안이 빠르게 잡혀서 기획 속도가 좋아졌어요.",
      },
      {
        id: "review-007",
        name: "현우",
        rating: 5,
        comment: "채널별 톤을 맞춘 아이디어가 유용했습니다.",
      },
    ],
    owned: false,
  },
  {
    id: "preset-data-004",
    title: "리포트 자동 요약 배포",
    description: "주간 리포트를 요약해 팀 채널로 공유합니다.",
    summary: "주간 지표를 요약하고 핵심 인사이트를 추출해 팀에 공유합니다.",
    category: "데이터",
    price: 5,
    rating: 4.9,
    reviews: 40,
    purchases: 212,
    updatedAt: "3일 전",
    difficulty: "중급",
    nodes: 14,
    connections: 20,
    estimatedTime: "7분",
    author: {
      name: "도현",
      role: "Data Analyst",
      bio: "데이터 리포팅 자동화와 인사이트 공유 프로세스를 만듭니다.",
    },
    tags: ["Google Sheets", "요약", "Slack"],
    integrations: ["Google Sheets", "Slack", "Looker"],
    highlights: [
      {
        title: "지표 자동 수집",
        description: "주요 KPI를 자동으로 집계합니다.",
      },
      {
        title: "요약 생성",
        description: "핵심 인사이트를 텍스트로 요약합니다.",
      },
      {
        title: "채널 공유",
        description: "주간 리포트를 팀 채널로 전달합니다.",
      },
    ],
    steps: [
      {
        title: "지표 수집",
        description: "대시보드와 스프레드시트 데이터를 불러옵니다.",
      },
      {
        title: "요약 작성",
        description: "변화 포인트와 원인을 요약합니다.",
      },
      {
        title: "자동 공유",
        description: "지정된 채널에 리포트를 발송합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-008",
        name: "민재",
        rating: 5,
        comment: "팀 리포트 작성 시간이 절반으로 줄었습니다.",
      },
      {
        id: "review-009",
        name: "예린",
        rating: 5,
        comment: "요약 품질이 좋아서 그대로 공유하고 있어요.",
      },
    ],
    owned: true,
  },
  {
    id: "preset-ops-005",
    title: "신규 멤버 온보딩 플로우",
    description: "온보딩 체크리스트와 계정 세팅을 자동화합니다.",
    summary:
      "새로운 멤버를 위한 온보딩 체크리스트와 계정 생성 절차를 자동화합니다.",
    category: "운영",
    price: 0,
    rating: 4.4,
    reviews: 58,
    purchases: 310,
    updatedAt: "2주 전",
    difficulty: "초급",
    nodes: 9,
    connections: 11,
    estimatedTime: "4분",
    author: {
      name: "민수",
      role: "People Ops",
      bio: "팀 온보딩 경험을 개선하는 자동화 플로우를 만듭니다.",
    },
    tags: ["온보딩", "Notion", "Slack"],
    integrations: ["Notion", "Slack", "Google Workspace"],
    highlights: [
      {
        title: "체크리스트 자동 생성",
        description: "역할에 맞는 온보딩 체크리스트를 생성합니다.",
      },
      {
        title: "계정 세팅 안내",
        description: "필수 계정과 권한 설정을 안내합니다.",
      },
      {
        title: "온보딩 알림",
        description: "팀 리더에게 온보딩 진행 상황을 공유합니다.",
      },
    ],
    steps: [
      {
        title: "멤버 정보 등록",
        description: "입사자 정보와 역할을 입력합니다.",
      },
      {
        title: "체크리스트 생성",
        description: "필수 항목과 일정이 자동으로 생성됩니다.",
      },
      {
        title: "알림 전송",
        description: "담당자에게 할 일을 안내합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-010",
        name: "지아",
        rating: 4,
        comment: "온보딩 체크리스트가 명확해서 신규 멤버 만족도가 높아요.",
      },
      {
        id: "review-011",
        name: "성민",
        rating: 5,
        comment: "무료인데도 구성 완성도가 높습니다.",
      },
    ],
    owned: true,
  },
  {
    id: "preset-dev-006",
    title: "앱 로그 이상 탐지 알림",
    description: "에러 로그를 감지해 즉시 알림을 전송합니다.",
    summary:
      "에러 로그를 실시간으로 감지해 담당자에게 알림을 보내는 프리셋입니다.",
    category: "개발",
    price: 4,
    rating: 4.7,
    reviews: 12,
    purchases: 54,
    updatedAt: "4일 전",
    difficulty: "중급",
    nodes: 11,
    connections: 15,
    estimatedTime: "6분",
    author: {
      name: "지민",
      role: "Platform Engineer",
      bio: "모니터링 자동화와 알림 최적화에 집중합니다.",
    },
    tags: ["Sentry", "Webhook", "알림"],
    integrations: ["Sentry", "PagerDuty", "Slack"],
    highlights: [
      {
        title: "실시간 에러 감지",
        description: "에러 로그를 빠르게 감지합니다.",
      },
      {
        title: "알림 채널 분기",
        description: "심각도에 따라 알림 채널을 분리합니다.",
      },
      {
        title: "회고 기록",
        description: "사후 분석을 위한 기록을 남깁니다.",
      },
    ],
    steps: [
      {
        title: "로그 수집",
        description: "Sentry에서 에러 이벤트를 가져옵니다.",
      },
      {
        title: "심각도 분류",
        description: "임계값에 따라 알림 그룹을 나눕니다.",
      },
      {
        title: "알림 전송",
        description: "담당자에게 실시간 알림을 전달합니다.",
      },
    ],
    reviewList: [
      {
        id: "review-012",
        name: "유진",
        rating: 5,
        comment: "알림 분기 설정이 명확해서 바로 적용했습니다.",
      },
      {
        id: "review-013",
        name: "태우",
        rating: 4,
        comment: "로그 필터 설정만 바꾸면 바로 쓸 수 있어요.",
      },
    ],
    owned: false,
  },
];

const formatPrice = (price: number) =>
  price === 0 ? "무료" : `${price} 크레딧`;

const formatRating = (rating: number) => rating.toFixed(1);

export default async function PresetDetailPage({
  params,
}: PageProps<"/presets/[id]">) {
  const { id } = await params;
  const preset = presetDetails.find((item) => item.id === id);

  if (!preset) {
    notFound();
  }

  const purchaseLabel = preset.price === 0 ? "무료로 받기" : "구매하기";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/presets">마켓으로</Link>
            </Button>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {preset.category} 프리셋
              </p>
              <h1 className="text-2xl font-semibold">{preset.title}</h1>
              <p className="text-sm text-muted-foreground">
                {preset.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>평점 {formatRating(preset.rating)}</span>
              <span>리뷰 {preset.reviews}</span>
              <span>구매 {preset.purchases}</span>
              <span>업데이트 {preset.updatedAt}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/presets/purchased">내 프리셋</Link>
            </Button>
            <Button asChild>
              <Link href="/canvas">캔버스 열기</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>미리보기</CardTitle>
                <CardDescription>
                  캔버스에서 실행 흐름을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex aspect-video items-center justify-center rounded-lg border bg-background/70 text-sm text-muted-foreground">
                  캔버스 미리보기 준비 중
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>프리셋 소개</CardTitle>
                <CardDescription>주요 특징과 구성 요소</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {preset.summary}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {preset.highlights.map((highlight) => (
                    <div
                      key={highlight.title}
                      className="rounded-lg border bg-background/70 p-3"
                    >
                      <p className="text-sm font-medium">{highlight.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>워크플로우 구성</CardTitle>
                <CardDescription>
                  실행 순서를 단계별로 확인합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {preset.steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-3 rounded-lg border bg-background/70 p-3"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle>리뷰</CardTitle>
                    <CardDescription>구매자들의 사용 후기</CardDescription>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {formatRating(preset.rating)} / 5
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {preset.reviewList.map((review, index) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>
                          {review.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{review.name}</p>
                        <p className="text-xs text-muted-foreground">
                          평점 {review.rating}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                    {index < preset.reviewList.length - 1 ? (
                      <Separator />
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>가격 및 구매</CardTitle>
                <CardDescription>
                  프리셋은 크레딧으로 결제합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-3xl font-semibold">
                    {formatPrice(preset.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    구매 {preset.purchases} · 평점{" "}
                    {formatRating(preset.rating)}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">업데이트</span>
                    <span className="font-medium">{preset.updatedAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">난이도</span>
                    <span className="font-medium">{preset.difficulty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">예상 설치</span>
                    <span className="font-medium">
                      {preset.estimatedTime}
                    </span>
                  </div>
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
              <CardFooter className="flex flex-col items-stretch gap-2 border-t">
                {preset.owned ? (
                  <>
                    <Button variant="secondary" asChild>
                      <Link href="/canvas">캔버스에서 열기</Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      업데이트 확인
                    </Button>
                  </>
                ) : (
                  <>
                    <Button>{purchaseLabel}</Button>
                    <Button variant="outline" size="sm">
                      찜하기
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제작자</CardTitle>
                <CardDescription>프리셋을 만든 전문가</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>
                      {preset.author.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {preset.author.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preset.author.role}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {preset.author.bio}
                </p>
                <Button variant="outline" size="sm">
                  프로필 보기
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>프리셋 정보</CardTitle>
                <CardDescription>워크플로우 구성 요약</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">노드</span>
                  <span className="font-medium">{preset.nodes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">엣지</span>
                  <span className="font-medium">{preset.connections}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    연동 서비스
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preset.integrations.map((integration) => (
                      <span
                        key={integration}
                        className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

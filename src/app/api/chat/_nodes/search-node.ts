import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";

type GoogleSearchItem = {
  title: string;
  link: string;
  snippet: string;
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
};

export const searchNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const input = findSingleNodeInput({ state, config });
  if (!input) {
    throw new Error("검색 노드에 input이 주어지지 않았습니다.");
  }

  let searchResults: GoogleSearchItem[] = [];
  let errMessage: string = "";

  try {
    searchResults = await searxngSearch(input);
  } catch {
    errMessage = "메타검색 중 에러가 발생하였습니다.";
  }

  if (!searchResults.length) {
    try {
      searchResults = await googleSearch(input);
    } catch {
      errMessage = "구글 검색 중 에러가 발생하였습니다.";
    }
  }

  if (!searchResults.length) {
    try {
      searchResults = await braveSearch(input);
    } catch {
      errMessage = "Brave 검색 중 에러가 발생하였습니다.";
    }
  }

  if (!searchResults.length) {
    try {
      searchResults = await naverSearch(input);
    } catch {
      errMessage = "검색 중 에러가 발생하였습니다.";
    }
  }

  if (!searchResults.length && errMessage) {
    return { outputMap: { [nodeId]: errMessage } };
  }

  // 검색 결과를 요약한 메시지 생성
  const resultMessage =
    `검색 결과 (${searchResults.length}개):\n\n` +
    searchResults
      .map(
        (result: GoogleSearchItem, index: number) =>
          `${index + 1}. ${result.title}\n${result.snippet}\n${result.link}\n`,
      )
      .join("\n");

  return { outputMap: { [nodeId]: resultMessage } };
};

type SearxngResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
};

const searxngSearch = async (input: string): Promise<GoogleSearchItem[]> => {
  const baseUrl = process.env.SEARXNG_BASE_URL;

  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", input);
  url.searchParams.set("format", "json");
  url.searchParams.set("categories", "general");
  url.searchParams.set("language", "ko-KR");
  url.searchParams.set("pageno", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-API-Key": process.env.SEARXNG_API_KEY!,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SearXNG error: ${response.status} ${body}`);
  }

  const data: SearxngResponse = await response.json();

  return (
    data.results?.map((res) => ({
      title: (res.title ?? "").trim(),
      link: (res.url ?? "").trim(),
      snippet: (res.content ?? "").trim(),
    })) ?? []
  ).filter((res) => res.title && res.link);
};

const googleSearch = async (input: string) => {
  const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX;
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) {
    throw new Error("Google Search API 키가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    key: GOOGLE_SEARCH_API_KEY,
    cx: GOOGLE_SEARCH_CX,
    q: input,
    num: String(10),
    fields: "items(title,link,snippet),searchInformation(totalResults)",
  });

  const searchUrl = `https://www.googleapis.com/customsearch/v1?${params}`;
  const response = await fetch(searchUrl);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error("Google Search API error:" + response.status + errText);
  }

  const data: GoogleSearchResponse = await response.json();

  const searchResults =
    data.items?.map((item: GoogleSearchItem) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || [];

  return searchResults;
};

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
};

const braveSearch = async (input: string): Promise<GoogleSearchItem[]> => {
  const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
  if (!BRAVE_API_KEY) {
    throw new Error("Brave Search API 키가 설정되지 않았습니다.");
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", input);
  url.searchParams.set("count", "10"); // 결과 개수 제한

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave API error: ${response.status}`);
  }

  const data: BraveSearchResponse = await response.json();

  return (
    data.web?.results?.map((item) => ({
      title: item.title,
      link: item.url,
      snippet: item.description,
    })) || []
  );
};

type NaverBlogItem = {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string;
};

type NaverBlogResponse = {
  items: NaverBlogItem[];
};

const naverSearch = async (input: string) => {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("NAVER Search API 키가 설정되지 않았습니다.");
  }

  const url = new URL("https://openapi.naver.com/v1/search/blog");
  url.searchParams.set("query", input);
  url.searchParams.set("display", String(20));

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!response.ok) {
    throw new Error("NAVER Search API error:" + response.status);
  }

  const data: NaverBlogResponse = await response.json();

  const searchResults =
    data.items?.map((item: NaverBlogItem) => ({
      title: item.title,
      link: item.link,
      snippet: item.description,
    })) || [];

  return searchResults;
};

import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";

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
  const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY!;
  const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX!;
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) {
    throw new Error("Google Search API 키가 설정되지 않았습니다.");
  }

  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const input = findSingleNodeInput({ state, config });
  if (!input) {
    throw new Error("검색 노드에 input이 주어지지 않았습니다.");
  }

  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(input)}`;

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(
      `Google Search API 오류: ${response.status} ${response.statusText}`,
    );
  }

  const data: GoogleSearchResponse = await response.json();

  const searchResults =
    data.items?.map((item: GoogleSearchItem) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    })) || [];

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

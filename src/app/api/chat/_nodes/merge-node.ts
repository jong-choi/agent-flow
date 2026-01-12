import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";

/**
 * 머지 노드는 이전 노드의 출력값을 하나의 스트링으로 반환합니다.
 *
 * @param state - 상태 객체
 * @param config - 설정 객체
 * @returns `outputMap`의 자기 자신을 `input1\n\ninput2`와 같이 저장한 상태
 */
export const mergeNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  // 현재 id와 현재 상태를 가져온다
  const nodeId = config.metadata?.langgraph_node;
  const outputMap = state.outputMap;
  if (typeof nodeId !== "string") {
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  // 이전 노드들의 결과값을 inputs 객체로 저장한다
  const inputs: Record<string, string | null> = {};
  const inputChildren = state.inputTree[nodeId];
  if (!inputChildren) {
    throw new Error("병합 노드에 입력 트리가 없습니다.");
  }

  const inputChildrenEntries = Object.entries(inputChildren);
  inputChildrenEntries.forEach((entry) => {
    const [leftHandleName, inputNodeId] = entry;
    const output = outputMap[inputNodeId];
    inputs[leftHandleName] = output;
  });

  // 이전 노드들의 결과값을 하나의 문자열로 병합한다
  let result = "";
  const inputsEntries = Object.entries(inputs);
  inputsEntries.sort().forEach((entry) => {
    const output = entry[1];

    if (!output) {
      throw new Error(
        "병합 노드의 이전 노드 결과값이 null입니다. 이전 노드가 아직 실행중일 수 있습니다.",
      );
    }

    if (result) {
      result = result.concat("\n\n", output);
    } else {
      result = result.concat(output);
    }
  });

  // 상태에 결과를 저장한 후 반환한다
  outputMap[nodeId] = result;

  return { outputMap };
};

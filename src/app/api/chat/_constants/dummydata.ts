import { type Edge, type Node } from "@xyflow/react";
import { type FlowNodeData } from "@/db/query/sidebar-nodes";

export const dummaydata: {
  nodes: Array<Node<Omit<FlowNodeData, "createdAt"> & { createdAt: string }>>;
  edges: Array<Edge>;
} = {
  nodes: [
    {
      id: "d6e9f86b-65c2-4936-bcd1-b4db4385fc8e",
      type: "startNode",
      position: { x: -552.0609449919392, y: 46.20344952534711 },
      data: {
        label: "시작",
        description: "시작 노드",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: null,
        handle: {
          id: "07391a04-6e59-4425-b849-b93ae27aa8e8",
          nodeId: "e56d211a-5532-4622-b8ab-f074ca7e242e",
          targetCount: 0,
          sourceCount: null,
        },
        information: {
          id: "f57945fe-6a6e-41c5-b65e-74877661f84f",
          nodeId: "e56d211a-5532-4622-b8ab-f074ca7e242e",
          title: "시작 노드",
          summary: "워크플로우의 시작점입니다",
          description:
            "모든 워크플로우는 시작 노드에서 출발합니다. 이 노드는 전체 프로세스의 진입점 역할을 하며, 다른 노드들로 연결할 수 있습니다.",
          guides: [
            "캔버스에는 하나의 시작 노드만 배치할 수 있습니다",
            "시작 노드는 입력 연결을 받을 수 없습니다",
            "다음 단계로 연결하여 워크플로우를 구성하세요",
          ],
        },
      },
      measured: { width: 192, height: 62 },
      selected: false,
      dragging: false,
    },
    {
      id: "212b291c-9c82-4254-8b0d-f6367362ceea",
      type: "endNode",
      position: { x: 325.90354449961416, y: -51.33862480317253 },
      data: {
        label: "종료",
        description: "종료 노드",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: null,
        handle: {
          id: "2bada376-a10d-4d67-a489-3bc2d4884d72",
          nodeId: "2c319e09-89b6-4df8-b108-4e72dc346ead",
          targetCount: null,
          sourceCount: 0,
        },
        information: {
          id: "29dc19cc-d432-49d9-9383-628b871cb3e5",
          nodeId: "2c319e09-89b6-4df8-b108-4e72dc346ead",
          title: "종료 노드",
          summary: "워크플로우의 종착점입니다",
          description:
            "워크플로우의 최종 결과를 수집하는 노드입니다. 모든 실행 경로는 최종적으로 종료 노드에 도달해야 합니다.",
          guides: [
            "캔버스에는 하나의 종료 노드만 배치할 수 있습니다",
            "종료 노드는 출력 연결을 만들 수 없습니다",
            "여러 경로를 하나로 모아 종료할 수 있습니다",
          ],
        },
      },
      measured: { width: 192, height: 62 },
      selected: true,
      dragging: false,
    },
    {
      id: "02adbad9-6911-4ee0-adad-2aef9d6c73c3",
      type: "splitNode",
      position: { x: -584.6841799878854, y: -92.24379717153154 },
      data: {
        label: "분할",
        description: "하나의 입력을 분할",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: null,
        handle: {
          id: "b4e58abb-e946-41f9-a2e7-b3417b8f9cee",
          nodeId: "d9fdbfae-19be-43b4-9d16-a5fdf54608c1",
          targetCount: null,
          sourceCount: 3,
        },
        information: {
          id: "3aa9b1cb-f3f7-443b-a22b-4c9361a123d9",
          nodeId: "d9fdbfae-19be-43b4-9d16-a5fdf54608c1",
          title: "분할 노드",
          summary: "하나의 입력을 여러 출력으로 나눕니다",
          description:
            "하나의 입력을 받아서 3개의 동일한 출력으로 복제하는 노드입니다. 같은 데이터를 여러 경로로 동시에 처리하고 싶을 때 사용합니다.",
          guides: [
            "하나의 입력이 3개의 출력으로 복제됩니다",
            "각 출력은 독립적인 경로로 연결할 수 있습니다",
            "병렬 처리가 필요한 경우에 활용하세요",
          ],
        },
      },
      measured: { width: 192, height: 62 },
      selected: false,
      dragging: false,
    },
    {
      id: "b4493f86-565f-4732-b3a9-79365187b244",
      type: "promptNode",
      position: { x: -500.389946280479, y: -262.5664596603523 },
      data: {
        label: "프롬프트",
        description: "텍스트를 입력",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: {
          id: "3a5fd663-cd5c-4745-a925-815a7b0cefcb",
          nodeId: "a23c4d6c-c55b-4538-9f04-40d0ee82d0ba",
          type: "dialog",
          label: "프롬프트 수정",
          placeholder: null,
          value: "{input}을 검색해줘",
          optionsSource: null,
          dialogTitle: "프롬프트 입력",
          dialogDescription:
            "{input}으로 이전 노드의 결과물을 받을 수 있습니다",
        },
        handle: null,
        information: {
          id: "cb778900-26dc-4228-bc9f-c9dcf24976a8",
          nodeId: "a23c4d6c-c55b-4538-9f04-40d0ee82d0ba",
          title: "프롬프트 노드",
          summary: "사용자 정의 텍스트를 생성합니다",
          description:
            "원하는 텍스트를 직접 작성할 수 있는 노드입니다. 이전 노드의 출력을 {input} 변수로 받아 활용할 수 있습니다.",
          guides: [
            "{input}을 사용하면 이전 노드의 결과를 받을 수 있습니다",
            "고정된 텍스트와 변수를 조합하여 사용하세요",
            "채팅 노드에 전달할 명령어를 구성할 때 유용합니다",
          ],
        },
      },
      measured: { width: 192, height: 106 },
      selected: false,
      dragging: false,
    },
    {
      id: "52b10469-42f1-4dbc-a1c8-3aadb9770ec4",
      type: "chatNode",
      position: { x: -257.9616138213198, y: -272.345385298786 },
      data: {
        label: "채팅",
        description: "응답 생성 노드",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: {
          id: "260d021f-cf74-4f4f-8b41-a657236ab793",
          nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
          type: "select",
          label: "Agent",
          placeholder: "Agent를 선택하기",
          value: null,
          optionsSource: "ai_models",
          dialogTitle: null,
          dialogDescription: null,
          options: [
            {
              id: "b49780ad-8b36-49e9-807c-2d8e3a827981",
              value: "gemma-3-1b-it",
            },
            {
              id: "af8dd08b-86a0-4f54-82fe-38eca1d4d994",
              value: "gemma-3-4b-it",
            },
            {
              id: "993e770e-be0c-4d11-aa68-808b85c5d663",
              value: "gemma-3-12b-it",
            },
            {
              id: "b105b663-0c65-4bff-8748-1d26d61345fd",
              value: "gemma-3-27b-it",
            },
          ],
        },
        handle: null,
        information: {
          id: "7e1ae09f-c406-40c3-8ba5-f15190686396",
          nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
          title: "채팅 노드",
          summary: "AI 에이전트가 응답을 생성합니다",
          description:
            "선택한 AI 에이전트를 호출하여 입력받은 내용에 대한 응답을 생성하는 노드입니다. 다양한 AI 모델 중에서 선택할 수 있습니다.",
          guides: [
            "사용할 AI 에이전트를 선택하세요",
            "프롬프트 노드와 함께 사용하면 더 정교한 지시사항을 전달할 수 있습니다",
            "생성된 응답은 다음 노드로 전달됩니다",
          ],
        },
      },
      measured: { width: 192, height: 106 },
      selected: false,
      dragging: false,
    },
    {
      id: "d68fef84-f540-4cb8-97d0-ff0351f8a220",
      type: "searchNode",
      position: { x: -52.14130100586437, y: -298.04871238561617 },
      data: {
        label: "검색",
        description: "구글 검색 노드",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: null,
        handle: null,
        information: {
          id: "92f64213-a0bb-4bb9-808b-46d7c84035c1",
          nodeId: "79c9c885-a910-4aeb-88cc-55c1ff27d382",
          title: "검색 노드",
          summary: "구글 검색을 수행합니다",
          description:
            "입력받은 검색어로 구글 검색을 실행하는 노드입니다. 쉼표로 구분하여 여러 검색어를 동시에 처리할 수 있습니다.",
          guides: [
            "하나의 검색어를 입력하거나",
            "쉼표로 구분하여 여러 검색어를 한 번에 처리할 수 있습니다",
            "검색 결과는 텍스트 형태로 다음 노드에 전달됩니다",
          ],
        },
      },
      measured: { width: 192, height: 62 },
      selected: false,
      dragging: false,
    },
    {
      id: "890bbea7-7cfe-4478-abbc-66503d38d24b",
      type: "mergeNode",
      position: { x: -234.48550966753146, y: -74.25642556087217 },
      data: {
        label: "병합",
        description: "여러 입력을 병합",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: null,
        handle: {
          id: "b3397c33-f1bf-4e01-ac41-f5c838db1a4f",
          nodeId: "486ea796-6ea6-41f4-bab7-06157a4f4131",
          targetCount: 3,
          sourceCount: null,
        },
        information: {
          id: "770b2c1a-1f44-40ac-82bc-7ff4fff0ba43",
          nodeId: "486ea796-6ea6-41f4-bab7-06157a4f4131",
          title: "병합 노드",
          summary: "여러 입력을 하나로 합칩니다",
          description:
            "최대 3개의 입력 연결을 받아서 하나의 텍스트로 결합하는 노드입니다. 분기된 여러 경로를 다시 하나로 모을 때 사용합니다.",
          guides: [
            "최대 3개의 입력을 연결할 수 있습니다",
            "모든 입력이 도착하면 하나의 텍스트로 합쳐집니다",
            "분할 노드와 함께 사용하여 병렬 처리 후 결과를 모을 수 있습니다",
          ],
        },
      },
      measured: { width: 192, height: 62 },
      selected: false,
      dragging: false,
    },
    {
      id: "33f14f6c-5f9d-4d09-b577-1016ccd298ed",
      type: "chatNode",
      position: { x: -11.96318278081814, y: -123.83037328369234 },
      data: {
        label: "채팅",
        description: "응답 생성 노드",
        createdAt: "2025-12-31T15:39:20.099Z",
        content: {
          id: "260d021f-cf74-4f4f-8b41-a657236ab793",
          nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
          type: "select",
          label: "Agent",
          placeholder: "Agent를 선택하기",
          value: null,
          optionsSource: "ai_models",
          dialogTitle: null,
          dialogDescription: null,
          options: [
            {
              id: "b49780ad-8b36-49e9-807c-2d8e3a827981",
              value: "gemma-3-1b-it",
            },
            {
              id: "af8dd08b-86a0-4f54-82fe-38eca1d4d994",
              value: "gemma-3-4b-it",
            },
            {
              id: "993e770e-be0c-4d11-aa68-808b85c5d663",
              value: "gemma-3-12b-it",
            },
            {
              id: "b105b663-0c65-4bff-8748-1d26d61345fd",
              value: "gemma-3-27b-it",
            },
          ],
        },
        handle: null,
        information: {
          id: "7e1ae09f-c406-40c3-8ba5-f15190686396",
          nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
          title: "채팅 노드",
          summary: "AI 에이전트가 응답을 생성합니다",
          description:
            "선택한 AI 에이전트를 호출하여 입력받은 내용에 대한 응답을 생성하는 노드입니다. 다양한 AI 모델 중에서 선택할 수 있습니다.",
          guides: [
            "사용할 AI 에이전트를 선택하세요",
            "프롬프트 노드와 함께 사용하면 더 정교한 지시사항을 전달할 수 있습니다",
            "생성된 응답은 다음 노드로 전달됩니다",
          ],
        },
      },
      measured: { width: 192, height: 106 },
      selected: false,
      dragging: false,
    },
  ],
  edges: [
    {
      id: "xy-edge__d6e9f86b-65c2-4936-bcd1-b4db4385fc8esource-02adbad9-6911-4ee0-adad-2aef9d6c73c3target",
      source: "d6e9f86b-65c2-4936-bcd1-b4db4385fc8e",
      sourceHandle: "source",
      target: "02adbad9-6911-4ee0-adad-2aef9d6c73c3",
      targetHandle: "target",
    },
    {
      id: "xy-edge__02adbad9-6911-4ee0-adad-2aef9d6c73c3source0-b4493f86-565f-4732-b3a9-79365187b244target",
      source: "02adbad9-6911-4ee0-adad-2aef9d6c73c3",
      sourceHandle: "source0",
      target: "b4493f86-565f-4732-b3a9-79365187b244",
      targetHandle: "target",
    },
    {
      id: "xy-edge__b4493f86-565f-4732-b3a9-79365187b244source-52b10469-42f1-4dbc-a1c8-3aadb9770ec4target",
      source: "b4493f86-565f-4732-b3a9-79365187b244",
      sourceHandle: "source",
      target: "52b10469-42f1-4dbc-a1c8-3aadb9770ec4",
      targetHandle: "target",
    },
    {
      id: "xy-edge__52b10469-42f1-4dbc-a1c8-3aadb9770ec4source-d68fef84-f540-4cb8-97d0-ff0351f8a220target",
      source: "52b10469-42f1-4dbc-a1c8-3aadb9770ec4",
      sourceHandle: "source",
      target: "d68fef84-f540-4cb8-97d0-ff0351f8a220",
      targetHandle: "target",
    },
    {
      id: "xy-edge__02adbad9-6911-4ee0-adad-2aef9d6c73c3source1-890bbea7-7cfe-4478-abbc-66503d38d24btarget1",
      source: "02adbad9-6911-4ee0-adad-2aef9d6c73c3",
      sourceHandle: "source1",
      target: "890bbea7-7cfe-4478-abbc-66503d38d24b",
      targetHandle: "target1",
    },
    {
      id: "xy-edge__d68fef84-f540-4cb8-97d0-ff0351f8a220source-890bbea7-7cfe-4478-abbc-66503d38d24btarget0",
      source: "d68fef84-f540-4cb8-97d0-ff0351f8a220",
      sourceHandle: "source",
      target: "890bbea7-7cfe-4478-abbc-66503d38d24b",
      targetHandle: "target0",
    },
    {
      id: "xy-edge__890bbea7-7cfe-4478-abbc-66503d38d24bsource-33f14f6c-5f9d-4d09-b577-1016ccd298edtarget",
      source: "890bbea7-7cfe-4478-abbc-66503d38d24b",
      sourceHandle: "source",
      target: "33f14f6c-5f9d-4d09-b577-1016ccd298ed",
      targetHandle: "target",
    },
    {
      id: "xy-edge__33f14f6c-5f9d-4d09-b577-1016ccd298edsource-212b291c-9c82-4254-8b0d-f6367362ceeatarget",
      source: "33f14f6c-5f9d-4d09-b577-1016ccd298ed",
      sourceHandle: "source",
      target: "212b291c-9c82-4254-8b0d-f6367362ceea",
      targetHandle: "target",
    },
  ],
};

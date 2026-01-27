const workflowNodes = [
  {
    id: "1083c3e6-1ce0-40fa-bd59-1c591fc0f586",
    type: "startNode",
    posX: -720,
    posY: 16,
    label: "시작",
    description: "시작 노드",
    value: null,
    targetCount: 0,
    sourceCount: null,
  },
  {
    id: "1083c3e6-1ce0-40fa-bd59-1c591fc0f586",
    type: "startNode",
    posX: 560,
    posY: -32,
    label: "종료",
    description: "종료 노드",
    value: null,
    targetCount: null,
    sourceCount: 0,
  },
];

const nodes = [
  {
    id: "1083c3e6-1ce0-40fa-bd59-1c591fc0f586",
    type: "startNode",
    position: {
      x: -720,
      y: 16,
    },
    data: {
      label: "시작",
      description: "시작 노드",
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
    measured: {
      width: 192,
      height: 62,
    },
    selected: false,
    dragging: false,
  },
  {
    id: "745c60ab-0a9a-484f-9c64-2b1bdb117ac0",
    type: "endNode",
    position: {
      x: 560,
      y: -32,
    },
    data: {
      label: "종료",
      description: "종료 노드",
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
    measured: {
      width: 192,
      height: 62,
    },
    selected: true,
    dragging: false,
  },
  {
    id: "73467c52-52a2-4ff3-a9ca-44c19e74a393",
    type: "splitNode",
    position: {
      x: -512,
      y: 16,
    },
    data: {
      label: "분할",
      description: "하나의 입력을 분할",
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
    measured: {
      width: 192,
      height: 62,
    },
    selected: false,
    dragging: false,
  },
  {
    id: "34386b9c-1d3c-4c8e-879e-1c7578544523",
    type: "promptNode",
    position: {
      x: -320,
      y: -96,
    },
    data: {
      label: "프롬프트",
      description: "텍스트를 입력",
      content: {
        id: "3a5fd663-cd5c-4745-a925-815a7b0cefcb",
        nodeId: "a23c4d6c-c55b-4538-9f04-40d0ee82d0ba",
        type: "dialog",
        label: "프롬프트 수정",
        placeholder: null,
        value: "{input}\n\n위 사용자 요청에 걸맞는 검색어 하나를 반환한다.",
        optionsSource: null,
        dialogTitle: "프롬프트 입력",
        dialogDescription: "{input}으로 이전 노드의 결과물을 받을 수 있습니다",
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
    measured: {
      width: 192,
      height: 106,
    },
    selected: false,
  },
  {
    id: "1f8ed470-9d4a-4359-8f77-0aa2a5c950b9",
    type: "chatNode",
    position: {
      x: -112,
      y: -96,
    },
    data: {
      label: "채팅",
      description: "응답 생성 노드",
      content: {
        id: "260d021f-cf74-4f4f-8b41-a657236ab793",
        nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
        type: "select",
        label: "Agent",
        placeholder: "Agent를 선택하기",
        value: "gemma-3-1b-it",
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
    measured: {
      width: 192,
      height: 106,
    },
    selected: false,
    dragging: false,
  },
  {
    id: "e3976e67-0a6b-4eff-9f69-6cdf6be2c18c",
    type: "mergeNode",
    position: {
      x: 112,
      y: -16,
    },
    data: {
      label: "병합",
      description: "여러 입력을 병합",
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
    measured: {
      width: 192,
      height: 62,
    },
    selected: false,
    dragging: false,
  },
  {
    id: "28bee9a3-c1e9-4968-8b2c-bb9f081aa139",
    type: "chatNode",
    position: {
      x: 320,
      y: -48,
    },
    data: {
      label: "채팅",
      description: "응답 생성 노드",
      content: {
        id: "260d021f-cf74-4f4f-8b41-a657236ab793",
        nodeId: "ad62cf9b-441c-4ddf-b0b0-9c497f3ed0f3",
        type: "select",
        label: "Agent",
        placeholder: "Agent를 선택하기",
        value: "gemma-3-1b-it",
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
    measured: {
      width: 192,
      height: 106,
    },
    selected: false,
    dragging: false,
  },
];

const edges = [
  {
    id: "xy-edge__1083c3e6-1ce0-40fa-bd59-1c591fc0f586source-73467c52-52a2-4ff3-a9ca-44c19e74a393target",
    source: "1083c3e6-1ce0-40fa-bd59-1c591fc0f586",
    target: "73467c52-52a2-4ff3-a9ca-44c19e74a393",
    sourceHandle: "source",
    targetHandle: "target",
  },
  {
    id: "xy-edge__73467c52-52a2-4ff3-a9ca-44c19e74a393source0-34386b9c-1d3c-4c8e-879e-1c7578544523target",
    source: "73467c52-52a2-4ff3-a9ca-44c19e74a393",
    target: "34386b9c-1d3c-4c8e-879e-1c7578544523",
    sourceHandle: "source0",
    targetHandle: "target",
  },
  {
    id: "xy-edge__34386b9c-1d3c-4c8e-879e-1c7578544523source-1f8ed470-9d4a-4359-8f77-0aa2a5c950b9target",
    source: "34386b9c-1d3c-4c8e-879e-1c7578544523",
    target: "1f8ed470-9d4a-4359-8f77-0aa2a5c950b9",
    sourceHandle: "source",
    targetHandle: "target",
  },
  {
    id: "xy-edge__1f8ed470-9d4a-4359-8f77-0aa2a5c950b9source-e3976e67-0a6b-4eff-9f69-6cdf6be2c18ctarget0",
    source: "1f8ed470-9d4a-4359-8f77-0aa2a5c950b9",
    target: "e3976e67-0a6b-4eff-9f69-6cdf6be2c18c",
    sourceHandle: "source",
    targetHandle: "target0",
  },
  {
    id: "xy-edge__73467c52-52a2-4ff3-a9ca-44c19e74a393source1-e3976e67-0a6b-4eff-9f69-6cdf6be2c18ctarget1",
    source: "73467c52-52a2-4ff3-a9ca-44c19e74a393",
    target: "e3976e67-0a6b-4eff-9f69-6cdf6be2c18c",
    sourceHandle: "source1",
    targetHandle: "target1",
  },
  {
    id: "xy-edge__e3976e67-0a6b-4eff-9f69-6cdf6be2c18csource-28bee9a3-c1e9-4968-8b2c-bb9f081aa139target",
    source: "e3976e67-0a6b-4eff-9f69-6cdf6be2c18c",
    target: "28bee9a3-c1e9-4968-8b2c-bb9f081aa139",
    sourceHandle: "source",
    targetHandle: "target",
  },
  {
    id: "xy-edge__28bee9a3-c1e9-4968-8b2c-bb9f081aa139source-745c60ab-0a9a-484f-9c64-2b1bdb117ac0target",
    source: "28bee9a3-c1e9-4968-8b2c-bb9f081aa139",
    target: "745c60ab-0a9a-484f-9c64-2b1bdb117ac0",
    sourceHandle: "source",
    targetHandle: "target",
  },
];

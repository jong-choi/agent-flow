const message = {
  meta: {
    workflowsTitle: "워크플로우",
    workflowFallbackTitle: "워크플로우",
    canvasTitle: "캔버스",
  },
  listPage: {
    heading: "내 워크플로우",
    description: "플로우 캔버스에서 만든 그래프입니다.",
    newWorkflow: "새 워크플로우",
  },
  listView: {
    emptyTitle: "아직 워크플로우가 없습니다",
    emptyDescription: "캔버스에서 첫 워크플로우를 만들어 보세요.",
    createWorkflow: "워크플로우 만들기",
    detail: "상세보기",
  },
  detailPage: {
    backToList: "목록으로",
    noDescription: "설명이 없습니다.",
    updatedAt: "최근 업데이트 {date}",
    openInCanvas: "캔버스에서 열기",
  },
  dataView: {
    graphPreviewTitle: "그래프 프리뷰",
    nodeListTitle: "노드 목록",
    nodeListDescription: "워크플로우에 포함된 노드를 확인합니다.",
    noNodes: "노드가 아직 없습니다.",
    noNodeDescription: "설명이 없습니다.",
    summaryTitle: "워크플로우 요약",
    summaryDescription: "그래프 통계와 기록",
    nodeLabel: "노드",
    edgeLabel: "엣지",
  },
  canvas: {
    header: {
      newWorkflow: "새 워크플로우",
      noDescription: "설명이 기재되지 않았습니다",
    },
    actions: {
      startChat: "채팅하기",
      loadPreset: "프리셋 불러오기",
      save: "저장",
    },
    start: {
      errors: {
        createFailed: "채팅을 생성하지 못했습니다.",
        missingThreadId: "채팅 ID가 발급되지 않았습니다.",
        fallback: "채팅 시작에 실패했습니다.",
      },
    },
    save: {
      validation: {
        titleRequired: "워크플로우 이름을 입력해주세요.",
      },
      dialog: {
        title: "워크플로우 저장",
        titleCreate: "워크플로우 저장",
        titleEdit: "워크플로우 수정 저장",
        description: "이름과 설명을 입력한 뒤 저장하세요.",
        descriptionCreate: "이름과 설명을 입력한 뒤 저장하세요.",
        descriptionEdit: "현재 워크플로우 정보를 확인하고 수정 저장하세요.",
        nameLabel: "이름",
        namePlaceholder: "워크플로우 이름",
        descriptionLabel: "설명",
        descriptionPlaceholder: "워크플로우 설명",
        descriptionLimit: "최대 140자까지 입력할 수 있어요.",
        close: "닫기",
        submit: "저장",
        submitCreate: "저장",
        submitEdit: "수정",
      },
      toast: {
        success: "저장되었습니다.",
      },
      errors: {
        saveFailed: "워크플로우 저장에 실패했습니다.",
        fallback: "워크플로우 저장 실패",
      },
    },
    loadPreset: {
      dialog: {
        title: "프리셋 불러오기",
        description: "구매했거나 만든 프리셋을 현재 캔버스에 추가할 수 있어요.",
        searchPlaceholder: "프리셋 검색 (제목)",
      },
      empty: {
        noOwned: "보유한 프리셋이 없습니다.",
        cycleBlocked: "이 워크플로우로 만든 프리셋은 불러올 수 없습니다.",
        noMatch: "조건에 맞는 프리셋이 없습니다.",
      },
      toast: {
        appended: "프리셋을 캔버스에 추가했어요.",
      },
      errors: {
        noNodes: "프리셋에 추가할 노드가 없습니다.",
        loadFailed: "프리셋 불러오기 실패",
        libraryLoadFailed: "프리셋 목록 로딩 실패",
        loginRequired: "로그인이 필요합니다.",
      },
    },
    node: {
      savedToast: "저장되었습니다.",
      editDialogSrOnly: "노드 수정 다이얼로그",
      close: "닫기",
      save: "저장하기",
      delete: {
        ariaLabel: "노드 삭제",
        title: "노드를 삭제하시겠습니까?",
        description: "삭제하려면 “삭제”를 선택해 주세요.",
        cancel: "취소",
        confirm: "삭제",
      },
    },
    document: {
      create: {
        button: "새 문서로 연결",
        successToast: "문서가 연결되었습니다.",
        failedToast: "문서 생성에 실패하였습니다.",
      },
      reference: {
        triggerLabel: "문서 연결",
        unlink: "연결 해제",
        dialogTitle: "문서 선택",
        close: "닫기",
      },
      picker: {
        searchPlaceholder: "문서 제목으로 검색",
        loading: "불러오는 중...",
        noDocuments: "문서가 없습니다.",
        noSearchResults: "검색 결과가 없습니다.",
        emptyContent: "내용이 없습니다.",
      },
    },
    nodePanel: {
      validation: {
        nameRequired: "이름을 입력해주세요",
        handleRange: "0 이상, 5이하의 정수를 입력해주세요",
      },
      labels: {
        agent: "Agent",
        action: "동작",
        promptEdit: "프롬프트 수정",
        promptDialogTitle: "프롬프트 입력",
        selectValue: "선택 값",
        dialogValue: "대화 값",
        name: "이름",
        description: "설명",
        documentReference: "문서 연결",
        handles: "핸들",
        targetInputs: "타깃 입력",
        sourceOutputs: "소스 출력",
        credits: "크레딧",
      },
      placeholders: {
        name: "노드 이름",
        description: "설명을 입력하세요...",
        action: "동작 선택",
        agent: "Agent를 선택하기",
        promptInputHint: "'{input}'으로 이전 노드의 결과물을 받을 수 있습니다",
      },
      save: "저장하기",
    },
  },
};

export default message;

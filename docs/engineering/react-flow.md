## ReactFlowProvider

- @xyflow/react에 zustand 상태를 주입하는 프로바이더
- ReactFlow의 훅들을 호출하기 위해선 미리 감싸주어야 한다.

```tsx
// src/app/flow/page.tsx
<CanvasContainer>
  <ReactFlowProvider>
    <FlowApp />
  </ReactFlowProvider>
</CanvasContainer>
```

## useNodesState, useEdgesState

- node와 edge의 상태를 관리하기 위한 훅
- 각각 nodes, setNodes, onChange를 반환한다.
- onChange 함수는 위치 등을 변경할 때 사용한다.

```tsx
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
```

## useReactFlow

- `useReactFlow`는 `ReactFlowIstance`를 반환한다. [공식문서 - ReactFlowInstance](https://reactflow.dev/api-reference/types/react-flow-instance)
- `fitView({...options})` : 노드 전체가 캔버스에 보이도록 조정하는 메서드
- `screenToFlowPosition` / `flowToScreenPosition` : 화면상 좌표를 캔버스 내 좌표로 파싱하는 메서드 / 캔버스 내 좌표를 화면상 좌표로 파싱하는 메서드

## ReactFlow

- 반환받은 상태를 props로 넘겨서 캔버스를 렌더링한다.
- `colorMode`는 `system | dark | light`의 값을 가진다.

```tsx
<ReactFlow
  colorMode={colorMode}
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={handleAddEdge}
  nodeTypes={NODE_TYPE}
  fitView
  fitViewOptions={{ padding: 0.2 }}
  proOptions={{ hideAttribution: true }}
>
  <Background gap={16} size={1} color="#e5e7eb" />
  <Controls position="bottom-left" />
</ReactFlow>
```

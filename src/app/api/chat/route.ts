import { dummaydata } from "@/app/api/chat/_constants/dummydata";
import { buildStateGraph } from "@/app/api/chat/_engines/build-state-graph";

const serializeDrawableGraph = (drawable: {
  nodes: Record<
    string,
    { id: string; name: string; metadata?: Record<string, unknown> }
  >;
  edges: Array<{
    source: string;
    target: string;
    data?: string;
    conditional?: boolean;
  }>;
}) => ({
  nodes: Object.values(drawable.nodes).map((node) => ({
    id: node.id,
    name: node.name,
    metadata: node.metadata ?? null,
  })),
  edges: drawable.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    data: edge.data,
    conditional: edge.conditional,
  })),
});

export async function GET() {
  const { graph, inputTree } = buildStateGraph(
    dummaydata.nodes,
    dummaydata.edges,
  );

  const compiled = graph.compile();
  const result = await compiled.invoke({ outputMap: {}, inputTree });
  const drawable = await compiled.getGraphAsync();

  return Response.json({
    result,
    graph: serializeDrawableGraph(drawable),
  });
}

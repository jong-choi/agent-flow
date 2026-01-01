import { cacheLife, cacheTag } from "next/cache";
import { getActiveAiModels } from "@/db/query/ai-models";
import {
  type SidebarNodeData,
  getSidebarNodes,
} from "@/db/query/sidebar-nodes";
import { SidebarItemCard } from "@/features/canvas/components/sidebar/sidebar-item-card";

export async function SidebarContent() {
  "use cache";
  cacheTag("sidebar-nodes", "ai-models");
  cacheLife("weeks");

  const flowNodeList: SidebarNodeData[] = await getSidebarNodes();

  for (const node of flowNodeList) {
    if (node.content?.type === "select") {
      if (node.content.optionsSource === "ai_models") {
        const aiModels = await getActiveAiModels();
        node.content.options = aiModels.map((aiModel) => ({
          id: aiModel.id,
          value: aiModel.modelId,
        }));
      }
    }
  }

  return (
    <>
      {flowNodeList.map((item) => (
        <SidebarItemCard item={item} key={item.id} />
      ))}
    </>
  );
}

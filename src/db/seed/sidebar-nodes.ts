import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  type SidebarNodeContentInsert,
  type SidebarNodeHandleInsert,
  type SidebarNodeInformationInsert,
  type SidebarNodeInsert,
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodeInformation,
  sidebarNodes,
} from "@/db/schema";
import { sidebarNodesData } from "@/features/canvas/constants/node-seed-data";

export const seedSidebarNodes = async () => {
  await db.transaction(async (tx) => {
    for (const raw of sidebarNodesData) {
      const { type, label, description, icon, backgroundColor, order } = raw;
      const nodeUpsert: SidebarNodeInsert = {
        type,
        label,
        description,
        icon,
        backgroundColor,
        order,
      };

      const [node] = await tx
        .insert(sidebarNodes)
        .values(nodeUpsert)
        .onConflictDoUpdate({
          target: sidebarNodes.label,
          set: {
            type,
            description,
            icon,
            backgroundColor,
            order,
          },
        })
        .returning({ id: sidebarNodes.id });

      const nodeId = node.id;

      if (raw.content === null) {
        await tx
          .delete(sidebarNodeContents)
          .where(eq(sidebarNodeContents.nodeId, nodeId));
      } else {
        const content = raw.content;
        const contentInsert: SidebarNodeContentInsert = { nodeId, ...content };

        await tx
          .insert(sidebarNodeContents)
          .values(contentInsert)
          .onConflictDoUpdate({
            target: sidebarNodeContents.nodeId,
            set: content,
          });
      }

      if (raw.handle === null) {
        await tx
          .delete(sidebarNodeHandles)
          .where(eq(sidebarNodeHandles.nodeId, nodeId));
      } else {
        const handle = raw.handle;

        const handleInsert: SidebarNodeHandleInsert = {
          nodeId,
          targetCount: handle.target?.count,
          sourceCount: handle.source?.count,
        };

        await tx
          .insert(sidebarNodeHandles)
          .values(handleInsert)
          .onConflictDoUpdate({
            target: sidebarNodeHandles.nodeId,
            set: {
              targetCount: handleInsert.targetCount,
              sourceCount: handleInsert.sourceCount,
            },
          });
      }

      if (raw.information) {
        const informationInsert: SidebarNodeInformationInsert = {
          nodeId,
          ...raw.information,
        };

        await tx
          .insert(sidebarNodeInformation)
          .values(informationInsert)
          .onConflictDoUpdate({
            target: sidebarNodeInformation.nodeId,
            set: {
              ...raw.information,
            },
          });
      }
    }
  });
};

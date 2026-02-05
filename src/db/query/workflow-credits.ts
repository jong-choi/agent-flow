"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { aiModels } from "@/db/schema/ai-models";
import { workflowNodes, workflows } from "@/db/schema/workflows";

/**
 * 워크플로우 실행 시, 채팅 노드 기준 예상 크레딧 소모량을 반환한다.
 * - 계산 방식: workflow_nodes 중 chatNode의 modelId(value)에 매칭되는 ai_models.price 합산
 * - ai_models.price가 null이거나 modelId가 매칭되지 않으면 0으로 처리
 */
export const getOwnedWorkflowChatCreditEstimate = async (workflowId: string) => {
  const userId = await getUserId();

  const [workflow] = await db
    .select({ ownerId: workflows.ownerId })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  if (!workflow) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }

  if (workflow.ownerId !== userId) {
    throw new Error("워크플로우에 대한 접근 권한이 없습니다.");
  }

  const totalSql = sql<number>`
    coalesce(sum(coalesce(${aiModels.price}, 0)), 0)
  `.mapWith(Number);

  const [row] = await db
    .select({ total: totalSql })
    .from(workflowNodes)
    .leftJoin(aiModels, eq(workflowNodes.value, aiModels.modelId))
    .where(
      and(eq(workflowNodes.workflowId, workflowId), eq(workflowNodes.type, "chatNode")),
    )
    .limit(1);

  return row?.total ?? 0;
};


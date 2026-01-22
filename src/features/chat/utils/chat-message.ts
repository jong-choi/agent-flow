export type ClientChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | null;
};

type MessageConstructorParams =
  | string
  | { id?: string; createdAt?: string; content: string };

const createClientMessage = (
  role: "user" | "assistant",
  params: MessageConstructorParams,
): ClientChatMessage => {
  if (typeof params === "string") {
    const content = params;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    return { id, role, content, createdAt };
  }

  const content = params.content;
  const id = params.id ?? crypto.randomUUID();
  const createdAt = params.createdAt ?? new Date().toISOString();

  return { id, role, content, createdAt };
};

export const createAIMessage = (params: MessageConstructorParams) => {
  return createClientMessage("assistant", params);
};

export const createHumanMessage = (params: MessageConstructorParams) => {
  return createClientMessage("user", params);
};

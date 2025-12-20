import { ReactFlowProvider } from "@xyflow/react";

type CanvasLayout = {
  children: React.ReactNode;
};

export default function CanvasLayout({ children }: CanvasLayout) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

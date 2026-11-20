export type NodeExecutionStatus = "idle" | "running" | "waiting" | "success" | "error";

export type CanvasNode = {
  id: string;
  type: "creative";
  position: { x: number; y: number };
  data: {
    nodeType: "text" | "image" | "video" | "reference";
    title: string;
    status: NodeExecutionStatus;
    textContent: string;
    imageUrl?: string;
  };
};

export type WorkflowEdge = { id: string; source: string; target: string };
export type CanvasSnapshot = {
  version: 1;
  projectName: string;
  nodes: CanvasNode[];
  edges: WorkflowEdge[];
};

export function parseSnapshot(value: unknown): CanvasSnapshot {
  if (!value || typeof value !== "object") throw new Error("Invalid snapshot");
  const snapshot = value as CanvasSnapshot;
  if (snapshot.version !== 1 || typeof snapshot.projectName !== "string" || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) throw new Error("Invalid snapshot structure");
  const ids = new Set<string>();
  for (const node of snapshot.nodes) {
    if (!node || typeof node.id !== "string" || !node.id || ids.has(node.id) || node.type !== "creative" || !Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y) || !node.data || !["text", "image", "video", "reference"].includes(node.data.nodeType) || typeof node.data.title !== "string" || typeof node.data.textContent !== "string" || !["idle", "running", "waiting", "success", "error"].includes(node.data.status)) throw new Error("Invalid or duplicate node");
    if (node.data.imageUrl && !node.data.imageUrl.startsWith("/samples/")) throw new Error("Only bundled sample images are allowed in starter snapshots");
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of snapshot.edges) {
    if (!edge || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) || !ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) throw new Error("Invalid edge");
    edgeIds.add(edge.id);
  }
  return structuredClone(snapshot);
}

export const initialSnapshot: CanvasSnapshot = {
  version: 1,
  projectName: "B1 订单售后退款",
  nodes: [
    { id: "intake", type: "creative", position: { x: 40, y: 150 }, data: { nodeType: "text", title: "1 受理", status: "idle", textContent: "订单 SO-10482。客户要求全额退款。需求版本 v1。" } },
    { id: "memory", type: "creative", position: { x: 380, y: 40 }, data: { nodeType: "text", title: "2 长期记忆", status: "idle", textContent: "只读取该客户的历史偏好与投诉记录。制度文档不写入记忆。" } },
    { id: "policy", type: "creative", position: { x: 380, y: 260 }, data: { nodeType: "text", title: "3 政策检索", status: "idle", textContent: "检索售后制度。结果必须带来源、版本和适用范围。过期或被删除的条款不能当依据。" } },
    { id: "plan", type: "creative", position: { x: 740, y: 150 }, data: { nodeType: "text", title: "4 方案", status: "idle", textContent: "等记忆和政策都返回后再出方案。超过制度上限则记为冲突并阻塞，不进入退款。" } },
    { id: "cashier", type: "creative", position: { x: 1080, y: 150 }, data: { nodeType: "text", title: "5 退款执行", status: "idle", textContent: "模拟退款。必须有限定订单号和金额的审批。需求改版后，旧审批作废。同一笔退款不得执行两次。" } },
  ],
  edges: [
    { id: "intake-memory", source: "intake", target: "memory" },
    { id: "intake-policy", source: "intake", target: "policy" },
    { id: "memory-plan", source: "memory", target: "plan" },
    { id: "policy-plan", source: "policy", target: "plan" },
    { id: "plan-cashier", source: "plan", target: "cashier" },
  ],
};
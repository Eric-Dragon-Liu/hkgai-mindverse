import { parseSnapshot } from "../canvas.ts";
import {
  LIMITS, checkpoint, redact, searchDocuments, visibleMemories,
  type Approval, type Evidence, type Faults, type MemoryRecord, type Plan, type RoleId, type RunRecord, type StepRecord, type Store, type ToolName,
} from "./store.ts";

const ROLE_DEPS: Record<RoleId, RoleId[]> = {
  planner: [],
  researcher: ["planner"],
  archivist: ["planner"],
  reviewer: ["researcher", "archivist"],
  producer: ["reviewer"],
};

const SHOTS = ["全景", "中景", "近景"];

function step(run: RunRecord, id: RoleId) {
  const found = run.steps.find((item) => item.id === id);
  if (!found) throw new Error(`缺少角色 ${id}`);
  return found;
}

function stamp(run: RunRecord) {
  run.clock += 1;
  return `2026-01-01T00:00:00.${String(run.clock).padStart(3, "0")}Z`;
}

function emit(run: RunRecord, role: RoleId | "system", kind: RunRecord["events"][number]["kind"], summary: string) {
  run.events.push({ id: `${run.id}:${run.events.length + 1}`, runId: run.id, role, kind, summary: redact(summary).slice(0, 240), requirementVersion: run.requirement.version, at: stamp(run) });
}

function block(run: RunRecord, current: StepRecord, summary: string) {
  current.status = "blocked";
  current.summary = summary;
  run.status = "blocked";
  run.blocker = summary;
  emit(run, current.id, "blocker", summary);
  skipDependents(run);
}

function skipDependents(run: RunRecord) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of run.steps) {
      if (item.status !== "pending") continue;
      if (item.dependsOn.some((id) => ["blocked", "skipped", "cancelled"].includes(step(run, id).status))) {
        item.status = "skipped";
        item.summary = "上游未完成，未执行。";
        changed = true;
      }
    }
  }
}

function noteCall(store: Store, run: RunRecord, name: ToolName) {
  run.toolCalls += 1;
  store.toolCalls.push({ name, runId: run.id });
  if (run.toolCalls > LIMITS.maxToolCalls) throw new Error("已达到工具调用上限。");
}

function allowedTool(name: string): name is ToolName {
  return name === "read_canvas" || name === "search_documents" || name === "read_memory" || name === "export_shot_sheet";
}

function planFrom(run: RunRecord): Plan {
  const text = `${run.requirement.text}\n${run.canvasBrief}`;
  const shotCount = /一个机位|单机位|one angle/i.test(text) ? 1 : 3;
  return {
    requirementVersion: run.requirement.version,
    shotCount,
    shots: SHOTS.slice(0, shotCount),
    subject: "同一主体",
    requestsSubjectChange: /更换主体|另一个人|change the subject/i.test(text),
    referenceTitle: run.canvasBrief ? "场景参考" : null,
  };
}

function reviewerPlan(run: RunRecord): Plan | undefined {
  const output = step(run, "reviewer").output;
  if (!output || !("requirementVersion" in output)) return;
  return output;
}

function toolError(result: { ok: false; error?: string }) {
  return result.error ?? "工具失败。";
}

function matchingApproval(run: RunRecord) {
  const plan = reviewerPlan(run);
  if (!plan || plan.requirementVersion !== run.requirement.version) return;
  return run.approvals.find((item) => item.status === "granted" && item.requirementVersion === run.requirement.version && item.projectId === run.projectId && item.action === "export_shot_sheet" && item.shotCount === plan.shotCount);
}

function callTool(store: Store, run: RunRecord, name: string, args: { projectId?: string; requirementVersion?: number; shotCount?: number; approvalId?: string }) {
  if (!allowedTool(name)) return { ok: false as const, error: "工具不在允许列表。" };
  const faults = run.faults;
  const timeoutAt = faults.timeoutTools?.indexOf(name) ?? -1;
  if (faults.timeoutTools && timeoutAt >= 0) {
    faults.timeoutTools.splice(timeoutAt, 1);
    noteCall(store, run, name);
    return { ok: false as const, error: `工具超时，上限 ${LIMITS.timeoutMs} 毫秒。` };
  }
  const remaining = faults.failTools?.[name] ?? 0;
  if (remaining > 0 && name !== "export_shot_sheet") {
    faults.failTools = { ...faults.failTools, [name]: remaining - 1 };
    noteCall(store, run, name);
    return { ok: false as const, error: "模拟工具失败。" };
  }
  if (name === "read_canvas") {
    noteCall(store, run, name);
    return { ok: true as const, value: run.canvasBrief };
  }
  if (name === "search_documents") {
    noteCall(store, run, name);
    if (args.projectId !== run.projectId) return { ok: false as const, error: "检索范围与当前项目不一致。" };
    return { ok: true as const, value: searchDocuments(store, run.projectId) };
  }
  if (name === "read_memory") {
    noteCall(store, run, name);
    if (args.projectId !== run.projectId) return { ok: false as const, error: "记忆范围与当前项目不一致。" };
    return { ok: true as const, value: visibleMemories(store, run.projectId) };
  }
  const plan = reviewerPlan(run);
  const approval = run.approvals.find((item) => item.id === args.approvalId);
  if (!plan || !approval || approval.status !== "granted" || args.projectId !== run.projectId || args.requirementVersion !== run.requirement.version || args.shotCount !== plan.shotCount || approval.shotCount !== plan.shotCount || approval.requirementVersion !== run.requirement.version) {
    return { ok: false as const, error: "导出参数或审批范围无效。" };
  }
  const key = `${run.projectId}:export_shot_sheet:v${run.requirement.version}:${plan.shotCount}`;
  if (run.effect?.status === "committed" && run.effect.key === key) return { ok: true as const, value: run.effect.result, duplicate: true };
  if (run.effect && (run.effect.status === "started" || run.effect.status === "uncertain") && run.effect.key === key) return { ok: false as const, error: "导出结果不确定。", uncertain: true };
  noteCall(store, run, name);
  run.effect = { key, status: "started", requirementVersion: run.requirement.version, shotCount: plan.shotCount, attempts: (run.effect?.attempts ?? 0) + 1 };
  checkpoint(store);
  if (faults.crashOnce === "export_started") {
    faults.crashOnce = undefined;
    checkpoint(store);
    return { ok: false as const, crashed: true };
  }
  if (faults.uncertainTools?.includes(name)) {
    run.effect.status = "uncertain";
    checkpoint(store);
    return { ok: false as const, error: "导出结果不确定。", uncertain: true };
  }
  const exportFailures = faults.failTools?.[name] ?? 0;
  if (exportFailures > 0) {
    faults.failTools = { ...faults.failTools, [name]: exportFailures - 1 };
    run.effect.status = "failed";
    checkpoint(store);
    return { ok: false as const, error: "模拟导出失败。" };
  }
  run.effect.status = "committed";
  run.effect.result = { exported: true, shotCount: plan.shotCount };
  store.exports.push({ key, runId: run.id, shotCount: plan.shotCount });
  checkpoint(store);
  return { ok: true as const, value: run.effect.result };
}

function finishReview(run: RunRecord, evidence: Evidence, memories: MemoryRecord[]) {
  const plan = planFrom(run);
  const citations = evidence.accepted.map((item) => `${item.source}@v${item.version}`).join("、");
  if (!evidence.accepted.length) return block(run, step(run, "reviewer"), "没有可引用的现行证据。");
  const keepsSubject = evidence.accepted.some((item) => item.documentId === "identity-v3");
  const requiresThree = evidence.accepted.some((item) => item.documentId === "angles-v2");
  if ((plan.requestsSubjectChange && keepsSubject) || (plan.shotCount !== 3 && requiresThree)) {
    return block(run, step(run, "reviewer"), "方案与现行制度冲突，未进入导出。");
  }
  if (memories.some((item) => /更换|另一个人/.test(item.body)) && keepsSubject) {
    return block(run, step(run, "reviewer"), "长期记忆与现行主体制度冲突，未进入导出。");
  }
  const reviewer = step(run, "reviewer");
  reviewer.status = "completed";
  reviewer.output = plan;
  reviewer.summary = `需求 v${plan.requirementVersion}：${plan.shotCount} 个机位，主体保持不变。证据 ${citations}。`;
  emit(run, "reviewer", "evidence", `采用 ${evidence.accepted.length} 条证据，拒绝 ${evidence.rejected.length} 条过期、已删除或不可信内容。`);
  emit(run, "reviewer", "progress", reviewer.summary);
}

function runRole(store: Store, run: RunRecord, current: StepRecord) {
  if (current.id === "planner") {
    const result = callTool(store, run, "read_canvas", { projectId: run.projectId });
    if (!result.ok) return block(run, current, toolError(result));
    current.status = "completed";
    current.output = planFrom(run);
    current.summary = "已读取画布简报，并写成当前需求。";
    emit(run, "planner", "progress", current.summary);
    return;
  }
  if (current.id === "researcher") {
    let lastError = "检索失败。";
    for (let attempt = 0; attempt <= LIMITS.maxRetries; attempt += 1) {
      const result = callTool(store, run, "search_documents", { projectId: run.projectId });
      if (result.ok && result.value && typeof result.value === "object" && "accepted" in result.value) {
        current.status = "completed";
        current.output = result.value;
        current.summary = `检索完成，采用 ${result.value.accepted.length} 条，拒绝 ${result.value.rejected.length} 条。`;
        emit(run, "researcher", "evidence", current.summary);
        return;
      }
      lastError = result.ok ? "检索结果无效。" : toolError(result);
    }
    return block(run, current, `${lastError} 后续角色不再执行。`);
  }
  if (current.id === "archivist") {
    const result = callTool(store, run, "read_memory", { projectId: run.projectId });
    if (!result.ok || !Array.isArray(result.value)) return block(run, current, result.ok ? "记忆结果无效。" : toolError(result));
    current.status = "completed";
    current.output = result.value;
    current.summary = `已读取 ${result.value.length} 条项目记忆。`;
    emit(run, "archivist", "progress", current.summary);
    return;
  }
  if (current.id === "reviewer") {
    const evidence = step(run, "researcher").output;
    const memories = step(run, "archivist").output;
    if (!evidence || !("accepted" in evidence) || !Array.isArray(memories)) return block(run, current, "上游交接不完整。");
    return finishReview(run, evidence, memories);
  }
  const approval = matchingApproval(run);
  const plan = reviewerPlan(run);
  if (!approval || !plan) return block(run, current, "缺少与当前需求版本匹配的审批。");
  let lastError = "导出失败。";
  for (let attempt = 0; attempt <= LIMITS.maxRetries; attempt += 1) {
    const result = callTool(store, run, "export_shot_sheet", { projectId: run.projectId, requirementVersion: run.requirement.version, shotCount: plan.shotCount, approvalId: approval.id });
    if ("crashed" in result && result.crashed) {
      current.status = "pending";
      current.summary = "导出已开始，进程在结果写回前停止。";
      run.status = "running";
      emit(run, "producer", "blocker", current.summary);
      return;
    }
    if ("uncertain" in result && result.uncertain) return block(run, current, "导出结果不确定，已停止重试，避免重复副作用。");
    if (result.ok && result.value && typeof result.value === "object" && "exported" in result.value) {
      current.status = "completed";
      current.output = result.value;
      current.summary = `已导出 ${result.value.shotCount} 个机位的交付记录。`;
      run.status = "completed";
      run.blocker = null;
      emit(run, "producer", "progress", current.summary);
      return;
    }
    lastError = result.ok ? "导出结果无效。" : toolError(result);
  }
  block(run, current, `${lastError} 已达到重试上限。`);
}

function readySteps(run: RunRecord) {
  return run.steps.filter((item) => {
    if (item.status !== "pending") return false;
    if (!item.dependsOn.every((id) => step(run, id).status === "completed")) return false;
    if (item.id === "producer" && !matchingApproval(run)) return false;
    return true;
  });
}

function settle(run: RunRecord) {
  skipDependents(run);
  if (run.status === "blocked" || run.status === "cancelled" || run.status === "completed") return;
  const producer = step(run, "producer");
  const reviewer = step(run, "reviewer");
  if (producer.status === "completed") {
    run.status = "completed";
    return;
  }
  if (reviewer.status === "completed" && producer.status === "pending") {
    run.status = "awaiting_approval";
    run.blocker = "导出交付记录需要限定项目、需求版本和机位数量的审批。";
    emit(run, "system", "approval", run.blocker);
    return;
  }
  if (run.steps.some((item) => item.status === "blocked")) {
    run.status = "blocked";
    return;
  }
  run.status = "blocked";
  run.blocker = "没有可继续的角色。";
}

export function executeUntilWait(store: Store, run: RunRecord) {
  for (let guard = 0; guard < 20 && run.status === "running"; guard += 1) {
    const ready = readySteps(run).slice(0, LIMITS.maxConcurrency);
    if (!ready.length) {
      settle(run);
      break;
    }
    if (ready.length > 1) run.parallelBatches.push(ready.map((item) => item.id));
    for (const current of ready) {
      try {
        runRole(store, run, current);
      } catch (error) {
        block(run, current, error instanceof Error ? error.message : "角色执行失败。");
      }
      checkpoint(store);
      if (run.effect?.status === "started" || run.faults.pauseAfter === current.id) {
        run.faults.pauseAfter = undefined;
        run.status = "running";
        checkpoint(store);
        return run;
      }
      if (run.status !== "running") break;
    }
  }
  checkpoint(store);
  return run;
}

function newRun(store: Store, projectId: string, instruction: string, canvasBrief: string, faults: Faults): RunRecord {
  const run: RunRecord = {
    id: `run-${store.runs.length + 1}`,
    projectId,
    status: "running",
    requirement: { version: 1, text: instruction.trim() },
    canvasBrief,
    blocker: null,
    steps: (Object.keys(ROLE_DEPS) as RoleId[]).map((id) => ({ id, status: "pending", dependsOn: ROLE_DEPS[id], summary: "等待上游。" })),
    approvals: [],
    effect: null,
    events: [],
    parallelBatches: [],
    toolCalls: 0,
    recoveryCount: 0,
    clock: 0,
    faults: structuredClone(faults),
  };
  store.runs.push(run);
  emit(run, "system", "progress", "运行已创建。检索、记忆、核对和导出按依赖交接。");
  return run;
}

export function startRun(store: Store, input: { projectId?: string; instruction: string; snapshot: unknown; faults?: Faults }) {
  const projectId = input.projectId ?? "studio";
  const instruction = redact(input.instruction?.trim() ?? "");
  if (!/^[\w-]{1,40}$/.test(projectId)) {
    const run = newRun(store, "studio", instruction || " ", "", input.faults ?? {});
    block(run, step(run, "planner"), "项目标识无效，未调用工具。");
    checkpoint(store);
    return run;
  }
  if (!instruction || instruction.length > 2000) {
    const run = newRun(store, projectId, instruction || " ", "", input.faults ?? {});
    block(run, step(run, "planner"), "指令须为 1 至 2000 个字符。");
    checkpoint(store);
    return run;
  }
  let brief = "";
  try {
    const snapshot = parseSnapshot(input.snapshot);
    if (!snapshot.nodes.length) throw new Error("空画布");
    brief = redact(snapshot.nodes.map((node) => node.data.textContent).join("\n"));
  } catch {
    const run = newRun(store, projectId, instruction, "", input.faults ?? {});
    block(run, step(run, "planner"), "画布快照无效，未调用工具。");
    run.toolCalls = 0;
    checkpoint(store);
    return run;
  }
  const run = newRun(store, projectId, instruction, brief, input.faults ?? {});
  return executeUntilWait(store, run);
}

export function approveRun(store: Store, id: string, approval: Omit<Approval, "id" | "status">) {
  const run = store.runs.find((item) => item.id === id);
  if (!run || run.status === "cancelled" || run.status === "completed") return run;
  if (approval.action !== "export_shot_sheet" || approval.requirementVersion !== run.requirement.version || approval.projectId !== run.projectId || approval.shotCount !== reviewerPlan(run)?.shotCount) {
    run.approvals.push({ ...approval, id: `approval-${run.approvals.length + 1}`, status: "rejected" });
    emit(run, "system", "approval", "审批与当前需求版本或导出范围不一致，未授权导出。");
    checkpoint(store);
    return run;
  }
  run.approvals.push({ ...approval, id: `approval-${run.approvals.length + 1}`, status: "granted" });
  emit(run, "system", "approval", `已接受需求 v${approval.requirementVersion} 的导出审批，范围 ${approval.shotCount} 个机位。`);
  run.status = "running";
  run.blocker = null;
  return executeUntilWait(store, run);
}

export function changeRequirement(store: Store, id: string, text: string) {
  const run = store.runs.find((item) => item.id === id);
  if (!run || run.status === "completed" || run.status === "cancelled") return run;
  const next = text.trim();
  if (!next || next.length > 2000) return run;
  if (run.effect && (run.effect.status === "started" || run.effect.status === "uncertain")) {
    run.effect.status = "uncertain";
    block(run, step(run, "producer"), "导出结果不确定，需求变更不能再次导出。");
    checkpoint(store);
    return run;
  }
  run.requirement = { version: run.requirement.version + 1, text: next };
  for (const approval of run.approvals) if (approval.status === "granted") approval.status = "stale";
  const reviewer = step(run, "reviewer");
  reviewer.status = "pending";
  reviewer.output = undefined;
  reviewer.summary = "需求已变更，等待重新核对。";
  const producer = step(run, "producer");
  if (producer.status !== "completed") {
    producer.status = "pending";
    producer.output = undefined;
    producer.summary = "等待新的审批。";
  }
  emit(run, "system", "progress", `需求更新为 v${run.requirement.version}。旧审批不能授权新工作。`);
  run.status = "running";
  run.blocker = null;
  return executeUntilWait(store, run);
}

export function cancelRun(store: Store, id: string) {
  const run = store.runs.find((item) => item.id === id);
  if (!run || run.status === "completed" || run.status === "cancelled") return run;
  if (run.effect && (run.effect.status === "started" || run.effect.status === "uncertain")) run.effect.status = "uncertain";
  for (const item of run.steps) if (item.status === "pending") item.status = "cancelled";
  run.status = "cancelled";
  run.blocker = "运行已取消，未继续调用工具。";
  emit(run, "system", "progress", run.blocker);
  checkpoint(store);
  return run;
}

export function recoverRun(store: Store, id: string) {
  const run = store.runs.find((item) => item.id === id);
  if (!run) return;
  run.recoveryCount += 1;
  emit(run, "system", "recovery", "已从保存的进度恢复。已提交或结果不明的导出不会再次执行。");
  if (run.effect && (run.effect.status === "started" || run.effect.status === "uncertain")) {
    run.effect.status = "uncertain";
    const producer = step(run, "producer");
    producer.status = "blocked";
    producer.summary = "导出结果不确定，恢复时未重复执行。";
    run.status = "blocked";
    run.blocker = producer.summary;
    emit(run, "producer", "recovery", producer.summary);
    checkpoint(store);
    return run;
  }
  if (run.effect?.status === "committed") {
    const producer = step(run, "producer");
    producer.status = "completed";
    producer.output = run.effect.result;
    run.status = "completed";
    run.blocker = null;
    checkpoint(store);
    return run;
  }
  if (run.status === "cancelled" || run.status === "completed" || run.status === "blocked") {
    checkpoint(store);
    return run;
  }
  run.status = "running";
  return executeUntilWait(store, run);
}

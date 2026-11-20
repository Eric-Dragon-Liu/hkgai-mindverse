"use client";

import { useEffect, useState } from "react";
import { Bot, Check, CircleAlert } from "lucide-react";
import type { CanvasSnapshot } from "../core/canvas.ts";
import type { Evidence, MemoryRecord, RunRecord } from "../core/runtime/store.ts";

type RuntimeResponse = { run: RunRecord | null; memories: MemoryRecord[]; error?: string };
const roles = { planner: "分镜", researcher: "检索", archivist: "记忆", reviewer: "核对", producer: "导出" };
const runStatus = { running: "执行中", awaiting_approval: "待审批", blocked: "已阻塞", completed: "已完成", cancelled: "已取消" };
const stepStatus = { pending: "等待", completed: "完成", blocked: "阻塞", skipped: "未执行", cancelled: "已取消" };

export function RuntimePanel({ snapshot }: { snapshot: () => CanvasSnapshot }) {
  const [run, setRun] = useState<RunRecord | null>(null);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [instruction, setInstruction] = useState("保持同一主体，安排三个机位。");
  const [revision, setRevision] = useState("色温再低一点，主体和三个机位不变。");
  const [memoryText, setMemoryText] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [notice, setNotice] = useState("刷新后会从服务器恢复最近一次运行。");
  const [busy, setBusy] = useState(false);

  const apply = (payload: RuntimeResponse) => {
    if (payload.run) setRun(payload.run);
    if (payload.memories) setMemories(payload.memories);
  };
  const load = async () => {
    const response = await fetch("/api/runtime?projectId=studio");
    if (response.ok) apply(await response.json() as RuntimeResponse);
  };
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, []);

  const send = async (path: string, init: RequestInit) => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(path, { ...init, headers: { "content-type": "application/json" } });
      const payload = await response.json() as RuntimeResponse;
      if (!response.ok) { setNotice(payload.error ?? "请求失败。"); return; }
      apply(payload);
      setNotice("已同步到本地运行记录。");
    } catch {
      setNotice("运行服务不可用。");
    } finally {
      setBusy(false);
    }
  };
  const start = () => void send("/api/runtime", { method: "POST", body: JSON.stringify({ projectId: "studio", instruction, snapshot: snapshot(), faults: simulateFailure ? { failTools: { search_documents: 9 } } : undefined }) });
  const command = (commandName: string, extra: object = {}) => void send("/api/runtime", { method: "PATCH", body: JSON.stringify({ id: run?.id, command: commandName, ...extra }) });
  const evidence = run?.steps.find((step) => step.id === "researcher")?.output as Evidence | undefined;
  const plan = run?.steps.find((step) => step.id === "reviewer")?.output;
  const shotCount = plan && "shotCount" in plan ? plan.shotCount : 3;

  return (
    <aside className="agent-panel" aria-label="多角色运行">
      <header className="panel-heading"><Bot size={19} /><h1>多角色运行</h1><span className="mode-badge">离线 · 无模型</span></header>
      <div className="agent-scroll">
        <div className="session-heading"><span className="tiny-dot" />项目 studio</div>
        <h2>分镜交付</h2>
        <div className="runtime-facts"><span>模型 <b>未连接</b></span><span>工具 <b>本地白名单</b></span></div>
        {!run && <div className="empty-run"><span>还没有运行。启动后会分镜、检索制度、读取记忆，并在导出前等待审批。</span></div>}
        {run && <section className="run-record" aria-label="运行记录">
          <div className="run-summary"><span>需求 v{run.requirement.version}</span><strong className={run.status === "blocked" || run.status === "cancelled" ? "error-text" : ""}>{runStatus[run.status]}</strong></div>
          {run.blocker && <p className="runtime-note">{run.blocker}</p>}
          <ol className="role-list">{run.steps.map((step) => <li key={step.id}><span>{roles[step.id]}</span><b className={step.status === "blocked" ? "error-text" : ""}>{stepStatus[step.status]}</b></li>)}</ol>
          {evidence && <div className="agent-output"><div>证据</div><p>{evidence.accepted.map((item) => `${item.title} · ${item.source} · v${item.version}`).join("\n") || "没有可采用的证据。"}</p><p>拒绝 {evidence.rejected.length} 条过期、已删除或不可信内容。</p></div>}
          <ol className="event-list">{run.events.slice(-6).map((event) => <li key={event.id}><span className={`event-icon ${event.kind === "blocker" ? "error-text" : ""}`}>{event.kind === "blocker" ? <CircleAlert size={14} /> : <Check size={14} />}</span><div><span className="event-phase">{event.role === "system" ? "系统" : roles[event.role]}</span><p>{event.summary}</p></div></li>)}</ol>
        </section>}
        <div className="memory-box">
          <div>长期记忆</div>
          {memories.map((item) => <p key={item.id}>r{item.revision} {item.body} <button type="button" onClick={() => void send(`/api/runtime/memory?id=${item.id}&projectId=studio`, { method: "DELETE" })}>删除</button></p>)}
          {!memories.length && <p>当前项目没有记忆。</p>}
          <div className="composer-field memory-field"><input aria-label="新的长期记忆" value={memoryText} maxLength={500} onChange={(event) => setMemoryText(event.target.value)} placeholder="记下这个项目的偏好" /><button type="button" disabled={!memoryText.trim() || busy} onClick={() => { void send("/api/runtime/memory", { method: "POST", body: JSON.stringify({ projectId: "studio", body: memoryText }) }); setMemoryText(""); }}>保存</button></div>
        </div>
      </div>
      <form className="agent-composer" onSubmit={(event) => { event.preventDefault(); start(); }}>
        <label className="failure-toggle"><input type="checkbox" checked={simulateFailure} disabled={busy} onChange={(event) => setSimulateFailure(event.target.checked)} />模拟检索失败</label>
        <div className="composer-field"><textarea aria-label="任务指令" value={instruction} maxLength={2000} disabled={busy} onChange={(event) => setInstruction(event.target.value)} /><div className="composer-footer"><span>{notice}</span><button className="text-button" type="submit" disabled={busy || !instruction.trim()}>启动</button></div></div>
        {run && <div className="runtime-actions">
          <button type="button" disabled={busy || run.status !== "awaiting_approval"} onClick={() => command("approve", { approval: { action: "export_shot_sheet", projectId: "studio", requirementVersion: run.requirement.version, shotCount } })}>批准导出 {shotCount} 个机位</button>
          <button type="button" disabled={busy || run.status === "completed" || run.status === "cancelled"} onClick={() => command("cancel")}>取消</button>
          <button type="button" disabled={busy} onClick={() => command("recover")}>恢复</button>
        </div>}
        {run && run.status !== "completed" && run.status !== "cancelled" && <div className="composer-field memory-field"><input aria-label="变更后的需求" value={revision} maxLength={2000} onChange={(event) => setRevision(event.target.value)} /><button type="button" disabled={busy || !revision.trim()} onClick={() => command("change_requirement", { text: revision })}>变更需求</button></div>}
      </form>
    </aside>
  );
}

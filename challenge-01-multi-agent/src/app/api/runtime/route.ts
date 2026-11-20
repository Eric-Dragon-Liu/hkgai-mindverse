import { NextResponse } from "next/server";
import { approveRun, cancelRun, changeRequirement, recoverRun, startRun } from "../../../core/runtime/engine.ts";
import { getServerStore } from "../../../core/runtime/serverStore.ts";
import { corpusView, LIMITS, TOOL_NAMES, visibleMemories, type Faults, type ToolName } from "../../../core/runtime/store.ts";

export const dynamic = "force-dynamic";

function payload(projectId = "studio") {
  const store = getServerStore();
  const run = [...store.runs].reverse().find((item) => item.projectId === projectId) ?? null;
  return { run, memories: visibleMemories(store, projectId), corpus: corpusView(store, projectId), limits: LIMITS };
}

function faultsFrom(value: unknown): Faults {
  if (!value || typeof value !== "object") return {};
  const source = value as Faults;
  const faults: Faults = {};
  if (source.failTools && typeof source.failTools === "object") {
    faults.failTools = {};
    for (const name of TOOL_NAMES) {
      const count = source.failTools[name];
      if (typeof count === "number" && count > 0 && count <= 9) faults.failTools[name] = Math.floor(count);
    }
  }
  if (Array.isArray(source.timeoutTools)) faults.timeoutTools = source.timeoutTools.filter((name): name is ToolName => TOOL_NAMES.includes(name));
  if (Array.isArray(source.uncertainTools)) faults.uncertainTools = source.uncertainTools.filter((name): name is ToolName => name === "export_shot_sheet");
  if (source.crashOnce === "export_started") faults.crashOnce = "export_started";
  if (source.pauseAfter && TOOL_NAMES.length && ["planner", "researcher", "archivist", "reviewer", "producer"].includes(source.pauseAfter)) faults.pauseAfter = source.pauseAfter;
  return faults;
}

export function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "studio";
  if (!/^[\w-]{1,40}$/.test(projectId)) return NextResponse.json({ error: "项目标识无效。" }, { status: 400 });
  return NextResponse.json(payload(projectId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { instruction?: string; snapshot?: unknown; projectId?: string; faults?: unknown } | null;
  if (!body || typeof body.instruction !== "string") return NextResponse.json({ error: "缺少任务指令。" }, { status: 400 });
  const projectId = body.projectId ?? "studio";
  const run = startRun(getServerStore(), { projectId, instruction: body.instruction, snapshot: body.snapshot, faults: faultsFrom(body.faults) });
  return NextResponse.json({ ...payload(run.projectId), run }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; command?: string; text?: string; approval?: { action: "export_shot_sheet"; projectId: string; requirementVersion: number; shotCount: number } } | null;
  if (!body?.id || !body.command) return NextResponse.json({ error: "缺少运行命令。" }, { status: 400 });
  const store = getServerStore();
  const run = body.command === "cancel" ? cancelRun(store, body.id)
    : body.command === "recover" ? recoverRun(store, body.id)
    : body.command === "change_requirement" && typeof body.text === "string" ? changeRequirement(store, body.id, body.text)
    : body.command === "approve" && body.approval ? approveRun(store, body.id, body.approval)
    : undefined;
  if (!run) return NextResponse.json({ error: "无法执行该命令。" }, { status: 400 });
  return NextResponse.json({ ...payload(run.projectId), run });
}

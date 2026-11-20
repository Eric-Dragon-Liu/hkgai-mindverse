import { NextResponse } from "next/server";
import { getServerStore } from "../../../../core/runtime/serverStore.ts";
import { createMemory, deleteMemory, reviseMemory, visibleMemories } from "../../../../core/runtime/store.ts";

export const dynamic = "force-dynamic";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { projectId?: string; body?: string } | null;
  const projectId = body?.projectId ?? "studio";
  const text = clean(body?.body);
  if (!/^[\w-]{1,40}$/.test(projectId) || !text || text.length > 500) return NextResponse.json({ error: "记忆内容无效。" }, { status: 400 });
  const store = getServerStore();
  createMemory(store, projectId, text);
  return NextResponse.json({ memories: visibleMemories(store, projectId) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; body?: string; projectId?: string } | null;
  const text = clean(body?.body);
  if (!body?.id || !text || text.length > 500) return NextResponse.json({ error: "记忆内容无效。" }, { status: 400 });
  const store = getServerStore();
  const updated = reviseMemory(store, body.id, text);
  if (!updated) return NextResponse.json({ error: "找不到这条记忆。" }, { status: 404 });
  return NextResponse.json({ memories: visibleMemories(store, updated.projectId) });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "studio";
  if (!deleteMemory(getServerStore(), id)) return NextResponse.json({ error: "找不到这条记忆。" }, { status: 404 });
  return NextResponse.json({ memories: visibleMemories(getServerStore(), projectId) });
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  addEdge, Background, BackgroundVariant, Controls, Handle, Position,
  ReactFlow, useEdgesState, useNodesState, useReactFlow,
  type Connection, type NodeProps, type Node, type Edge,
} from "@xyflow/react";
import {
  ArrowDownToLine, ArrowUpFromLine, ChevronRight, FileText, FolderOpen, ImageIcon, Layers3, Moon, Plus,
  Save, Sun, Trash2, Video,
} from "lucide-react";
import { initialSnapshot, parseSnapshot, type CanvasNode, type CanvasSnapshot } from "../core/canvas.ts";
import { RuntimePanel } from "./RuntimePanel.tsx";

type EditorNode = Node<CanvasNode["data"], "creative">;
type EditorEdge = Edge;

const storageKey = "mindverse-challenge:canvas:v1";
const themeKey = "mindverse-challenge:theme";
const nodeLabels = { text: "文本", image: "图像", video: "视频", reference: "参考" };
const statusLabels = { idle: "未执行", running: "运行中", waiting: "等待中", success: "已完成", error: "失败" };
const starter = structuredClone(initialSnapshot);
starter.projectName = "未命名创意项目";
starter.nodes[0].data = { ...starter.nodes[0].data, title: "创意简报", textContent: "安静的摄影棚，同一主体，三个机位。保持场景与主体一致。" };
starter.nodes[1].data = { ...starter.nodes[1].data, title: "场景参考", textContent: "白模构图参考，保留空间关系与主体位置。", imageUrl: "/samples/reference.png" };

function CreativeNode({ id, data, selected }: NodeProps<EditorNode>) {
  const { setNodes } = useReactFlow<EditorNode, EditorEdge>();
  const [imageFailed, setImageFailed] = useState(false);
  const update = (patch: Partial<CanvasNode["data"]>) => setNodes((nodes) => nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node));
  const Icon = data.nodeType === "text" ? FileText : data.nodeType === "video" ? Video : ImageIcon;
  useEffect(() => setImageFailed(false), [data.imageUrl]);
  return (
    <article className={`creative-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <header className="node-heading"><Icon size={15} /><input className="nodrag node-title" aria-label="节点标题" value={data.title} maxLength={120} onChange={(event) => update({ title: event.target.value })} /><span className={`node-status ${data.status}`}>{statusLabels[data.status]}</span></header>
      {data.nodeType !== "text" && <div className="node-media">
        {data.imageUrl && !imageFailed ? <img src={data.imageUrl} alt={data.title} draggable={false} onError={() => setImageFailed(true)} /> : <div className="media-empty"><Icon size={28} strokeWidth={1} /><span>暂无预览</span></div>}
      </div>}
      <textarea className="nodrag nowheel node-text" aria-label="节点内容" value={data.textContent} onChange={(event) => update({ textContent: event.target.value })} />
      <footer className="node-footer"><select className="nodrag" aria-label="节点类型" value={data.nodeType} onChange={(event) => update({ nodeType: event.target.value as CanvasNode["data"]["nodeType"] })}>{Object.entries(nodeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span>{id.slice(0, 12)}</span></footer>
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

const nodeTypes = { creative: CreativeNode };

export default function CanvasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<EditorNode>(starter.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<EditorEdge>(starter.edges);
  const [projectName, setProjectName] = useState(starter.projectName);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notice, setNotice] = useState("本地草稿");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(themeKey);
      const next = saved === "dark" ? "dark" : "light";
      setTheme(next);
      document.documentElement.dataset.theme = next;
    } catch { setNotice("浏览器存储不可用，仍可导出 JSON"); }
  }, []);

  const snapshot = (): CanvasSnapshot => parseSnapshot({ version: 1, projectName, nodes, edges });
  const restore = (value: unknown) => {
    const restored = parseSnapshot(value);
    setNodes(restored.nodes);
    setEdges(restored.edges);
    setProjectName(restored.projectName);
  };
  const act = (operation: () => void) => {
    try { operation(); } catch { setNotice("操作失败：文件结构无效或本地存储不可用"); }
  };
  const connect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
  };
  const addNode = () => setNodes((current) => [...current, {
    id: crypto.randomUUID(), type: "creative", position: { x: 100 + (current.length % 4) * 65, y: 120 + (current.length % 5) * 85 },
    data: { nodeType: "text", title: "新建文本", textContent: "", status: "idle" },
  }]);
  const deleteSelected = () => {
    const deleted = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    setNodes((current) => current.filter((node) => !deleted.has(node.id)));
    setEdges((current) => current.filter((edge) => !edge.selected && !deleted.has(edge.source) && !deleted.has(edge.target)));
  };
  const save = () => act(() => { localStorage.setItem(storageKey, JSON.stringify(snapshot())); setNotice("已保存到此浏览器"); });
  const load = () => act(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) { setNotice("此浏览器暂无存档"); return; }
    restore(JSON.parse(saved)); setNotice("已载入本地存档");
  });
  const exportJson = () => act(() => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "mindverse-canvas.json"; anchor.click();
    URL.revokeObjectURL(url); setNotice("已导出画布 JSON");
  });
  const importJson = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setNotice("导入失败：文件不能超过 2 MB"); return; }
    try { restore(JSON.parse(await file.text())); setNotice("已导入并校验画布"); }
    catch { setNotice("导入失败：请检查 JSON、节点与连线结构"); }
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next); document.documentElement.dataset.theme = next;
    act(() => localStorage.setItem(themeKey, next));
  };
  return (
    <main className="workspace">
      <header className="topbar">
        <div className="brand"><Layers3 size={22} strokeWidth={1.6} /><strong>Mindverse</strong></div>
        <ChevronRight className="breadcrumb" size={14} />
        <input className="project-name" aria-label="项目名称" value={projectName} maxLength={100} onChange={(event) => setProjectName(event.target.value)} />
        <span className="challenge-tag">运行时挑战 / 01</span>
        <div className="top-actions">
          <button className="icon-button" title="保存到浏览器" aria-label="保存到浏览器" onClick={save}><Save size={17} /></button>
          <button className="icon-button" title="载入本地存档" aria-label="载入本地存档" onClick={load}><FolderOpen size={17} /></button>
          <span className="divider" />
          <button className="icon-button" title="导出 JSON" aria-label="导出 JSON" onClick={exportJson}><ArrowDownToLine size={17} /></button>
          <button className="icon-button" title="导入 JSON" aria-label="导入 JSON" onClick={() => fileInput.current?.click()}><ArrowUpFromLine size={17} /></button>
          <button className="icon-button" title={theme === "light" ? "切换深色主题" : "切换浅色主题"} aria-label={theme === "light" ? "切换深色主题" : "切换浅色主题"} onClick={toggleTheme}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
        </div>
        <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={(event) => { void importJson(event.target.files?.[0]); event.target.value = ""; }} />
      </header>

      <div className="workspace-body">
        <section className="canvas-area" aria-label="创意画布">
          <div className="canvas-toolbar"><button className="primary-button" onClick={addNode}><Plus size={16} />添加节点</button><button className="icon-button" title="删除选中节点或连线" aria-label="删除选中节点或连线" disabled={!nodes.some((node) => node.selected) && !edges.some((edge) => edge.selected)} onClick={deleteSelected}><Trash2 size={16} /></button></div>
          <ReactFlow<EditorNode, EditorEdge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={connect} isValidConnection={(connection) => connection.source !== connection.target} fitView fitViewOptions={{ padding: 0.18, maxZoom: 1 }} minZoom={0.2} maxZoom={2} colorMode={theme} deleteKeyCode={["Backspace", "Delete"]} defaultEdgeOptions={{ type: "smoothstep" }}>
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
          <div className="canvas-status"><span>{nodes.length} 个节点 · {edges.length} 条连接</span><span role="status">{notice}</span></div>
        </section>

        <RuntimePanel snapshot={snapshot} />
      </div>
    </main>
  );
}
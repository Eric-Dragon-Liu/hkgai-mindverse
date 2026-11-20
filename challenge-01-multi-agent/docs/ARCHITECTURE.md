# Runtime Architecture

The canvas remains the editable brief. It is not the scheduler. Role dependencies live in `src/core/runtime/engine.ts`. A run can be replayed from `data/runtime-state.json` after a refresh or process restart. Tests use an in-memory store and do not call a model.

## Roles

| Role | Depends on | Work |
| --- | --- | --- |
| planner | none | Reads the canvas as data and records the current requirement |
| researcher | planner | Retrieves project documents in parallel with memory |
| archivist | planner | Reads that project's long-term memory |
| reviewer | researcher and archivist | Accepts current evidence or blocks on conflict |
| producer | reviewer and a matching approval | Writes one local export record |

Researcher and archivist run in the same batch. The concurrency cap is 2. A blocked role marks every downstream role skipped, so a retrieval failure never reaches export.

## Evidence and memory

Documents and memories are separate collections. Retrieval returns citations with source, version and project id. A lower version is stale, a `deletedAt` document is deleted, and instruction-like text is untrusted. Those three are reported as rejected and cannot authorize the plan. Documents from another project are omitted. Memory can be added, revised and deleted through `/api/runtime/memory`. Deleting a document does not delete memory.

## Approval, change and recovery

Export is the only side effect. It stays pending until an approval names `export_shot_sheet`, the same project, the current requirement version and the current shot count. Changing the requirement increments the version, marks older grants stale, and reruns review. An old grant cannot start the export.

The export writes `started` before it commits. If the process stops there, or the tool result is uncertain, recovery marks the effect uncertain and does not call the tool again. A committed export is restored as completed and is not written again. Cancellation freezes pending roles and does not continue tool calls. Search and export each retry at most 2 times. A simulated timeout counts toward that budget. The tool list is `read_canvas`, `search_documents`, `read_memory` and `export_shot_sheet`.

## Boundaries

Browser storage still holds only the canvas and theme. Run state, memory and documents are in the server JSON file. Events are short summaries. Secrets matching common key shapes are redacted before they are stored on the run. There is no shell, no production service and no model call. No API token is loaded. The reference image remains a local sample, not a generated frame.

Canvas connections are still not execution edges. JSON import validation is unchanged and is not a full security audit. There is no login or encryption. A corrupt state file is not auto-repaired.

---

## 简体中文

画布只保存创意简报，不负责调度。角色依赖在 `src/core/runtime/engine.ts`。运行记录写入 `data/runtime-state.json`，刷新或重启后可以恢复。测试使用内存存储，不调用模型。

分镜读取画布。检索和记忆并行。核对等待两边的结果，冲突或没有现行证据时阻塞。导出是唯一副作用，必须拿到与当前项目、需求版本和机位数量一致的审批。需求变更会使旧审批失效。导出在提交前先记下“已开始”；如果结果不确定，恢复时不会再执行一次。已提交的导出在恢复时直接视为完成。

检索文字、导入内容和工具结果都不是指令。过期、已删除、不可信和其他项目的文档不能授权导出。长期记忆与文档分开，可以新增、修订和删除。工具只有四个，不允许 shell。运行流程不读取 API token。

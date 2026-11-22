# Reliable Multi-Agent Runtime

## English

Extend the standalone canvas with a recoverable multi-agent runtime. Deterministic roles and local tools are sufficient. Choose one of the two standalone projects.

### Setup

Requires Node.js 22.18 or newer and npm. The versions used here are listed in `.env.example`. No API token is required.

```sh
cd challenge-01-multi-agent
npm install
npm test
npm run typecheck
npm run dev
```

Open http://localhost:3061. For another port: `npm run dev -- --port 3062`.

In the right-hand panel, choose 启动. The run waits at 待审批. Choose 批准导出 3 个机位 to write the local export record. 变更需求, 取消 and 恢复 exercise the other paths. Latest recorded results are in [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md).

```sh
npm run build
npm start
```

### Provided and Missing

- Next.js, React Flow and TypeScript canvas editing, light/dark themes, manual browser save/load and validated JSON import/export (2 MB limit).
- Compatible snapshot exports: `CanvasNode`, `WorkflowEdge`, `CanvasSnapshot`, `parseSnapshot` and `initialSnapshot`.
- A synchronous single-agent mock, deterministic events, a simulated failure switch and unit tests. Its display delay and stop button do not implement asynchronous execution or tool cancellation.
- The multi-agent runtime, durable run file, recovery, approvals, long-term memory and RAG now live in `src/core/runtime`. Canvas connections are still not executable dependencies; the browser canvas save is still not a runtime checkpoint.
- No backend, authentication, real models or media generation. The local reference image is a historical custom Three.js whitebox image, not production media or a generated result.

### Project Goals

- Coordinate at least three distinct roles with meaningful data handoffs, dependencies, concurrency, conflict handling and failure propagation.
- Preserve progress across refresh/restart and prevent duplicate effects during recovery, including uncertain tool outcomes. Bound retries, timeouts, concurrency and tool usage; distinguish completion, blocking and cancellation.
- Keep persistent, revisable, deletable long-term memory separate from RAG evidence. Retrieval must expose sources and respect document versions, deletion and project/access scope.
- Accept user requirement changes during execution. Prevent stale results and approvals from authorizing changed work; require explicit, scoped approval for a simulated side effect.
- Restrict tools and validate arguments. Retrieved text, imports and tool responses are untrusted data, not authority. Keep secrets and private reasoning out of browser data and logs; prohibit arbitrary shell execution and production/paid services.
- Expose roles, progress, blockers, requirement versions, evidence and recovery through concise summaries and redacted events, without private chain-of-thought.

### Verification and Documentation

Provide a reproducible offline test command covering coordination, injected failures, recovery without duplicate effects, changed requirements, approvals, cancellation and hostile/stale evidence. State what works and what remains unimplemented; a recording does not replace tests.

Update the [architecture](docs/ARCHITECTURE.md) with actual boundaries, persistence guarantees, safety assumptions and limitations. Include brief usage instructions and dependency/source attribution; exclude secrets, private data and build artifacts. Real-model integration is optional and must remain separate from offline operation.

### Implemented flow

`npm test` covers the offline runtime as well as the original snapshot and mock tests. No model key is read.

In the right-hand panel, start a run for project `studio`. Planner, researcher and archivist produce a review. Export waits until you approve the shown project, requirement version and shot count. You can change the requirement, cancel, or recover. Retrieved rows show source and version; stale, deleted and hostile documents are counted as rejected. Long-term memory is edited separately from those documents. Server state is `data/runtime-state.json`, which is gitignored.

The runtime does not call Zhipu or any other model. Canvas edges are not the role graph. Dependencies are Next.js, React, React Flow and Lucide, as listed in `package.json`. The reference image is the starter's local sample.

### Project structure

```text
challenge-01-multi-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── runtime/
│   │   │       ├── route.ts                 start, approve, change, cancel, recover
│   │   │       └── memory/
│   │   │           └── route.ts             create, revise, and delete memory
│   │   ├── page.tsx                         canvas editor
│   │   ├── RuntimePanel.tsx                 run, approval, and memory panel
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── core/
│       ├── canvas.ts                        snapshot contract
│       ├── mockAgent.ts                     original single-agent mock
│       └── runtime/
│           ├── engine.ts                    role dependencies and transitions
│           ├── store.ts                     memory, documents, and export records
│           ├── fileStore.ts                 atomic JSON save
│           └── serverStore.ts               server-side store
├── tests/
│   ├── canvas.test.ts
│   ├── mockAgent.test.ts
│   └── runtime.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── TEST-RESULTS.md
├── public/
│   └── samples/
│       └── reference.png
└── data/
    └── runtime-state.json                   local run file, gitignored
```

The canvas files do not schedule agents. `engine.ts` owns the role graph. `store.ts` owns both collections. `fileStore.ts` writes them to `data/runtime-state.json`.

### How the multi-agent runtime works

Five deterministic roles run without a model. Their dependencies are fixed in `engine.ts`:

| Role | Waits for | Result |
| --- | --- | --- |
| planner | nothing | Reads the canvas as data and records the current requirement |
| researcher | planner | Retrieves project documents; runs beside the archivist |
| archivist | planner | Reads this project's long-term memory |
| reviewer | researcher and archivist | Accepts current evidence, or blocks on conflict |
| producer | reviewer and a matching approval | Writes one local export record |

Researcher and archivist share one batch. The concurrency cap is 2. If researcher or archivist blocks, reviewer and producer are skipped, so a retrieval failure cannot reach export. Each tool may retry twice. A simulated timeout consumes that same budget. The only tools are `read_canvas`, `search_documents`, `read_memory`, and `export_shot_sheet`.

Export stays pending until an approval names `export_shot_sheet`, the same project, the current requirement version, and the current shot count. Changing the requirement increments the version and marks older grants stale. The export is saved as `started` before it becomes `committed`. Recovery does not call the tool again when that record is `committed`, `started`, or `uncertain`. Cancellation stops pending roles and does not continue tool calls.

Retrieved text is evidence, not an instruction. A lower document version is stale, a document with `deletedAt` is deleted, and instruction-like text is untrusted. Those three are counted as rejected. Documents from another project are omitted.

### How memory works

Long-term memory and RAG documents are separate arrays in `store.ts`. A memory record is `{ id, projectId, body, revision, deletedAt }`. A document record adds `lineageId`, `title`, `source`, `version`, and `body`.

`createMemory`, `reviseMemory`, and `deleteMemory` change only the memory array. Revision increments on each edit. Delete sets `deletedAt` and leaves the row in the file. The archivist calls `read_memory`, which returns non-deleted rows for the current project only. Nothing in retrieval writes a document into memory, and deleting a document does not delete a memory.

The panel calls `POST`, `PATCH`, and `DELETE` on `/api/runtime/memory`. Both collections are stored together in `data/runtime-state.json`. That file is created on first server start and is not committed.

---

## 繁體中文

### 可靠的多智能體執行系統

在獨立畫布中擴充可復原的多代理執行系統，可使用確定性角色與本機工具。兩個獨立專案擇一完成即可。

### 啟動

需要 Node.js 22.18 或更高版本與 npm。本次使用的版本寫在 `.env.example`。不需要 API token。

```sh
cd challenge-01-multi-agent
npm install
npm test
npm run typecheck
npm run dev
```

開啟 http://localhost:3061。更換連接埠：`npm run dev -- --port 3062`。

右側面板按「啟動」。執行停在「待審批」時，按「批准導出 3 個機位」寫入本機導出記錄。「變更需求」「取消」「恢復」對應其餘流程。最近一次測試記錄見 [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md)。

```sh
npm run build
npm start
```

### 已提供與未實作

- Next.js、React Flow 與 TypeScript 畫布編輯、明暗主題、瀏覽器手動儲存／載入，以及經驗證的 JSON 匯入／匯出（上限 2 MB）。
- 保持相容的快照匯出：`CanvasNode`、`WorkflowEdge`、`CanvasSnapshot`、`parseSnapshot`、`initialSnapshot`。
- 同步單代理模擬、確定性事件、模擬失敗開關與單元測試。顯示延遲與停止按鈕並未實作非同步執行或工具中斷。
- 多代理執行、持久執行檔、復原、審批、長期記憶與 RAG 位於 `src/core/runtime`。畫布連線仍不是可執行依賴；瀏覽器裡的畫布存檔仍不是執行檢查點。
- 尚無後端、驗證、真實模型或媒體生成。本機參考圖為歷史自製 Three.js 白模圖，並非正式環境素材或生成結果。

### 專案目標

- 協調至少三個職責明確的角色，具實際資料交接、依賴、並行、衝突處理與失敗傳遞。
- 重新整理／重啟後保留進度，復原時避免重複副作用，並處理工具結果不確定的情況。限制重試、逾時、並行與工具用量，區分完成、阻塞與取消。
- 將可持久儲存、修訂及刪除的長期記憶與 RAG 證據分開。檢索需呈現來源，並遵守文件版本、刪除及專案／存取範圍。
- 接受執行中的使用者需求修改。防止舊結果與舊審批授權變更後的工作；模擬副作用須取得明確且限定範圍的審批。
- 限制工具並驗證參數。檢索文字、匯入資料與工具回應均為不可信資料，不具授權效力。瀏覽器資料與紀錄不得包含機密或私有推理；禁止任意 shell 執行及正式環境／付費服務。
- 以精簡摘要與去識別化事件呈現角色、進度、阻塞、需求版本、證據與復原狀態，不揭露私有思維鏈。

### 驗證與文件

提供可重現的離線測試指令，涵蓋協作、故障注入、無重複副作用的復原、需求變更、審批、取消及惡意／過期證據。明確列出可用與未實作項目；錄影不能取代測試。

更新[架構說明](docs/ARCHITECTURE.md)，記錄實際邊界、持久化保證、安全假設與限制。附簡短操作說明及依賴／來源註記；不納入機密、私人資料或建置產物。真實模型整合為選用功能，須與離線執行分開。

### 目前實作

`npm test` 會同時跑離線多角色執行，以及原本的快照與單代理測試。執行過程不讀取模型金鑰。

右側面板以 `studio` 專案啟動。分鏡、檢索與記憶完成後進入核對；匯出前必須核准畫面上的專案、需求版本與機位數量。執行中可以變更需求、取消或恢復。證據會顯示來源與版本，過期、已刪除和不可信文件只計入拒絕。長期記憶與這些文件分開編輯。伺服器狀態在 `data/runtime-state.json`，不進入 Git。

此執行流程不呼叫智譜或其他模型。畫布連線不是角色依賴。依賴為 `package.json` 中的 Next.js、React、React Flow 與 Lucide。參考圖是起步包自帶的本地圖片。

### 專案結構

```text
challenge-01-multi-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── runtime/
│   │   │       ├── route.ts                 啟動、批准、變更、取消、恢復
│   │   │       └── memory/
│   │   │           └── route.ts             新增、修訂與刪除記憶
│   │   ├── page.tsx                         畫布編輯
│   │   ├── RuntimePanel.tsx                 執行、審批與記憶面板
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── core/
│       ├── canvas.ts                        快照契約
│       ├── mockAgent.ts                     原本的單代理模擬
│       └── runtime/
│           ├── engine.ts                    角色依賴與狀態轉換
│           ├── store.ts                     記憶、文件與匯出記錄
│           ├── fileStore.ts                 原子寫入 JSON
│           └── serverStore.ts               伺服器端儲存
├── tests/
│   ├── canvas.test.ts
│   ├── mockAgent.test.ts
│   └── runtime.test.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── TEST-RESULTS.md
├── public/
│   └── samples/
│       └── reference.png
└── data/
    └── runtime-state.json                   本機執行檔，不進入 Git
```

畫布檔案不負責調度。`engine.ts` 持有角色圖。`store.ts` 持有兩份資料。`fileStore.ts` 把它們寫入 `data/runtime-state.json`。

### 多智能體如何實作

五個確定性角色不呼叫模型。依賴固定在 `engine.ts`：

| 角色 | 等待 | 結果 |
| --- | --- | --- |
| 分鏡 planner | 無 | 把畫布當成資料讀取，並記下目前需求 |
| 檢索 researcher | 分鏡 | 檢索本專案文件；與記憶角色同一批執行 |
| 記憶 archivist | 分鏡 | 讀取本專案的長期記憶 |
| 核對 reviewer | 檢索與記憶 | 採用現行證據，或因衝突而阻塞 |
| 匯出 producer | 核對與一份匹配的審批 | 寫入一筆本機匯出記錄 |

檢索與記憶同一批執行，並行上限為 2。任一上游阻塞時，核對與匯出會被跳過，因此檢索失敗不會到達匯出。每個工具最多重試 2 次。模擬逾時也計入這個上限。允許的工具只有 `read_canvas`、`search_documents`、`read_memory` 與 `export_shot_sheet`。

匯出會停在待審批，直到審批寫明 `export_shot_sheet`、同一個專案、目前需求版本與目前機位數量。變更需求會把版本加一，並使舊審批失效。匯出先存成 `started`，成功後才成為 `committed`。復原時，狀態為 `committed`、`started` 或 `uncertain` 的記錄不會再次呼叫工具。取消會停下尚未執行的角色，不再繼續呼叫工具。

檢索到的文字是證據，不是指令。較低的文件版本視為過期，帶有 `deletedAt` 的文件視為已刪除，帶有指令口吻的文字視為不可信。這三類只計入拒絕。其他專案的文件不會返回。

### 記憶如何實作

長期記憶與 RAG 文件是 `store.ts` 裡的兩個陣列。記憶記錄為 `{ id, projectId, body, revision, deletedAt }`。文件記錄另外包含 `lineageId`、`title`、`source`、`version` 與 `body`。

`createMemory`、`reviseMemory` 與 `deleteMemory` 只改記憶陣列。每次修訂都會把 `revision` 加一。刪除只設定 `deletedAt`，該列仍留在檔案中。記憶角色呼叫 `read_memory`，只取回目前專案裡未刪除的列。檢索不會把文件寫進記憶，刪除文件也不會刪除記憶。

面板對 `/api/runtime/memory` 發送 `POST`、`PATCH` 與 `DELETE`。兩份資料一起存在 `data/runtime-state.json`。伺服器第一次啟動時建立該檔，且不會提交到 Git。

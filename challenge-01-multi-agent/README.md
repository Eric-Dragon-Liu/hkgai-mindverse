# Reliable Multi-Agent Runtime

## English

Extend the standalone canvas with a recoverable multi-agent runtime. Deterministic roles and local tools are sufficient. Choose one of the two standalone projects.

### Run

Requires Node.js 22.18+ and npm. No model key or parent application is required.

```sh
cd challenge-01-multi-agent
npm install
npm run dev
```

Open http://localhost:3061. For another port: `npm run dev -- --port 3062`.

```sh
npm test
npm run typecheck
npm run build
npm start
```

### Provided and Missing

- Next.js, React Flow and TypeScript canvas editing, light/dark themes, manual browser save/load and validated JSON import/export (2 MB limit).
- Compatible snapshot exports: `CanvasNode`, `WorkflowEdge`, `CanvasSnapshot`, `parseSnapshot` and `initialSnapshot`.
- A synchronous single-agent mock, deterministic events, a simulated failure switch and unit tests. Its display delay and stop button do not implement asynchronous execution or tool cancellation.
- No multi-agent runtime, durable run history, recovery, approvals, long-term memory or RAG. Canvas connections are not executable dependencies; canvas saves are not runtime checkpoints.
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

---

## 繁體中文

### 可靠的多智能體執行系統

在獨立畫布中擴充可復原的多代理執行系統，可使用確定性角色與本機工具。兩個獨立專案擇一完成即可。

### 執行

需要 Node.js 22.18+ 與 npm，不需要模型金鑰或父應用程式。

```sh
cd challenge-01-multi-agent
npm install
npm run dev
```

開啟 http://localhost:3061。更換連接埠：`npm run dev -- --port 3062`。

```sh
npm test
npm run typecheck
npm run build
npm start
```

### 已提供與未實作

- Next.js、React Flow 與 TypeScript 畫布編輯、明暗主題、瀏覽器手動儲存／載入，以及經驗證的 JSON 匯入／匯出（上限 2 MB）。
- 保持相容的快照匯出：`CanvasNode`、`WorkflowEdge`、`CanvasSnapshot`、`parseSnapshot`、`initialSnapshot`。
- 同步單代理模擬、確定性事件、模擬失敗開關與單元測試。顯示延遲與停止按鈕並未實作非同步執行或工具中斷。
- 尚無多代理執行系統、持久執行紀錄、復原、審批、長期記憶或 RAG。畫布連線不是可執行依賴；畫布存檔不是執行檢查點。
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

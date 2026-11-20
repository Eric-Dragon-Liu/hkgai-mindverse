# Starter Architecture

## English

This standalone canvas adapts Mindverse concepts, not production services. It has no parent runtime imports, production API calls or implemented multi-agent runtime.

### Current Boundaries

- `src/core/canvas.ts` owns versioned snapshots, initial data and parsing. Preserve its public exports. Parsing validates structure and clones accepted data; it is not a complete security audit or cycle detector.
- `src/core/mockAgent.ts` synchronously returns a single-agent canvas summary and deterministic events. It has no network, storage or model dependency; simulated failure ends in `blocked`.
- `src/app/page.tsx` owns React Flow interaction and browser persistence. Summaries reflect the snapshot at invocation. The display timer is not execution; stopping it does not interrupt a tool. Mock phases are not separate agents.
- `src/app/globals.css` supplies styles and themes without remote font downloads. Theme documents are adapted references, not verbatim originals: [light](亮色主题界面标准1.md), [dark](暗色主题界面标准1.md).
- `tests/canvas.test.ts` and `tests/mockAgent.test.ts` cover snapshot validation/isolation and mock behavior, not browser interaction or multi-agent reliability.

### Data and Safety

Browser storage holds one manually saved canvas and the theme, not runs, events, approvals or requirement versions. Import/load replaces the canvas without restoring execution; run history exists only in memory.

The mock reads the step graph and renders text; it neither executes node content nor mutates nodes. The default graph is business B1, an order-refund handoff. No image generation service is included.

JSON validation and the 2 MB import limit are partial safeguards. There is no complete URL/path policy, resource isolation, authentication, encrypted storage or prompt-injection defense for a future model/tool pipeline.

### Extension Scope

Coordination, durable recovery, long-term memory, RAG, scoped approvals and mid-execution updates remain unimplemented; [project goals](../README.md) describe intended behavior without fixing an implementation. Document actual state transitions, persistence boundaries, duplicate-effect risks, evidence lifecycle and cancellation guarantees.

Keep offline operation reproducible. Optional live adapters must keep keys server-side, validate commands and model output, restrict tools/network access and redact logs. Do not reuse production credentials or enable arbitrary code execution. Run development, tests and builds inside this package; its default port is 3061.

---

## 繁體中文

# 起始專案架構

此獨立畫布改編自 Mindverse 概念，並非正式環境服務。沒有父專案執行期匯入、正式環境 API 呼叫，也尚未實作多代理執行系統。

### 目前邊界

- `src/core/canvas.ts` 負責版本化快照、初始資料與解析，須保留公開匯出。解析會驗證結構並複製有效資料，但不是完整安全稽核或循環偵測器。
- `src/core/mockAgent.ts` 同步回傳單代理畫布摘要與確定性事件，不依賴網路、儲存或模型；模擬失敗以 `blocked` 結束。
- `src/app/page.tsx` 負責 React Flow 互動與瀏覽器儲存。摘要對應呼叫時的快照；顯示計時器不是執行程序，停止計時器不會中斷工具。模擬階段並非不同代理。
- `src/app/globals.css` 提供樣式與主題，不下載遠端字型。主題文件為改編參考，並非逐字原文：[亮色](亮色主题界面标准1.md)、[暗色](暗色主题界面标准1.md)。
- `tests/canvas.test.ts` 與 `tests/mockAgent.test.ts` 涵蓋快照驗證／隔離及模擬行為，不代表瀏覽器互動或多代理可靠性已獲驗證。

### 資料與安全

瀏覽器僅儲存一份手動畫布存檔與主題，不儲存執行、事件、審批或需求版本。匯入／載入會取代畫布，不會復原執行；執行紀錄僅存在記憶體。

模擬程式讀取步驟圖並呈現文字，不執行節點內容或修改節點。預設圖是業務 B1 訂單售後退款的角色交接。未包含圖片生成服務。

JSON 驗證與 2 MB 匯入上限僅提供部分保護。尚無完整網址／路徑政策、資源隔離、身分驗證、加密儲存，亦未具備未來模型／工具流程所需的提示注入防護。

### 擴充範圍

協作、持久復原、長期記憶、RAG、限定範圍審批與執行中更新均未實作；[專案目標](../README.md) 說明預期行為，不限定實作方式。文件應記錄實際狀態轉換、持久化邊界、重複副作用風險、證據生命週期與取消保證。

維持可重現的離線執行。選用的真實模型介接須將金鑰留在伺服器端，驗證指令與模型輸出，限制工具／網路存取並遮蔽紀錄中的敏感資訊。不得沿用正式環境憑證或開放任意程式碼執行。開發、測試與建置均在本套件內執行，預設連接埠為 3061。
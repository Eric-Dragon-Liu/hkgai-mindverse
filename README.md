# Mindverse Development Tasks

Choose one of two independent projects. Each provides a minimal starter, not a completed implementation.

| Project | Objective | Provided |
| --- | --- | --- |
| [Multi-Agent Runtime](challenge-01-multi-agent/README.md) | Coordination, durable context, RAG, user intervention and reliable execution | Editable canvas, local snapshots and a single-agent mock |
| [Agent Studio](challenge-02-agent-studio/README.md) | Conversational scene creation, assets, cameras and visual output | Empty Three.js grid, basic canvas and text input |

## Setup

Requires Node.js 22.18+ and npm. Install inside the selected project:

```sh
git clone https://github.com/Azzz368/test1.git
cd test1/challenge-01-multi-agent
npm install
npm run dev
```

For the studio, use `challenge-02-agent-studio`. Default ports are 3061 and 3062 respectively. Both support `npm run build`; type checking uses `npm run typecheck` for the runtime and `npm run check` for the studio. The runtime also includes `npm test`.

## Delivery

Plan for 20-30 hours. Submit the selected project with a lockfile, setup instructions, relevant tests and an example. Document decisions, limitations, time spent and AI or third-party tools used. Each `docs/` directory contains architecture notes and adapted theme guidelines.

Paid APIs are optional; label simulated behavior. Keep credentials server-side. Do not execute arbitrary user/model-generated code or commit secrets, user data, dependencies or build output. Production services are excluded. Existing checks used installed dependencies; verify a clean install and include a lockfile.

---

## 繁體中文

兩個獨立專案擇一完成。各專案僅提供最小基礎入口，不包含完整功能。

| 專案 | 目標 | 已提供 |
| --- | --- | --- |
| [多智能體執行系統](challenge-01-multi-agent/README.md) | 協作、持久上下文、RAG、使用者介入與可靠執行 | 可編輯畫布、本機快照與單智能體模擬 |
| [Agent 虛擬攝影棚](challenge-02-agent-studio/README.md) | 對話建場、資產、攝影機與畫面輸出 | 空白 Three.js 網格、基礎畫布與文字輸入 |

### 啟動

需要 Node.js 22.18+ 與 npm，請在所選專案內安裝：

```sh
git clone https://github.com/Azzz368/test1.git
cd test1/challenge-01-multi-agent
npm install
npm run dev
```

攝影棚請改用 `challenge-02-agent-studio`。預設連接埠分別為 3061 與 3062。兩者皆支援 `npm run build`；型別檢查分別為執行系統的 `npm run typecheck` 與攝影棚的 `npm run check`。執行系統另提供 `npm test`。

### 交付

建議投入 20 至 30 小時。提交所選專案、鎖定檔、啟動說明、必要測試與範例，說明設計取捨、限制、用時及 AI／第三方工具使用情況。各 `docs/` 目錄提供架構說明與調整後的主題規範。

付費 API 為選用，須標示模擬行為。憑證僅存於伺服器端，不得執行使用者或模型產生的任意程式碼，也不得提交機密、使用者資料、相依套件目錄或建置產物。不包含正式環境服務。既有檢查使用已安裝套件，請驗證全新安裝並提交鎖定檔。
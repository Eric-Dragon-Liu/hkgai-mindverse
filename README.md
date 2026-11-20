# Mindverse Development Tasks

This repository is the multi-agent runtime challenge.

| Project | Objective | Provided |
| --- | --- | --- |
| [Multi-Agent Runtime](challenge-01-multi-agent/README.md) | Coordination, durable context, RAG, user intervention and reliable execution | Canvas, local snapshots, and the offline multi-agent runtime |

## Setup

This repository contains challenge 1, the multi-agent runtime. It requires Node.js 22.18 or newer and npm. Verified with Node.js 22.23.5.

```sh
cd challenge-01-multi-agent
npm install
npm test
npm run dev
```

Open http://localhost:3061. Dependency versions are listed in [challenge-01-multi-agent/.env.example](challenge-01-multi-agent/.env.example). Startup details and the latest test record are in [challenge-01-multi-agent/README.md](challenge-01-multi-agent/README.md) and [challenge-01-multi-agent/docs/TEST-RESULTS.md](challenge-01-multi-agent/docs/TEST-RESULTS.md).

## Delivery

Plan for 20-30 hours. Submit the selected project with a lockfile, setup instructions, relevant tests and an example. Document decisions, limitations, time spent and AI or third-party tools used. Each `docs/` directory contains architecture notes and adapted theme guidelines.

Paid APIs are optional; label simulated behavior. Keep credentials server-side. Do not execute arbitrary user/model-generated code or commit secrets, user data, dependencies or build output. Production services are excluded. Existing checks used installed dependencies; verify a clean install and include a lockfile.

---

## 繁體中文

本倉庫是多智能體執行系統題目。

| 專案 | 目標 | 已提供 |
| --- | --- | --- |
| [多智能體執行系統](challenge-01-multi-agent/README.md) | 協作、持久上下文、RAG、使用者介入與可靠執行 | 畫布、本機快照與離線多角色執行 |

### 啟動

本倉庫目前是題目一，多智能體執行系統。需要 Node.js 22.18 或更高版本與 npm。本次驗證使用 Node.js 22.23.5。

```sh
cd challenge-01-multi-agent
npm install
npm test
npm run dev
```

開啟 http://localhost:3061。依賴版本見 [challenge-01-multi-agent/.env.example](challenge-01-multi-agent/.env.example)。完整啟動步驟與最近一次測試記錄見 [challenge-01-multi-agent/README.md](challenge-01-multi-agent/README.md) 與 [challenge-01-multi-agent/docs/TEST-RESULTS.md](challenge-01-multi-agent/docs/TEST-RESULTS.md)。

### 交付

建議投入 20 至 30 小時。提交所選專案、鎖定檔、啟動說明、必要測試與範例，說明設計取捨、限制、用時及 AI／第三方工具使用情況。各 `docs/` 目錄提供架構說明與調整後的主題規範。

付費 API 為選用，須標示模擬行為。憑證僅存於伺服器端，不得執行使用者或模型產生的任意程式碼，也不得提交機密、使用者資料、相依套件目錄或建置產物。不包含正式環境服務。既有檢查使用已安裝套件，請驗證全新安裝並提交鎖定檔。
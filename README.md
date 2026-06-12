# AgencyReport AI

## Production Database Setup

Before public launch, use a hosted PostgreSQL database such as Supabase, Neon, or Railway PostgreSQL.
The app automatically switches from local `data/db.json` to PostgreSQL when `DATABASE_URL` is set.

Required environment variables:

```env
DATABASE_URL=postgres://user:password@host:5432/database
DATABASE_SSL=true
```

Check the connection and initialize the production table:

```bash
npm run db:check
```

The production store uses one JSONB table named `agencyreport_store`. This keeps the current MVP data model simple while allowing the app to run on a real hosted database.

代理商 AI 月報解讀與交付工具。定位不是取代 Looker Studio 或 Supermetrics，而是補上「每月客戶月報的敘事、風險判斷、行動建議與交付」。

## 目前功能

- CSV 匯入與貼上。
- Google Sheets CSV URL 匯入。
- 客戶 / 品牌模板可儲存到本機 API；未啟動後端時自動 fallback 到瀏覽器 localStorage。
- 輕量收費 MVP 後端：`server.js` 提供 leads、templates、reports、clients、intake API，資料先寫入 `data/db.json`。
- 客戶管理與方案用量：可儲存客戶、同步 API、本機 fallback，並依入門版 / 代理商版 / 專業版顯示客戶與報告用量。
- 帳號與付款草稿：可建立代理商帳號，並產生可替換 Stripe / 綠界 / 藍新的 checkout draft。
- PM 審核與交付中心：可標記報告已審核，建立交付紀錄，後續可串接 Email / PDF。
- 後端 AI 與排程中心：可建立 AI run 草稿與固定重跑排程，後續可替換成 OpenAI + Cron。
- 中英語言切換，包含操作區、報告區標題、選項、KPI、AI 解讀、風險、建議、表格與圖表標籤。
- 左側案件摘要、月份與幣別 chips。
- Ads / SEO / Social 快速案件配置。
- 按鈕 loading / success / error 回饋。
- 上線助手：一鍵完成 Demo 設定，檢查客戶需求、資料來源、自動化排程、交付 Email、報告產生與 HTML 交付狀態。
- AI Autopilot：客戶用自然語言描述需求，自動配置報告類型、KPI、語氣與工作單。
- AI 工作單：產出目標、KPI、資料需求、自動化動作與客戶回覆草稿。
- 全自動化營運控制台：依資料來源、交付 Email、排程與審核模式計算自動化成熟度，提示下一步設定。
- 專案完成進度：顯示 MVP、營利化、自動化與公開部署的完成度、狀態與下一步。
- 內部進度資訊保護：公開網域會自動隱藏「公開部署前檢查」、「專案完成進度」與「本階段交付清單」，本機開發才顯示。
- Google / Meta 廣告、SEO、社群三種範例報告。
- 高層摘要、核心 KPI、AI 成效解讀、風險提醒、下月行動建議。
- 5 種互動圖表：趨勢變化、營收占比、ROAS 排名、轉換漏斗、CPA x ROAS 效率象限。
- 渠道卡片與明細表，支援點選高亮。
- 列印 PDF。
- 匯出獨立 HTML 報告。
- 產品化服務方案與試用留資表單。

## Google Sheets 匯入

1. 在 Google Sheets 準備欄位：

```csv
channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue
```

2. 將試算表發佈到網路，或取得 CSV 匯出網址。
3. 貼到「Google Sheets CSV URL」。
4. 點「從 Sheets 匯入」。

若讀取失敗，通常是權限未公開或網址不是 CSV 格式。

## 本機啟動

靜態展示模式：

```bash
python -m http.server 4173
```

收費 MVP 後端模式：

```bash
npm start
```

後端模式會由 `server.js` 同時提供靜態頁與 API：

- `GET /api/health`
- `GET /api/readiness`
- `GET /api/team-members`
- `POST /api/team-members`
- `GET /api/templates`
- `POST /api/templates`
- `GET /api/leads`
- `POST /api/leads`
- `GET /api/data-sources`
- `POST /api/data-sources`
- `POST /api/data-sources/test`
- `POST /api/data-sources/sync`
- `GET /api/data-syncs`
- `GET /api/consents`
- `POST /api/consents`
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/ai-runs`
- `POST /api/report/run`
- `GET /api/schedules`
- `POST /api/report/schedule`
- `GET /api/deliveries`
- `POST /api/report/deliver`
- `GET /api/share-links`
- `POST /api/share-links`
- `GET /api/email-jobs`
- `POST /api/email-jobs`
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/audit-logs`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/portal-invites`
- `POST /api/portal-invites`
- `GET /api/portal-submissions`
- `POST /api/portal-submissions`
- `POST /api/portal-submissions/process`
- `GET /api/intake`
- `POST /api/intake`
- `POST /api/accounts`
- `POST /api/billing/checkout`
- `GET /api/billing-intents`
- `POST /api/billing/quote/accept`
- `POST /api/billing/quote/invoice`
- `POST /api/billing/invoice/pay`
- `POST /api/billing/webhook`
- `GET /api/payment-events`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

資料會寫入 `data/db.json`。正式上線時應替換成 PostgreSQL、Supabase、Neon、Firebase 或其他正式資料庫。

## Production Database / 正式資料庫

- Local default: no environment variable is required; the API writes to `data/db.json`.
- Production mode: set `DATABASE_URL=postgres://...` to switch storage to PostgreSQL.
- On boot, `server.js` creates `agencyreport_store` automatically and stores the app state as JSONB.
- SSL is enabled by default for hosted databases. Set `DATABASE_SSL=false` only for trusted private networks.
- Deploy targets such as Render, Railway, Fly.io, Neon, Supabase, and Vercel server functions should install dependencies from `package.json`, including `pg`.

## AI Provider / AI 供應商

- Local default: no key is required; `POST /api/report/run` returns a review-safe fallback draft.
- Live mode: set `AI_PROVIDER=openai`, `OPENAI_API_KEY=...`, and optionally `AI_MODEL=gpt-4o-mini`.
- OpenAI-compatible mode: set `AI_PROVIDER=openai-compatible`, `AI_API_KEY=...`, `AI_BASE_URL=https://provider.example/v1`, and `AI_MODEL=...`.
- `GET /api/health` reports the active AI provider, mode, and model.
- If the AI provider fails, the API stores a fallback draft with `providerError` so the workflow continues instead of blocking the client.

## Email Worker / Email 與排程 Worker

- Local default: `EMAIL_PROVIDER=manual`; email jobs become `ready_to_send` when processed.
- Mock test mode: set `EMAIL_PROVIDER=mock`; `POST /api/email-jobs/send` marks jobs as `sent` without external delivery.
- API provider mode: set `EMAIL_PROVIDER=api`, `EMAIL_API_URL=...`, `EMAIL_API_KEY=...`, and optionally `EMAIL_FROM=...`.
- Cron worker: call `POST /api/worker/run`; set `WORKER_SECRET=...` in production and pass `x-worker-secret`.
- Worker output: due schedules create an AI draft record, queue an email job when `deliveryEmail` exists, and move `nextRunAt` forward.

## Data Connectors / 資料串接

- Local default: Google Sheets public CSV and manual CSV can be tested without credentials.
- `POST /api/data-sources/test` validates source reachability or required credentials.
- `POST /api/data-sources/sync` writes a sync audit record and updates the source `lastSyncAt`.
- Google Ads: set `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, and `GOOGLE_ADS_CLIENT_SECRET`.
- Meta Ads: set `META_ACCESS_TOKEN` or `META_APP_ID` before live API sync.
- GA4 / Search Console: set `GA4_PROPERTY_ID` plus `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`.
- `GET /api/health` reports connector readiness for Google Sheets, Google Ads, Meta Ads, GA4, and Search Console.

## Payment Provider / 金流串接

- Local default: `PAYMENT_PROVIDER=mock`; checkout creates a mock payment session and quote link.
- Stripe mode: set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY=...`, `STRIPE_SUCCESS_URL=...`, and `STRIPE_CANCEL_URL=...`.
- Optional webhook: set `STRIPE_WEBHOOK_SECRET=...` and route provider events to `POST /api/billing/webhook`.
- Checkout records store `provider`, `paymentStatus`, `checkoutSessionId`, `checkoutUrl`, and `quoteUrl`.
- Payment events are stored in `payment_events`; successful events update matching billing intents by token/session id.

## Production Readiness / 正式上線檢查

- Copy `.env.example` to `.env` locally, or set the same variables in the hosting platform.
- Run `GET /api/readiness` after deployment; paid launch requires `ready: true`.
- Required before paid public launch:
  - `DATABASE_URL`
  - `OPENAI_API_KEY` or `AI_API_KEY`
  - `EMAIL_PROVIDER=api`, `EMAIL_API_URL`, `EMAIL_API_KEY`
  - `WORKER_SECRET`
  - `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_WEBHOOK_SECRET`
- Strongly recommended before scaling:
  - at least one live data connector credential
  - `SENTRY_DSN` or `MONITORING_URL`
  - `BACKUP_ENABLED=true` or `BACKUP_POLICY_URL`
  - counsel-reviewed privacy, data processing, AI disclosure, and payment terms
- Suggested deploy order:
  1. Provision PostgreSQL.
  2. Deploy API and static frontend together.
  3. Set all required environment variables.
  4. Run `/api/health` and `/api/readiness`.
  5. Run one paid checkout in Stripe test mode.
  6. Run one worker cron cycle with `x-worker-secret`.
  7. Create a client report, share link, email job, and archived HTML download.

## 推薦銷售定位

Looker Studio 負責即時看板，Supermetrics 負責資料串接，AgencyReport AI 負責月報敘事與交付。

對代理商的話術：

> 你可以繼續用 Looker Studio 看每日數據，我們幫你把每月報告從 2 小時縮短到 10 分鐘，產出客戶看得懂的摘要、風險與下月建議。

## 初期收費建議

- 入門版：NT$790 / 月，10 份月報，CSV/Sheets 匯入、AI 建議、PDF/HTML 匯出。
- 代理商版：NT$2,490 / 月，50 份月報，多客戶、品牌化報告、AI 下月建議、付款/交付紀錄。
- 專業版：NT$5,990 / 月，更高月報量、客戶入口、排程、Email 草稿、白標與進階 AI 分析。

## 下一步

- 串接真實 Google Sheets OAuth 或後端 proxy。
- 加入 serverless AI agent：接收客戶需求、資料欄位與歷史表現，回傳 KPI、模板、摘要、風險、建議與客戶回覆。
- 加入排程任務：每週或每月自動重跑指定客戶報告。
- 加入 Email / Slack / LINE 通知：PM 審核後交付，或進入全自動草稿交付。
- 產生真正 PDF 檔案，不只依賴瀏覽器列印。
- 加入帳號、客戶列表、歷史報告。
- 接 Stripe / 綠界 / 藍新等付款流程。

## 目前完成進度

- MVP 產品體驗：92%。報告產生、互動圖表、AI 工作單、語系切換、HTML/PDF 交付展示已可用。
- 營利化準備：可測試。已有定價、留資表單、上線助手與一鍵 Demo，可開始找小型代理商做付費意願驗證。
- 全自動化能力：需後端。目前是前端規則型 Autopilot；正式版需接 AI agent、OAuth、排程、Email 與審核紀錄。
- 公開部署準備：需後端。靜態展示可部署，正式收費需補登入、資料庫、付款、隱私條款與 audit logs。

## 本階段交付清單

- 加入 AI Autopilot 需求輸入區：完成。側欄已包含客戶需求、CPA / ROAS / SEO 快速需求、產業、自動化程度、交付 Email 與排程。
- 實作需求解析與自動配置：完成。可依需求判斷 Ads / SEO / Social、KPI、語氣、資料需求並套用報告樣板。
- 產出 AI 工作單與客戶回覆草稿：完成。會產出目標、KPI、資料需求、自動化動作與可貼給客戶的回覆草稿。
- 補樣式與 README 自動化路線：完成。已加入 Launch Assistant、完成度面板、營運控制台、雙語文案與後端路線。
- 本機驗證新功能：完成。已驗證圖表、工作單、營運控制台、Launch Readiness、英文殘留掃描與 console errors。

## 公開部署前注意

- 目前是純前端 MVP，可部署到 Netlify、Vercel、Cloudflare Pages 或 GitHub Pages。
- 內部開發資訊只在 `localhost`、`127.0.0.1` 或 `file://` 顯示；正式網域會自動隱藏。
- 客戶模板、留資名單與報告快照已有本機 API 雛形；正式營利前應改成正式後端資料庫與帳號權限。
- Google Sheets 匯入需要公開 CSV URL；正式版建議改成 OAuth 或後端 proxy。
- 「列印 PDF」適合 MVP 展示；正式版建議使用後端 PDF 產生器或瀏覽器列印服務。
- 收費前應補：登入、付款、客戶列表、歷史報告、權限控管、隱私條款。

## 全自動化產品路線

目前 Autopilot 是前端規則型 fallback，用來展示「客戶自然語言需求 -> 自動配置報告」的流程。正式營利版建議升級成：

1. 客戶輸入需求與 Sheets 連結。
2. 後端 AI agent 判斷產業、KPI、資料需求與報告模板。
3. 系統自動抓取 Sheets / API 資料。
4. AI 產生月報摘要、異常分析、行動建議與客戶回覆。
5. PM 審稿或自動寄送 PDF / HTML。
6. 每月排程自動重跑。

公開收費前，AI API key 不應放在前端，應透過 serverless function 或後端 proxy 呼叫模型。

建議正式版後端最小架構：

- `POST /api/intake`：客戶送出需求、產業、報告目標與資料來源。
- `POST /api/report/run`：背景任務抓資料、呼叫 AI、產生報告 JSON。
- `POST /api/report/deliver`：PM 核准後寄出 HTML / PDF。
- `CRON /api/report/schedule`：依客戶排程每週或每月重跑。
- 資料庫：accounts、clients、data_sources、reports、deliveries、audit_logs。

## 本機檢測摘要

- 初始載入：通過。
- 中英切換：通過；英文模式可見中文掃描僅剩語言切換按鈕「中」。
- 上線助手：通過；中文模式一鍵 Demo 可將 Launch Readiness 從 33% 提升到 100%。
- Ads / SEO / Social 快速案例：通過。
- 插入 CSV 範本：通過。
- 儲存模板：通過。
- AI Autopilot 預設需求與工作單：通過。
- 全自動化營運控制台成熟度與缺口提示：通過，Auto Delivery Draft + monthly schedule 會將成熟度提升到 85%，並提示尚缺交付 Email。
- 一鍵 Demo 設定：通過；自動填入需求、CSV 範例、Auto Delivery Draft、monthly schedule、交付 Email，並將 AI 成熟度提升到 100%。
- 專案完成進度面板：通過；初始顯示 4 張進度卡，英文模式掃描僅剩語言切換按鈕「中」。
- 本階段交付清單：通過；5 項截圖進度皆顯示完成並附驗證依據。
- 公開網域內部資訊隱藏：已實作；非本機 hostname 不會顯示內部進度區塊。
- 收費 MVP 後端 API：通過；`/api/health`、`POST /api/leads`、`GET /api/leads` 已用 bundled Node 在 4280 測試成功。
- 前端 API 偵測：通過；靜態模式顯示 Backend API Missing，Node 後端模式顯示 Backend API 完成。
- 客戶管理與方案用量：通過；可依資料模式顯示後端連線或本機暫存，統計 clients / reports 用量，`POST /api/clients` 已測試成功。
- 客戶入口邀請：通過；可為目前客戶產生自助 intake 入口，後端提供 `POST /api/portal-invites`、`GET /api/portal-invites`，並納入上線清單與整合健康。
- 客戶自助入口提交：通過；`/client/intake/{token}` 會顯示簡化需求表單，送出後寫入 `POST /api/portal-submissions` 並產生 audit log。
- 客戶提交回收與套用：通過；代理商工作台可刷新 portal submissions、查看最近客戶提交，並一鍵套用到 Autopilot 需求、資料來源與交付 Email。
- 客戶提交自動建案：通過；可將最新 portal submission 一鍵轉成 client、intake、data-source 三筆營運資料，減少 PM 手動建案步驟。
- 客戶提交處理狀態：通過；自動建案後會呼叫 `POST /api/portal-submissions/process` 標記 processed，避免同一筆提交被重複建案。
- 客戶提交直送 AI 草稿：通過；可一鍵將最新 portal submission 自動建案並呼叫 `POST /api/report/run` 產出後端 AI draft。
- MVP 登入與 session：通過；工作台加入登入 gate，後端提供 register/login/me/logout，客戶 intake portal 不需登入仍可提交。
- API route 權限保護：通過；除 `POST /api/leads` 與 `POST /api/portal-submissions` 外，資料、付款、報告、AI、稽核等 API 需帶有效 Bearer token。
- 公開條款與同意紀錄：通過；新增 `/legal` 與 `GET /api/legal`，lead / client portal 會要求同意並保存 `legal-2026-06-06` 版本。
- 上線設定精靈：通過；Launch Assistant 內已新增可執行下一步流程，串起 Demo、客戶、入口、AI 草稿、排程與交付包，後端產物鏈已用 Bearer token 測試成功。
- 客戶 Onboarding 交接包：通過；設定精靈可複製或下載 Markdown 交接包，彙整案件、KPI、成效快照、自動化設定、客戶連結、發票與內部下一步。
- `server.js` JSON 讀取容錯：通過；可處理帶 BOM 的 `data/db.json`。
- 帳號與付款草稿：通過；`POST /api/accounts`、`POST /api/billing/checkout` 已測試成功，前端付款面板可顯示 API 連線狀態。
- 客戶報價確認頁：通過；`POST /api/billing/checkout` 會產生 `/billing/quote/{token}`，客戶可查看方案、金額、狀態與條款連結，方便替換成正式金流。
- 客戶接受報價流程：通過；公開 quote 頁可呼叫 `POST /api/billing/quote/accept` 將 billing intent 標記為 accepted，並寫入 audit log。
- 報價狀態回收至工作台：通過；新增受保護 `GET /api/billing-intents`，登入後帳務區可列出 quote draft / accepted quote 與報價連結。
- Accepted quote 轉發票：通過；新增受保護 `POST /api/billing/quote/invoice`，accepted quote 可一鍵產生發票草稿且避免重複開立。
- 公開發票確認頁：通過；accepted quote 產生的 invoice 會帶 `/billing/invoice/{token}`，客戶可查看發票號、金額、方案、到期日與條款連結。
- 發票付款確認：通過；公開 invoice 頁可呼叫 `POST /api/billing/invoice/pay` 將 invoice 標記為 paid，並寫入 audit log。
- 發票草稿與帳務清單：通過；帳務區可依方案產生發票草稿，後端提供 `POST /api/invoices`、`GET /api/invoices`，並納入付款健康檢查。
- PM 審核與交付中心：通過；前端可顯示審核與交付狀態，後端提供 `POST /api/report/deliver` 與 `GET /api/deliveries`。
- 後端 AI 與排程中心：通過；後端提供 `POST /api/report/run`、`GET /api/ai-runs`、`POST /api/report/schedule`、`GET /api/schedules`。
- 資料來源管理中心：通過；前端可測試與保存 Sheets / CSV 來源，後端提供 `POST /api/data-sources`、`GET /api/data-sources`。
- 稽核紀錄中心：通過；後端提供 `GET /api/audit-logs`，前端可查看最近 API 操作事件。
- 客戶需求 Intake：通過；前端可保存 Autopilot 需求，後端提供 `POST /api/intake`、`GET /api/intake`，並會寫入 audit log。
- 信任與授權中心：通過；前端需勾選資料處理、AI 分析、報告交付授權，後端提供 `POST /api/consents`、`GET /api/consents`。
- 報告庫：通過；前端可保存目前報告版本，並用 `GET /api/reports` 顯示最近報告與方案用量。
- 正式資料庫模式：通過；`DATABASE_URL` 存在時會改用 PostgreSQL JSONB store，未設定時維持 `data/db.json` 本機模式，`GET /api/health` 會回報目前 storage。
- 收費主線 API 串流：通過；本機 4280 已完成 register -> client -> checkout quote -> public accept -> invoice draft -> public paid 流程。
- AI provider workflow：通過；`POST /api/report/run` 已支援 live OpenAI-compatible provider 與 fallback draft，前端 AI agent 狀態會顯示 provider / model / mode。
- 公開報告分享頁：通過；`POST /api/share-links` 會綁定最新 report snapshot，`/client/report/{token}` 可顯示客戶可看的報告摘要、KPI 與 channel snapshot。
- 交付包 API：通過；Email job 會補 queued/manual provider/body，報告交付、分享連結、Email 佇列可串成一條可收費交付流程。
- 報告封存下載：通過；公開報告頁提供 Print / Save PDF 與 Download HTML，`/client/report/{token}/download` 會用 attachment header 下載可封存交付物。
- Email provider / worker 骨架：通過；新增 `POST /api/email-jobs/send` 與 `POST /api/worker/run`，支援 manual/mock/API provider 模式與 `WORKER_SECRET`。
- 到期排程處理：通過；worker 會處理 due schedules，產生 scheduled AI run、Email job，並推進下一次 `nextRunAt`。
- 資料 connector 骨架：通過；新增 Google Sheets / Google Ads / Meta Ads / GA4 / Search Console readiness，並提供 `POST /api/data-sources/test` 與 `POST /api/data-sources/sync`。
- 資料同步紀錄：通過；新增 `data_syncs` 集合，sync 會記錄 provider、mode、rowCount、message、syncedAt 並回寫 source `lastSyncAt`。
- Stripe / 金流 provider 骨架：通過；`POST /api/billing/checkout` 已支援 mock / Stripe provider session，`GET /api/health` 會回報 payment readiness。
- 付款事件紀錄：通過；新增 `POST /api/billing/webhook` 與 `GET /api/payment-events`，成功付款事件會依 token/session id 回寫 billing intent。
- Production readiness：通過；新增 `GET /api/readiness`、`.env.example`、部署前必填環境變數與上線檢查清單。
- Secret hygiene：通過；`.gitignore` 已排除 `.env` / `.env.local`，降低正式金鑰誤提交風險。
- 團隊權限中心：通過；前端可邀請成員並指定角色，後端提供 `POST /api/team-members`、`GET /api/team-members`。
- 整合健康面板：通過；前端可即時彙整 API、資料、授權、團隊、AI、排程、交付與付款健康狀態。
- 客戶分享連結：通過；交付區可建立報告分享連結，後端提供 `POST /api/share-links`、`GET /api/share-links`。
- Email 交付佇列：通過；交付區可將報告通知排入 Email job，後端提供 `POST /api/email-jobs`、`GET /api/email-jobs`。
- 互動圖表模式與渠道高亮：通過。
- HTML 匯出：通過。
- 清除本機資料：通過。
- 留資表單：邏輯已實作；本次自動化填字受 in-app browser 工具限制，需真人點選輸入再確認。

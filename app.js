const samples = {
  ads: `channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue
Google Search,82000,186000,7240,318,612000,76000,6810,284,548000
Meta Ads,54000,420000,6320,146,226000,61000,7020,158,241000
Google Display,18000,510000,2860,42,59000,22000,3020,38,52000
LINE OA,12000,78000,1940,64,94000,9000,1260,39,57000
YouTube Ads,26000,240000,3180,58,86000,21000,2580,44,71000`,
  seo: `channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue
Organic Blog,32000,128000,9450,186,284000,30000,8120,142,219000
Service Pages,18000,72000,4160,154,356000,16000,3620,121,278000
Local SEO,12000,48000,3180,96,174000,12000,2660,78,139000
Technical SEO,9000,24000,980,22,61000,11000,860,19,52000
Backlink Content,15000,36000,1740,38,83000,14000,1420,30,64000`,
  social: `channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue
Instagram Reels,28000,360000,5120,96,148000,24000,4380,72,113000
Facebook Posts,16000,210000,2680,48,72000,18000,2860,44,69000
Threads,6000,98000,1320,18,26000,4000,760,9,12000
Influencer,42000,180000,3840,82,196000,36000,3120,64,150000
LINE Community,9000,52000,1180,36,65000,8000,940,28,48000`,
};

const requiredColumns = ["channel", "spend", "impressions", "clicks", "conversions", "revenue"];
const optionalColumns = ["last_spend", "last_clicks", "last_conversions", "last_revenue"];
const palette = ["#0f766e", "#2563a8", "#a16207", "#be3f62", "#64748b", "#6d5aa7"];
const chartHits = new Map();
const appState = { metrics: null, channels: [], money: null, selectedChannel: null, chartMode: "overview", lastGeneratedAt: null, lastExportedAt: null, lastReviewedAt: null, templates: [], clients: [], reports: [], dataSources: [], intakes: [], consents: [], teamMembers: [], aiRuns: [], schedules: [], deliveries: [], shareLinks: [], emailJobs: [], invoices: [], billingIntents: [], portalInvites: [], portalSubmissions: [], auditLogs: [], account: null, checkout: null, auth: null, apiOnline: false };
const uiState = {
  lang: localStorage.getItem("agencyReportLang") || "zh",
  workspaceView: localStorage.getItem("agencyReportWorkspaceView") || "overview",
  appPage: localStorage.getItem("agencyReportAppPage") || "home",
  theme: localStorage.getItem("agencyReportTheme") || "dark",
};
const workspaceNavLabels = {
  zh: { overview: "總覽", case: "案件", data: "資料", ai: "AI", delivery: "交付", billing: "帳務", settings: "設定" },
  en: { overview: "Overview", case: "Case", data: "Data", ai: "AI", delivery: "Delivery", billing: "Billing", settings: "Settings" },
};
const i18n = {
  zh: {
    appTitle: "代理商 AI 月報解讀與交付工具",
    csvHint: "必填欄位：channel, spend, impressions, clicks, conversions, revenue。可選欄位：last_spend, last_clicks, last_conversions, last_revenue。幣別只改變顯示格式，不做匯率換算。",
    healthScoreLabel: "本月健康分",
    loadDemo: "載入範例",
    saveTemplate: "儲存模板",
    exportHtml: "匯出 HTML",
    printPdf: "列印 PDF",
    authTitle: "工作台登入",
    authCopy: "登入後才能管理客戶、報告、付款與 AI 自動化流程。",
    authName: "名稱 / 公司",
    authPassword: "密碼",
    login: "登入",
    register: "建立帳號",
    logout: "登出",
    authReady: "已登入",
    authRegistered: "帳號已建立並登入",
    authFailed: "登入失敗",
    authLoginHint: "帳號不存在或密碼不正確。若尚未註冊，請按「建立帳號」。",
    authRegisterHint: "無法建立帳號。若 Email 已註冊，請直接登入或換一個 Email。",
    caseLabel: "目前案件",
    reportSettings: "報告設定",
    settingsCopy: "將 Sheets / CSV 數據轉成客戶看得懂的月報。",
    clientTemplate: "客戶模板",
    sampleReport: "報告範例",
    agencyBrand: "代理商品牌",
    clientName: "客戶名稱",
    reportMonth: "報告月份",
    reportType: "報告類型",
    currency: "幣別",
    tone: "報告語氣",
    dataSource: "資料來源",
    dataSourceCopy: "建議用 Google Sheets 發佈成 CSV。",
    importSheets: "從 Sheets 匯入",
    importCsv: "匯入 CSV",
    csvData: "CSV 數據",
    generateReport: "產生報告",
    done: "完成",
    saved: "已儲存",
    loading: "處理中...",
    executiveSummary: "高層摘要",
    executiveSummaryCopy: "給客戶決策者看的 60 秒重點。",
    coreKpi: "核心 KPI",
    coreKpiCopy: "總量、效率與上月比較。",
    automationTitle: "自動化導入架構",
    automationCopy: "不取代 Looker Studio，而是補上月報敘事與交付層。",
    autoDataTitle: "資料串接",
    autoDataCopy: "Supermetrics、官方 API 或 Sheets 匯出 CSV，集中 Google Ads、Meta、GA4、Search Console 等資料。",
    autoDashboardTitle: "即時看板",
    autoDashboardCopy: "Looker Studio 負責每日監控、日期篩選與品牌化儀表板。",
    autoNarrativeTitle: "AI 月報解讀",
    autoNarrativeCopy: "AgencyReport AI 將數字轉成摘要、風險、洞察與下月行動。",
    autoDeliveryTitle: "交付自動化",
    autoDeliveryCopy: "Zapier / Make 每月觸發提醒、更新資料、寄送草稿給 PM。",
    interactiveAnalytics: "互動視覺分析",
    interactiveAnalyticsCopy: "切換模式、點選渠道，快速找到成長與浪費來源。",
    overview: "總覽",
    efficiency: "效率",
    growth: "成長",
    trendChartTitle: "本月 vs 上月變化",
    revenueChartTitle: "渠道營收占比",
    roasChartTitle: "渠道 ROAS 排名",
    funnelChartTitle: "轉換漏斗",
    quadrantChartTitle: "效率象限",
    channelPerformance: "渠道表現",
    channelPerformanceCopy: "依 ROAS 與效率排序。",
    efficiencyDiagnosis: "效率診斷",
    efficiencyDiagnosisCopy: "把數字翻成可執行判斷。",
    aiInsight: "AI 成效解讀",
    aiInsightCopy: "可直接貼進客戶月報的說明文字。",
    riskAlerts: "風險提醒",
    riskAlertsCopy: "需要 PM 優先處理的異常訊號。",
    nextActions: "下月行動建議",
    nextActionsCopy: "具體、可追蹤、可交辦。",
    detailData: "渠道明細資料",
    detailDataCopy: "給 PM 或投手核對的完整數字。",
    channel: "渠道",
    spend: "花費",
    clicks: "點擊",
    conversions: "轉換",
    revenue: "營收",
    pricingTitle: "產品化服務方案",
    pricingCopy: "用來測試第一批代理商付費意願。",
    starterPrice: "NT$790/月",
    starterCopy: "每月 10 份月報、CSV/Sheets 匯入、AI 建議、PDF/HTML 匯出。",
    agencyPrice: "NT$2,490/月",
    agencyCopy: "每月 50 份月報、多客戶、品牌化報告、AI 下月建議、付款/交付紀錄。",
    whiteLabelPrice: "NT$5,990/月",
    whiteLabelCopy: "更高月報量、客戶入口、排程、Email 草稿、白標與進階 AI 分析。",
    leadTitle: "預約試用 / 留下需求",
    leadCopy: "先收集有興趣的代理商名單，不必等完整 SaaS 才開始賣。",
    saveLead: "儲存名單",
    leadNamePlaceholder: "姓名 / 公司",
    leadEmailPlaceholder: "Email",
    quickStart: "快速開始",
    stepOne: "選一個範例或客戶模板。",
    stepTwo: "貼上 CSV，或從 Google Sheets 匯入。",
    stepThree: "產生報告後列印 PDF 或匯出 HTML。",
    launchAssistantTitle: "上線助手",
    launchAssistantCopy: "一鍵準備可展示、可留資、可交付的 Demo 案件。",
    launchReadiness: "上線準備度",
    completeDemoSetup: "一鍵完成 Demo 設定",
    launchNeed: "客戶需求",
    launchData: "資料來源",
    launchAutomation: "自動化排程",
    launchDelivery: "交付 Email",
    launchReport: "報告已產生",
    launchExport: "HTML 可交付",
    launchBackend: "後端 API",
    launchReady: "完成",
    launchMissing: "待補",
    healthHubTitle: "整合健康",
    healthHubCopy: "快速檢查資料、AI、排程、交付、付款與權限狀態。",
    healthHubScore: "營運健康分數",
    healthApi: "後端 API",
    healthData: "資料來源",
    healthConsent: "授權",
    healthTeam: "團隊",
    healthAi: "AI 草稿",
    healthSchedule: "排程",
    healthDelivery: "交付",
    healthPayment: "付款",
    healthOk: "正常",
    healthWarn: "待設定",
    copyCsvTemplate: "插入 CSV 範本",
    downloadSample: "下載範例 CSV",
    clearLocal: "清除本機資料",
    deployChecklist: "公開部署前檢查",
    checkNoBackend: "無後端即可展示",
    checkNoSensitive: "資料只存在使用者瀏覽器",
    checkExport: "支援 PDF / HTML 交付",
    checkPayment: "正式收費前接付款與帳號",
    autopilotTitle: "AI Autopilot",
    autopilotCopy: "讓客戶用自然語言描述需求，系統自動配置報告。",
    clientRequest: "客戶需求",
    clientRequestPlaceholder: "例：我們是牙醫診所，想知道這個月 Google Ads 和 Meta 哪個帶來更多預約，並降低 CPA。",
    businessType: "產業",
    automationLevel: "自動化程度",
    runAutopilot: "AI 自動配置案件",
    aiWorkOrderTitle: "AI 工作單",
    aiWorkOrderCopy: "把客戶需求轉成可執行的分析任務與回覆草稿。",
    autopilotDone: "AI 已完成案件配置",
    workGoal: "目標",
    workKpis: "KPI 焦點",
    workData: "需要資料",
    workActions: "自動化動作",
    workReply: "客戶回覆草稿",
    deliveryEmail: "交付 Email",
    deliveryEmailPlaceholder: "client@example.com",
    scheduleCadence: "交付排程",
    automationOpsTitle: "全自動化營運控制台",
    automationOpsCopy: "把需求、資料、AI 分析、審核與交付串成可營利流程。",
    readinessScore: "自動化成熟度",
    readinessData: "資料狀態",
    readinessAi: "AI 產出",
    readinessDelivery: "交付設定",
    readinessReview: "審核模式",
    ready: "已就緒",
    needsSetup: "待設定",
    backendConnected: "後端已連線",
    backendFallback: "本機暫存模式",
    scheduleManual: "手動審核後交付",
    scheduleMonthly: "每月 1 號自動產草稿",
    scheduleWeekly: "每週一自動產草稿",
    progressTitle: "專案完成進度",
    progressCopy: "目前可展示、可測試收費；正式營利前仍需後端與第三方串接。",
    progressMvp: "MVP 產品體驗",
    progressMvpBody: "報告產生、互動圖表、AI 工作單、語系切換與匯出流程已可展示。",
    progressRevenue: "營利化準備",
    progressRevenueBody: "已具備方案、留資表單與上線助手，可開始找 5-10 家代理商測試付費意願。",
    progressAutomation: "全自動化能力",
    progressAutomationBody: "目前是前端規則型 Autopilot；正式版需接後端 AI agent、OAuth、排程與 Email。",
    progressDeploy: "公開部署準備",
    progressDeployBody: "可部署靜態頁；正式收費前需補登入、資料庫、付款、隱私條款與審核紀錄。",
    progressDone: "已完成",
    progressTesting: "可測試",
    progressNeeded: "需後端",
    completionTitle: "本階段交付清單",
    completionCopy: "截圖中的進度項目已整理成可驗證的產品功能。",
    completeAutopilotInput: "加入 AI Autopilot 需求輸入區",
    completeAutopilotInputBody: "左側已提供客戶需求 textarea、CPA / ROAS / SEO 快速需求、產業、自動化程度、Email 與排程設定。",
    completeParsing: "實作需求解析與自動配置",
    completeParsingBody: "系統會從需求文字判斷 Ads / SEO / Social、KPI 焦點、語氣、資料需求，並自動套用對應報告樣板。",
    completeWorkOrder: "產出 AI 工作單與客戶回覆草稿",
    completeWorkOrderBody: "報告頁已產生目標、KPI、需要資料、自動化動作、客戶回覆草稿，並同步到自動化營運控制台。",
    completePolish: "補樣式與 README 自動化路線",
    completePolishBody: "已加入 Launch Assistant、完成度面板、營運控制台、雙語文案、產品化定價與 README 後端路線。",
    completeQa: "本機驗證新功能",
    completeQaBody: "已用本機瀏覽器驗證圖表、AI 工作單、營運控制台、Launch Readiness、英文殘留掃描與 console errors。",
    completionEvidence: "驗證",
    clientHubTitle: "客戶管理",
    clientHubCopy: "建立客戶紀錄並檢查方案用量。",
    planLabel: "方案",
    apiModeLabel: "資料模式",
    clientCount: "客戶數",
    reportUsage: "報告用量",
    saveClient: "儲存客戶",
    syncClients: "同步資料",
    createPortalInvite: "建立客戶入口",
    portalInviteCreated: "客戶入口已建立",
    portalInviteReady: "客戶入口",
    noPortalInvites: "尚未建立客戶入口",
    portalTitle: "客戶需求入口",
    portalCopy: "請填寫本月目標、資料來源與補充說明，系統會交給代理商與 AI 工作流接續處理。",
    portalContact: "聯絡 Email",
    portalGoal: "本月目標",
    portalGoalPlaceholder: "例：降低 CPA、提高 ROAS、比較 Google Ads 與 Meta 成效。",
    portalSource: "資料來源或 Sheets URL",
    portalNotes: "補充說明",
    portalNotesPlaceholder: "可貼上活動名稱、預算變動、特殊檔期或希望報告回答的問題。",
    submitPortal: "送出需求",
    portalSubmitted: "需求已送出",
    portalMissing: "請填寫目標或資料來源",
    portalSubmissionReady: "客戶提交",
    noPortalSubmissions: "尚未收到客戶提交",
    refreshPortalSubmissions: "刷新客戶提交",
    applyPortalSubmission: "套用最新提交",
    portalSubmissionApplied: "已套用客戶提交",
    processPortalSubmission: "自動建案",
    portalSubmissionProcessed: "已自動建立案件",
    portalAlreadyProcessed: "沒有待處理提交",
    runPortalAiDraft: "建案 + AI 草稿",
    portalAiDraftCreated: "AI 草稿已產生",
    noClients: "尚未建立客戶",
    clientSaved: "客戶已儲存",
    clientSynced: "資料已同步",
    clientLimitWarning: "已接近方案限制",
    reportLibraryTitle: "報告庫",
    reportLibraryCopy: "保存與查看最近報告版本。",
    savedReports: "已保存報告",
    latestReport: "最近報告",
    saveReport: "保存目前報告",
    reportSaved: "報告已保存",
    noReports: "尚未保存報告",
    billingTitle: "帳號與付款",
    billingCopy: "建立代理商帳號並產生付款草稿。",
    accountName: "帳號名稱",
    accountEmail: "帳號 Email",
    accountNamePlaceholder: "Northstar Marketing",
    accountEmailPlaceholder: "owner@example.com",
    selectedPlan: "目前方案",
    checkoutStatus: "付款狀態",
    saveAccount: "儲存帳號",
    createCheckout: "建立付款草稿",
    createInvoice: "建立發票草稿",
    accountSaved: "帳號已儲存",
    checkoutCreated: "付款草稿已建立",
    checkoutDraft: "草稿",
    invoiceCreated: "發票草稿已建立",
    invoiceReady: "發票草稿",
    noInvoices: "尚未建立發票",
    paymentSetup: "付款設定",
    accessTitle: "團隊權限",
    accessCopy: "邀請 PM、媒體投手或管理員，建立基本工作區權限。",
    memberEmail: "成員 Email",
    memberRole: "角色",
    inviteMember: "邀請成員",
    memberInvited: "成員已邀請",
    teamReady: "團隊成員",
    noMembers: "尚未邀請成員",
    deliveryCenterTitle: "PM 審核與交付中心",
    deliveryCenterCopy: "審核報告、建立交付紀錄，之後可串接 Email / PDF。",
    approveDraft: "標記已審核",
    createShareLink: "建立分享連結",
    shareLinkCreated: "分享連結已建立",
    shareLinkReady: "分享連結",
    noShareLinks: "尚未建立分享連結",
    queueEmail: "排入 Email",
    emailQueued: "Email 已排入佇列",
    emailQueueReady: "Email 佇列",
    noEmailJobs: "尚未排入 Email",
    deliverReport: "建立交付紀錄",
    reviewStatus: "審核狀態",
    deliveryStatus: "交付狀態",
    deliveryHistory: "交付紀錄",
    reviewed: "已審核",
    notReviewed: "待審核",
    delivered: "已交付",
    notDelivered: "待交付",
    noDeliveries: "尚無交付紀錄",
    deliveryRecord: "交付紀錄",
    agentBackendTitle: "後端 AI 與排程",
    agentBackendCopy: "產生後端 AI 草稿並建立固定重跑排程。",
    runBackendAi: "執行後端 AI",
    createSchedule: "建立排程",
    backendAiRun: "後端 AI 草稿",
    scheduleSaved: "排程已建立",
    noBackendAiRun: "尚未執行後端 AI",
    noSchedule: "尚未建立排程",
    sourceType: "資料來源類型",
    sourceOwner: "來源負責人",
    testSource: "測試來源",
    saveSource: "保存來源",
    sourceSaved: "資料來源已保存",
    sourceTested: "來源可讀取",
    sourceNeedsUrl: "請先填入 Sheets URL 或貼上 CSV",
    sourceSavedItem: "資料來源已保存",
    sourceReady: "資料來源已保存",
    noSources: "尚未保存資料來源",
    auditTitle: "稽核紀錄",
    auditCopy: "追蹤 API 操作，方便客服、除錯與上線合規。",
    auditEvents: "事件數",
    auditStatus: "狀態",
    refreshAudit: "刷新紀錄",
    auditReady: "已啟用",
    auditOffline: "需後端",
    noAuditLogs: "尚無稽核紀錄",
    intakeTitle: "客戶需求 Intake",
    intakeCopy: "保存客戶需求，讓後端 AI 與客服可以接續處理。",
    saveIntake: "送出需求",
    intakeSaved: "需求已送出",
    intakeReady: "需求已保存",
    noIntake: "尚未送出需求",
    trustTitle: "信任與授權",
    trustCopy: "保存資料處理與 AI 分析授權，正式上線前必備。",
    consentData: "客戶同意匯入與處理廣告 / 分析資料。",
    consentAi: "客戶同意使用 AI 產出分析草稿。",
    consentDelivery: "客戶同意以 Email / PDF / HTML 交付報告。",
    saveConsent: "保存授權",
    consentSaved: "授權已保存",
    consentReady: "授權已保存",
    consentMissing: "請勾選所有必要授權",
    noConsent: "尚未保存授權",
  },
  en: {
    appTitle: "AI Monthly Reporting and Delivery Tool for Agencies",
    csvHint: "Required fields: channel, spend, impressions, clicks, conversions, revenue. Optional fields: last_spend, last_clicks, last_conversions, last_revenue. Currency changes display formatting only; it does not convert exchange rates.",
    healthScoreLabel: "Monthly Health Score",
    loadDemo: "Load Sample",
    saveTemplate: "Save Template",
    exportHtml: "Export HTML",
    printPdf: "Print PDF",
    authTitle: "Workspace Login",
    authCopy: "Sign in to manage clients, reports, billing, and AI automation workflows.",
    authName: "Name / Company",
    authPassword: "Password",
    login: "Login",
    register: "Create Account",
    logout: "Logout",
    authReady: "Signed in",
    authRegistered: "Account created and signed in",
    authFailed: "Authentication failed",
    authLoginHint: "Account not found or password is incorrect. If this is your first time, click Create Account.",
    authRegisterHint: "Could not create the account. If this email already exists, sign in or use another email.",
    caseLabel: "Current Case",
    reportSettings: "Report Setup",
    settingsCopy: "Turn Sheets / CSV data into client-ready monthly reports.",
    clientTemplate: "Client Template",
    sampleReport: "Sample Report",
    agencyBrand: "Agency Brand",
    clientName: "Client Name",
    reportMonth: "Report Month",
    reportType: "Report Type",
    currency: "Currency",
    tone: "Narrative Tone",
    dataSource: "Data Source",
    dataSourceCopy: "Use a published Google Sheets CSV for the fastest workflow.",
    importSheets: "Import Sheets",
    importCsv: "Import CSV",
    csvData: "CSV Data",
    generateReport: "Generate Report",
    done: "Done",
    saved: "Saved",
    loading: "Working...",
    executiveSummary: "Executive Summary",
    executiveSummaryCopy: "A 60-second read for client decision makers.",
    coreKpi: "Core KPIs",
    coreKpiCopy: "Volume, efficiency, and month-over-month comparison.",
    automationTitle: "Agency Automation Stack",
    automationCopy: "Keep Looker Studio for dashboards; use this layer for narrative and delivery.",
    autoDataTitle: "Data Integration",
    autoDataCopy: "Centralize Google Ads, Meta, GA4, Search Console, and Sheets exports.",
    autoDashboardTitle: "Live Dashboard",
    autoDashboardCopy: "Looker Studio handles daily monitoring, date filters, and branded dashboards.",
    autoNarrativeTitle: "AI Monthly Narrative",
    autoNarrativeCopy: "AgencyReport AI turns numbers into summaries, risks, insights, and next actions.",
    autoDeliveryTitle: "Delivery Automation",
    autoDeliveryCopy: "Zapier / Make can trigger monthly reminders, data updates, and PM drafts.",
    interactiveAnalytics: "Interactive Analytics",
    interactiveAnalyticsCopy: "Switch modes and select channels to find growth and waste quickly.",
    overview: "Overview",
    efficiency: "Efficiency",
    growth: "Growth",
    trendChartTitle: "This Month vs Last Month",
    revenueChartTitle: "Revenue Share by Channel",
    roasChartTitle: "ROAS Ranking",
    funnelChartTitle: "Conversion Funnel",
    quadrantChartTitle: "Efficiency Quadrant",
    channelPerformance: "Channel Performance",
    channelPerformanceCopy: "Sorted by ROAS and efficiency.",
    efficiencyDiagnosis: "Efficiency Diagnosis",
    efficiencyDiagnosisCopy: "Turn raw metrics into operational judgment.",
    aiInsight: "AI Performance Insight",
    aiInsightCopy: "Client-ready narrative for the monthly report.",
    riskAlerts: "Risk Alerts",
    riskAlertsCopy: "Signals the PM should prioritize.",
    nextActions: "Next-Month Actions",
    nextActionsCopy: "Specific, trackable, and assignable.",
    detailData: "Channel Detail Data",
    detailDataCopy: "Full numbers for PMs or media buyers to verify.",
    channel: "Channel",
    spend: "Spend",
    clicks: "Clicks",
    conversions: "Conversions",
    revenue: "Revenue",
    pricingTitle: "Productized Service Plans",
    pricingCopy: "Use these packages to validate early agency willingness to pay.",
    starterPrice: "US$25/mo",
    starterCopy: "10 monthly reports, CSV/Sheets import, AI recommendations, PDF/HTML export.",
    agencyPrice: "US$79/mo",
    agencyCopy: "50 monthly reports, multi-client workspace, branded reports, AI next actions, payment/delivery records.",
    whiteLabelPrice: "US$189/mo",
    whiteLabelCopy: "Higher report volume, client portal, scheduling, email drafts, white label, and advanced AI analysis.",
    leadTitle: "Book a Trial / Leave Requirements",
    leadCopy: "Collect interested agencies before building the full SaaS.",
    saveLead: "Save Lead",
    leadNamePlaceholder: "Name / Company",
    leadEmailPlaceholder: "Email",
    quickStart: "Quick Start",
    stepOne: "Choose a sample or client template.",
    stepTwo: "Paste CSV data or import from Google Sheets.",
    stepThree: "Generate the report, then print PDF or export HTML.",
    launchAssistantTitle: "Launch Assistant",
    launchAssistantCopy: "Prepare a demo-ready, lead-ready, deliverable case in one click.",
    launchReadiness: "Launch Readiness",
    completeDemoSetup: "Complete Demo Setup",
    launchNeed: "Client Request",
    launchData: "Data Source",
    launchAutomation: "Automation Schedule",
    launchDelivery: "Delivery Email",
    launchReport: "Report Generated",
    launchExport: "HTML Deliverable",
    launchBackend: "Backend API",
    launchReady: "Done",
    launchMissing: "Missing",
    healthHubTitle: "Integration Health",
    healthHubCopy: "Quickly check data, AI, schedule, delivery, payment, and access status.",
    healthHubScore: "Operations Health Score",
    healthApi: "Backend API",
    healthData: "Data Source",
    healthConsent: "Consent",
    healthTeam: "Team",
    healthAi: "AI Draft",
    healthSchedule: "Schedule",
    healthDelivery: "Delivery",
    healthPayment: "Payment",
    healthOk: "Healthy",
    healthWarn: "Needs setup",
    copyCsvTemplate: "Insert CSV Template",
    downloadSample: "Download Sample CSV",
    clearLocal: "Clear Local Data",
    deployChecklist: "Pre-Launch Checklist",
    checkNoBackend: "Demo-ready without a backend",
    checkNoSensitive: "Data stays in the user's browser",
    checkExport: "PDF / HTML delivery supported",
    checkPayment: "Add payments and accounts before charging",
    autopilotTitle: "AI Autopilot",
    autopilotCopy: "Let clients describe needs in plain language and auto-configure the report.",
    clientRequest: "Client Request",
    clientRequestPlaceholder: "Example: We are a dental clinic and want to know whether Google Ads or Meta drove more bookings this month while reducing CPA.",
    businessType: "Industry",
    automationLevel: "Automation Level",
    runAutopilot: "Auto-Configure Case",
    aiWorkOrderTitle: "AI Work Order",
    aiWorkOrderCopy: "Turn client needs into analysis tasks and a response draft.",
    autopilotDone: "AI case configuration completed",
    workGoal: "Goal",
    workKpis: "KPI Focus",
    workData: "Required Data",
    workActions: "Automation Actions",
    workReply: "Client Reply Draft",
    deliveryEmail: "Delivery Email",
    deliveryEmailPlaceholder: "client@example.com",
    scheduleCadence: "Delivery Schedule",
    automationOpsTitle: "Automation Operations Console",
    automationOpsCopy: "Connect requirements, data, AI analysis, review, and delivery into a sellable workflow.",
    readinessScore: "Automation Readiness",
    readinessData: "Data Status",
    readinessAi: "AI Output",
    readinessDelivery: "Delivery Setup",
    readinessReview: "Review Mode",
    ready: "Ready",
    needsSetup: "Needs setup",
    backendConnected: "Backend connected",
    backendFallback: "Local fallback mode",
    scheduleManual: "Manual delivery after review",
    scheduleMonthly: "Monthly draft on the 1st",
    scheduleWeekly: "Weekly draft every Monday",
    progressTitle: "Project Completion Progress",
    progressCopy: "Demo-ready and payment-validation-ready; backend and third-party integrations are still required before full commercialization.",
    progressMvp: "MVP Product Experience",
    progressMvpBody: "Report generation, interactive charts, AI work orders, localization, and export flows are demo-ready.",
    progressRevenue: "Revenue Readiness",
    progressRevenueBody: "Pricing, lead capture, and Launch Assistant are ready for testing willingness to pay with 5-10 agencies.",
    progressAutomation: "Full Automation Capability",
    progressAutomationBody: "Current Autopilot is a frontend rules fallback; production needs backend AI agents, OAuth, scheduler, and email.",
    progressDeploy: "Public Deployment Readiness",
    progressDeployBody: "Static deployment is ready; paid launch still needs login, database, payments, privacy terms, and audit logs.",
    progressDone: "Done",
    progressTesting: "Testable",
    progressNeeded: "Backend needed",
    completionTitle: "Current Delivery Checklist",
    completionCopy: "The progress items from the screenshot are now mapped to verifiable product features.",
    completeAutopilotInput: "Add AI Autopilot requirement input",
    completeAutopilotInputBody: "The sidebar now includes client request input, CPA / ROAS / SEO presets, industry, automation level, email, and schedule settings.",
    completeParsing: "Implement requirement parsing and auto-configuration",
    completeParsingBody: "The app infers Ads / SEO / Social, KPI focus, tone, data needs, and applies the closest report template.",
    completeWorkOrder: "Generate AI work orders and client reply drafts",
    completeWorkOrderBody: "The report now renders goal, KPIs, required data, automation actions, client reply draft, and syncs with the operations console.",
    completePolish: "Polish styles and README automation roadmap",
    completePolishBody: "Launch Assistant, progress panel, operations console, bilingual copy, productized pricing, and README backend roadmap are in place.",
    completeQa: "Verify new features locally",
    completeQaBody: "Local browser QA covered charts, AI work orders, operations console, Launch Readiness, English remnant scan, and console errors.",
    completionEvidence: "Evidence",
    clientHubTitle: "Client Management",
    clientHubCopy: "Create client records and check plan usage.",
    planLabel: "Plan",
    apiModeLabel: "Data Mode",
    clientCount: "Clients",
    reportUsage: "Report Usage",
    saveClient: "Save Client",
    syncClients: "Sync Data",
    createPortalInvite: "Create Client Portal",
    portalInviteCreated: "Client portal created",
    portalInviteReady: "Client Portal",
    noPortalInvites: "No client portals yet",
    portalTitle: "Client Request Portal",
    portalCopy: "Share this month's goals, data source, and notes so the agency and AI workflow can continue.",
    portalContact: "Contact Email",
    portalGoal: "This Month's Goal",
    portalGoalPlaceholder: "Example: reduce CPA, improve ROAS, and compare Google Ads with Meta performance.",
    portalSource: "Data Source or Sheets URL",
    portalNotes: "Notes",
    portalNotesPlaceholder: "Add campaign names, budget changes, seasonal context, or questions the report should answer.",
    submitPortal: "Submit Request",
    portalSubmitted: "Request submitted",
    portalMissing: "Add a goal or data source",
    portalSubmissionReady: "Client Submission",
    noPortalSubmissions: "No client submissions yet",
    refreshPortalSubmissions: "Refresh Submissions",
    applyPortalSubmission: "Apply Latest Submission",
    portalSubmissionApplied: "Client submission applied",
    processPortalSubmission: "Auto-Create Case",
    portalSubmissionProcessed: "Case auto-created",
    portalAlreadyProcessed: "No pending submissions",
    runPortalAiDraft: "Case + AI Draft",
    portalAiDraftCreated: "AI draft created",
    noClients: "No clients yet",
    clientSaved: "Client saved",
    clientSynced: "Data synced",
    clientLimitWarning: "Plan limit is close",
    reportLibraryTitle: "Report Library",
    reportLibraryCopy: "Save and review recent report versions.",
    savedReports: "Saved Reports",
    latestReport: "Latest Report",
    saveReport: "Save Current Report",
    reportSaved: "Report saved",
    noReports: "No saved reports yet",
    billingTitle: "Account & Billing",
    billingCopy: "Create an agency account and generate a checkout draft.",
    accountName: "Account Name",
    accountEmail: "Account Email",
    accountNamePlaceholder: "Northstar Marketing",
    accountEmailPlaceholder: "owner@example.com",
    selectedPlan: "Selected Plan",
    checkoutStatus: "Payment Status",
    saveAccount: "Save Account",
    createCheckout: "Create Checkout Draft",
    createInvoice: "Create Invoice Draft",
    accountSaved: "Account saved",
    checkoutCreated: "Checkout draft created",
    checkoutDraft: "Draft",
    invoiceCreated: "Invoice draft created",
    invoiceReady: "Invoice Draft",
    noInvoices: "No invoices yet",
    paymentSetup: "Payment Setup",
    accessTitle: "Team Access",
    accessCopy: "Invite PMs, media buyers, or admins and define basic workspace roles.",
    memberEmail: "Member Email",
    memberRole: "Role",
    inviteMember: "Invite Member",
    memberInvited: "Member invited",
    teamReady: "Team Member",
    noMembers: "No members invited yet",
    deliveryCenterTitle: "PM Review & Delivery Center",
    deliveryCenterCopy: "Review the report, create delivery records, and later connect Email / PDF.",
    approveDraft: "Mark Reviewed",
    createShareLink: "Create Share Link",
    shareLinkCreated: "Share link created",
    shareLinkReady: "Share Link",
    noShareLinks: "No share links yet",
    queueEmail: "Queue Email",
    emailQueued: "Email queued",
    emailQueueReady: "Email Queue",
    noEmailJobs: "No email jobs yet",
    deliverReport: "Create Delivery Record",
    reviewStatus: "Review Status",
    deliveryStatus: "Delivery Status",
    deliveryHistory: "Delivery History",
    reviewed: "Reviewed",
    notReviewed: "Pending Review",
    delivered: "Delivered",
    notDelivered: "Pending Delivery",
    noDeliveries: "No deliveries yet",
    deliveryRecord: "Delivery Record",
    agentBackendTitle: "Backend AI & Schedule",
    agentBackendCopy: "Generate a backend AI draft and create a recurring run schedule.",
    runBackendAi: "Run Backend AI",
    createSchedule: "Create Schedule",
    backendAiRun: "Backend AI Draft",
    scheduleSaved: "Schedule saved",
    noBackendAiRun: "No backend AI run yet",
    noSchedule: "No schedule yet",
    sourceType: "Source Type",
    sourceOwner: "Source Owner",
    testSource: "Test Source",
    saveSource: "Save Source",
    sourceSaved: "Data source saved",
    sourceTested: "Source is readable",
    sourceNeedsUrl: "Add a Sheets URL or paste CSV first",
    sourceSavedItem: "Saved Data Source",
    sourceReady: "Data Source Saved",
    noSources: "No saved data sources yet",
    auditTitle: "Audit Log",
    auditCopy: "Track API operations for support, debugging, and launch compliance.",
    auditEvents: "Events",
    auditStatus: "Status",
    refreshAudit: "Refresh Logs",
    auditReady: "Enabled",
    auditOffline: "Backend needed",
    noAuditLogs: "No audit events yet",
    intakeTitle: "Client Intake",
    intakeCopy: "Save client requirements so backend AI and support can continue the workflow.",
    saveIntake: "Submit Intake",
    intakeSaved: "Intake submitted",
    intakeReady: "Intake Saved",
    noIntake: "No intake submitted yet",
    trustTitle: "Trust & Consent",
    trustCopy: "Save data processing and AI analysis consent before public launch.",
    consentData: "Client agrees to import and process advertising / analytics data.",
    consentAi: "Client agrees to use AI for analysis drafts.",
    consentDelivery: "Client agrees to receive reports by Email / PDF / HTML.",
    saveConsent: "Save Consent",
    consentSaved: "Consent saved",
    consentReady: "Consent Saved",
    consentMissing: "Check all required consent items",
    noConsent: "No consent saved yet",
  },
};

Object.assign(i18n.zh, {
  appTitle: "代理商 AI 月報產生器",
  loadDemo: "載入範例",
  saveTemplate: "儲存範本",
  exportHtml: "匯出 HTML",
  printPdf: "列印 PDF",
  authTitle: "工作台登入",
  authCopy: "登入後即可管理客戶、月報、付款與 AI 自動化流程。",
  authName: "名稱 / 公司",
  authPassword: "密碼",
  login: "登入",
  register: "建立帳號",
  logout: "登出",
  caseLabel: "目前案件",
  reportSettings: "2. 月報基本資料",
  settingsCopy: "填入代理商、客戶、月份與報告類型，系統會套用到月報。",
  agencyBrand: "代理商品牌",
  clientName: "客戶名稱",
  reportMonth: "報告月份",
  reportType: "報告類型",
  currency: "幣別",
  dataSource: "3. 匯入資料",
  dataSourceCopy: "貼上 Google Sheets CSV 連結，或直接貼上 CSV 資料即可產生月報。",
  importSheets: "匯入 Sheets",
  importCsv: "匯入 CSV",
  csvData: "CSV 資料",
  generateReport: "產生月報",
  copyCsvTemplate: "插入 CSV 範本",
  downloadSample: "下載範例 CSV",
  clearLocal: "清除本機資料",
  autopilotTitle: "1. 輸入客戶需求",
  autopilotCopy: "用一句話描述客戶想知道什麼，AI 會協助整理月報重點。",
  clientRequest: "客戶需求",
  clientRequestPlaceholder: "例：我們是牙醫診所，想知道這個月 Google Ads 和 Meta 哪個帶來更多預約，並降低 CPA。",
  businessType: "產業",
  automationLevel: "自動化程度",
  runAutopilot: "自動設定案件",
  sourceNeedsUrl: "請先貼上 Sheets URL 或 CSV 資料",
  noSources: "尚未儲存資料來源",
  starterPlanName: "入門版",
  agencyPlanName: "代理商版",
  professionalPlanName: "專業版",
});

Object.assign(i18n.en, {
  appTitle: "Agency AI Monthly Report Generator",
  reportSettings: "2. Report Basics",
  settingsCopy: "Enter agency, client, month, and report type. These details will be applied to the monthly report.",
  dataSource: "3. Import Data",
  dataSourceCopy: "Paste a published Google Sheets CSV link, or paste CSV data directly to generate the monthly report.",
  generateReport: "Generate Monthly Report",
  autopilotTitle: "1. Enter Client Request",
  autopilotCopy: "Describe what the client wants to understand. AI will organize the report focus.",
  starterPlanName: "Starter",
  agencyPlanName: "Agency",
  professionalPlanName: "Professional",
});

function t(key) {
  return i18n[uiState.lang][key] || i18n.zh[key] || key;
}

function defaultClientName(sample, lang = uiState.lang) {
  const names = {
    zh: { ads: "晨光牙醫診所", seo: "山森露營用品", social: "禾日甜點工作室" },
    en: { ads: "Bright Smile Dental", seo: "Summit Camp Gear", social: "Heri Dessert Studio" },
  };
  return names[lang][sample] || names[lang].ads;
}

function isDefaultClientName(value) {
  return ["zh", "en"].some((lang) => Object.values({
    ads: defaultClientName("ads", lang),
    seo: defaultClientName("seo", lang),
    social: defaultClientName("social", lang),
  }).includes(value));
}

function metricLabel(key) {
  const labels = {
    zh: { spend: "花費", clicks: "點擊", conversions: "轉換", revenue: "營收", impressions: "曝光", totalSpend: "總花費", selectedAll: "全部渠道", noMonth: "未設定" },
    en: { spend: "Spend", clicks: "Clicks", conversions: "Conversions", revenue: "Revenue", impressions: "Impressions", totalSpend: "Total Spend", selectedAll: "All Channels", noMonth: "No Month" },
  };
  return labels[uiState.lang][key];
}

const legalVersion = "legal-2026-06-06";

function legalText() {
  return uiState.lang === "en" ? {
    viewLegal: "View Terms & Privacy",
    leadConsent: "I agree to be contacted and to the privacy terms.",
    portalConsent: "I agree to data processing, AI analysis, and report delivery terms.",
    requiredTitle: "Consent required",
    requiredBody: "Please review and accept the terms before submitting.",
    close: "Close",
    title: "Terms, Privacy & Data Processing",
    updated: "Template version for MVP validation. Replace with counsel-reviewed terms before paid public launch.",
    sections: [
      ["Service scope", ["AgencyReport AI helps agencies create marketing reports, AI analysis drafts, client intake records, schedules, and delivery logs.", "Outputs are drafts and should be reviewed by the agency before client delivery."]],
      ["Data processing", ["Submitted campaign data, URLs, notes, emails, and client requirements are used to generate reports and operational records.", "Do not submit sensitive personal data unless your client has authorized processing."]],
      ["AI usage", ["AI-generated recommendations may be incomplete or inaccurate.", "The agency remains responsible for checking figures, strategy, claims, and client communications."]],
      ["Communication consent", ["Lead and portal submissions may be used to contact the submitter about trials, requirements, reports, and service follow-up.", "Users may request deletion or correction of submitted information."]],
    ],
  } : {
    viewLegal: "查看條款與隱私",
    leadConsent: "我同意被聯繫，並接受隱私與資料使用條款。",
    portalConsent: "我同意資料處理、AI 分析與報告交付條款。",
    requiredTitle: "需要同意條款",
    requiredBody: "送出前請先查看並勾選同意條款。",
    close: "關閉",
    title: "服務條款、隱私與資料處理說明",
    updated: "MVP 驗證用條款版本；正式公開收費前應替換為法務審閱版本。",
    sections: [
      ["服務範圍", ["AgencyReport AI 協助代理商建立行銷報告、AI 分析草稿、客戶需求紀錄、排程與交付紀錄。", "所有 AI 內容皆為草稿，交付客戶前仍需由代理商審核。"]],
      ["資料處理", ["提交的投放資料、網址、備註、Email 與客戶需求會用於產生報告與營運紀錄。", "除非已取得客戶授權，請勿提交敏感個資。"]],
      ["AI 使用", ["AI 建議可能不完整或不準確。", "代理商需負責確認數字、策略、聲明與客戶溝通內容。"]],
      ["聯繫同意", ["留資與客戶入口提交內容可用於試用聯繫、需求確認、報告交付與服務追蹤。", "提交者可要求刪除或更正已提交資訊。"]],
    ],
  };
}

function applyLegalText() {
  const copy = legalText();
  document.querySelectorAll("[data-legal-copy]").forEach((node) => {
    node.textContent = copy[node.dataset.legalCopy] || node.textContent;
  });
  const close = document.querySelector("#closeLegalBtn");
  if (close) close.textContent = copy.close;
}

function renderLegalPanel() {
  const copy = legalText();
  document.querySelector("#legalContent").innerHTML = `
    <div class="legal-doc">
      <div>
        <p class="eyebrow">AgencyReport AI · ${legalVersion}</p>
        <h2>${copy.title}</h2>
        <p>${copy.updated}</p>
      </div>
      ${copy.sections.map(([title, items]) => `
        <section>
          <h3>${title}</h3>
          <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
        </section>
      `).join("")}
    </div>
  `;
}

function showLegalPanel() {
  renderLegalPanel();
  document.querySelector("#legalPanel").hidden = false;
}

function hideLegalPanel() {
  document.querySelector("#legalPanel").hidden = true;
}

window.showLegalPanel = showLegalPanel;
window.hideLegalPanel = hideLegalPanel;

const fields = {
  templateSelect: document.querySelector("#templateSelect"),
  sampleSelect: document.querySelector("#sampleSelect"),
  agencyName: document.querySelector("#agencyName"),
  clientName: document.querySelector("#clientName"),
  reportMonth: document.querySelector("#reportMonth"),
  reportType: document.querySelector("#reportType"),
  currency: document.querySelector("#currency"),
  tone: document.querySelector("#tone"),
  sheetUrl: document.querySelector("#sheetUrl"),
  sourceType: document.querySelector("#sourceType"),
  sourceOwner: document.querySelector("#sourceOwner"),
  csvInput: document.querySelector("#csvInput"),
  clientRequest: document.querySelector("#clientRequest"),
  businessType: document.querySelector("#businessType"),
  automationLevel: document.querySelector("#automationLevel"),
  deliveryEmail: document.querySelector("#deliveryEmail"),
  scheduleCadence: document.querySelector("#scheduleCadence"),
  planSelect: document.querySelector("#planSelect"),
  accountName: document.querySelector("#accountName"),
  accountEmail: document.querySelector("#accountEmail"),
  memberEmail: document.querySelector("#memberEmail"),
  memberRole: document.querySelector("#memberRole"),
};

const numberFormatter = new Intl.NumberFormat("zh-TW");
const percentFormatter = new Intl.NumberFormat("zh-TW", { style: "percent", maximumFractionDigits: 1 });
const planLimits = {
  starter: { clients: 3, reports: 10, monthlyTwd: 790, monthlyUsd: 25 },
  agency: { clients: 15, reports: 50, monthlyTwd: 2490, monthlyUsd: 79 },
  whiteLabel: { clients: 60, reports: 180, monthlyTwd: 5990, monthlyUsd: 189 },
};

function moneyFormatter() {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: fields.currency.value,
    maximumFractionDigits: 0,
  });
}

function formatInvoiceAmount(invoice) {
  const currency = invoice.currency || fields.currency.value || "TWD";
  const amount = Number(invoice.amount || 0);
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBillingAmount(intent) {
  const currency = intent.currency || fields.currency.value || "TWD";
  const amount = Number(intent.amount || 0);
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function setDefaultMonth() {
  const now = new Date();
  fields.reportMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function setButtonState(button, state, labelKey) {
  const base = i18n[uiState.lang][labelKey] || button.textContent;
  button.classList.remove("is-loading", "is-success", "is-error");
  if (state === "loading") {
    button.classList.add("is-loading");
    button.disabled = true;
    button.textContent = i18n[uiState.lang].loading;
  } else if (state === "success") {
    button.classList.add("is-success");
    button.disabled = false;
    button.textContent = i18n[uiState.lang].done;
    setTimeout(() => {
      button.classList.remove("is-success");
      button.textContent = base;
    }, 1100);
  } else if (state === "error") {
    button.classList.add("is-error");
    button.disabled = false;
    setTimeout(() => {
      button.classList.remove("is-error");
      button.textContent = base;
    }, 1400);
  } else {
    button.disabled = false;
    button.textContent = base;
  }
}

function authToken() {
  return localStorage.getItem("agencyReportAuthToken") || "";
}

function setAuthState(auth) {
  appState.auth = auth;
  if (auth?.token) localStorage.setItem("agencyReportAuthToken", auth.token);
  const publicLanding = !appState.auth && !isPortalMode();
  const promptOpen = document.documentElement.classList.contains("auth-prompt-open");
  const authGate = document.querySelector("#authGate");
  document.querySelector("#logoutBtn").hidden = !appState.auth || isPortalMode();
  document.documentElement.classList.toggle("public-landing", publicLanding);
  document.documentElement.classList.toggle("auth-locked", publicLanding && promptOpen);
  authGate.hidden = !(publicLanding && promptOpen);
  authGate.toggleAttribute("hidden", !(publicLanding && promptOpen));
  if (auth && !isPortalMode()) setAppPage("case");
  updateAccountDock();
  const authStatus = document.querySelector("#authStatus");
  if (authStatus && auth) {
    authStatus.className = "status-panel ok";
    authStatus.innerHTML = `<strong>${t("authReady")}</strong><span>${auth.user?.email || auth.email || ""}</span>`;
  }
}

function showAuthGate(mode = "login") {
  if (appState.auth) {
    openCaseWorkspace("overview");
    return;
  }
  document.documentElement.classList.add("auth-prompt-open");
  setAuthState(null);
  const status = document.querySelector("#authStatus");
  if (status) {
    status.className = "status-panel";
    status.textContent = "";
  }
  if (mode === "start") document.querySelector("#authName")?.focus();
  else document.querySelector("#authEmail")?.focus();
}

function hideAuthGate() {
  document.documentElement.classList.remove("auth-prompt-open");
  setAuthState(appState.auth);
}

async function authRequest(path, payload = null, method = "POST") {
  const response = await fetch(`/api/auth/${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(authToken() ? { authorization: `Bearer ${authToken()}` } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Auth ${path} failed`);
  return body.item;
}

function showAuthError(message, fallbackKey) {
  const authStatus = document.querySelector("#authStatus");
  authStatus.className = "status-panel error";
  authStatus.innerHTML = `<strong>${t("authFailed")}</strong><span>${message || t(fallbackKey)}</span>`;
}

function applyEnvironmentMode() {
  const localHosts = ["localhost", "127.0.0.1", "::1", ""];
  const isLocal = localHosts.includes(window.location.hostname) || window.location.protocol === "file:";
  document.documentElement.classList.toggle("internal-mode", isLocal);
  document.documentElement.classList.add("simple-mode");
  if (!authToken()) {
    uiState.appPage = "home";
    localStorage.setItem("agencyReportAppPage", "home");
  }
  if (uiState.workspaceView !== "overview") {
    uiState.workspaceView = "overview";
    localStorage.setItem("agencyReportWorkspaceView", "overview");
  }
}

function portalTokenFromPath() {
  const match = window.location.pathname.match(/^\/client\/intake\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isPortalMode() {
  return Boolean(portalTokenFromPath());
}

function markWorkspaceGroups() {
  const controlSections = Array.from(document.querySelectorAll(".controls > .control-section"));
  const overviewReportSections = Array.from(document.querySelectorAll(".report > .cover, .report > .report-section:not(.ai-workorder-section):not(.automation-operating-section):not(.delivery-section):not(.progress-section):not(.commercial-section)"));
  const groups = {
    overview: [".onboarding-card", ".launch-card", ".health-hub", ...overviewReportSections],
    case: [".client-hub", ".report-library", controlSections[0]],
    data: [controlSections[1]],
    ai: [".autopilot-panel", ".ai-workorder-section", ".automation-operating-section"],
    delivery: [".delivery-section"],
    billing: [".billing-hub", ".commercial-section"],
    settings: [".access-hub", ".trust-hub", ".audit-hub", ".progress-section"],
  };
  Object.entries(groups).forEach(([group, items]) => {
    items.forEach((item) => {
      const node = typeof item === "string" ? document.querySelector(item) : item;
      if (node) node.dataset.workspaceGroup = group;
    });
  });
}

function setWorkspaceView(view) {
  const available = new Set(["overview", "case", "data", "ai", "delivery", "billing", "settings"]);
  const nextView = available.has(view) ? view : "overview";
  uiState.workspaceView = nextView;
  localStorage.setItem("agencyReportWorkspaceView", nextView);
  document.querySelectorAll("[data-workspace-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.workspaceView === nextView);
  });
  document.querySelectorAll("[data-workspace-group]").forEach((section) => {
    section.hidden = section.dataset.workspaceGroup !== nextView;
  });
  if (nextView === "overview" && appState.metrics) {
    requestAnimationFrame(() => renderInteractiveState());
  }
}

function setupWorkspaceNavigation() {
  markWorkspaceGroups();
  document.querySelectorAll("[data-workspace-view]").forEach((button) => {
    button.addEventListener("click", () => setWorkspaceView(button.dataset.workspaceView));
  });
  setWorkspaceView(uiState.workspaceView);
}

function setAppPage(page) {
  const nextPage = page === "case" ? "case" : "home";
  if (nextPage === "case" && !appState.auth && !isPortalMode()) {
    showAuthGate("start");
    return;
  }
  uiState.appPage = nextPage;
  localStorage.setItem("agencyReportAppPage", nextPage);
  document.querySelectorAll("[data-app-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.appPage === nextPage);
  });
  document.querySelector("#overviewHome")?.toggleAttribute("hidden", nextPage !== "home");
  document.querySelector("#caseWorkspace")?.toggleAttribute("hidden", nextPage !== "case");
  if (nextPage === "case" && appState.metrics) {
    requestAnimationFrame(() => renderInteractiveState());
  }
}

function openCaseWorkspace(view = uiState.workspaceView || "overview") {
  if (!appState.auth && !isPortalMode()) {
    showAuthGate("start");
    return;
  }
  setAppPage("case");
  setWorkspaceView(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupAppPages() {
  document.querySelectorAll("[data-app-page]").forEach((button) => {
    button.addEventListener("click", () => setAppPage(button.dataset.appPage));
  });
  document.querySelector("#openCaseDetailBtn")?.addEventListener("click", () => openCaseWorkspace("overview"));
  document.querySelector("#homeOpenCurrentCaseBtn")?.addEventListener("click", () => openCaseWorkspace("case"));
  document.querySelector("#homeLoadDemoBtn")?.addEventListener("click", () => {
    if (!appState.auth && !isPortalMode()) {
      showAuthGate("start");
      return;
    }
    document.querySelector("#loadDemoBtn")?.click();
    openCaseWorkspace("overview");
  });
  document.querySelector("#landingLoginBtn")?.addEventListener("click", () => showAuthGate("login"));
  document.querySelector("#landingStartBtn")?.addEventListener("click", () => showAuthGate("start"));
  document.querySelector("#closeAuthBtn")?.addEventListener("click", hideAuthGate);
  document.querySelectorAll("[data-home-workspace]").forEach((button) => {
    button.addEventListener("click", () => openCaseWorkspace(button.dataset.homeWorkspace));
  });
  updateHomeLanguage();
  updateSimpleModeCopy();
  setAppPage(uiState.appPage);
}

function renderHomeDashboard() {
  const launchScore = document.querySelector("#launchScore")?.textContent || "0%";
  const clients = appState.clients || [];
  const reports = appState.reports || [];
  const invoices = appState.invoices || [];
  const reportTypeText = fields.reportType?.options?.[fields.reportType.selectedIndex]?.textContent || fields.reportType?.value || "Mixed";
  const revenueStatus = invoices.length ? "Invoice ready" : appState.checkout ? "Checkout ready" : "Draft";
  const nextActions = [
    [fields.clientRequest.value.trim() ? "需求已建立" : "補上客戶需求", fields.clientRequest.value.trim() ? "AI 可以根據需求產出工作單與回覆草稿。" : "先用自然語言描述客戶最在意的 CPA、ROAS、SEO 或社群需求。"],
    [(fields.csvInput.value.trim() || fields.sheetUrl.value.trim()) ? "資料已準備" : "串接資料來源", (fields.csvInput.value.trim() || fields.sheetUrl.value.trim()) ? "目前可產出圖表、KPI 與月報敘事。" : "貼上 CSV 或 Google Sheets URL，讓報告可以自動產生。"],
    [appState.shareLinks.length || appState.emailJobs.length ? "交付流程已啟動" : "建立交付包", appState.shareLinks.length || appState.emailJobs.length ? "已有分享連結或 Email 佇列紀錄。" : "審稿後建立分享連結、Email 佇列與交付紀錄。"],
  ];
  const feed = [
    ...clients.slice(-2).reverse().map((client) => ["客戶", `${client.clientName || client.name || "Untitled"} / ${client.deliveryEmail || client.email || "-"}`]),
    ...reports.slice(-2).reverse().map((report) => ["報告", `${report.clientName || "Untitled"} / ${report.reportMonth || report.month || "-"}`]),
    ...invoices.slice(-2).reverse().map((invoice) => ["發票", `${invoice.invoiceNumber || invoice.id || "Draft"} / ${formatInvoiceAmount(invoice)} / ${invoice.status || "draft"}`]),
  ];

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  setText("#homeLaunchScore", launchScore);
  setText("#homeClientCount", String(clients.length));
  setText("#homeReportCount", String(reports.length));
  setText("#homeRevenueStatus", revenueStatus);
  setText("#homeCaseName", fields.clientName.value || "Untitled");
  setText("#homeCaseMonth", fields.reportMonth.value || "-");
  setText("#homeCaseCurrency", fields.currency.value || "TWD");
  setText("#homeCaseType", reportTypeText);

  const nextActionsNode = document.querySelector("#homeNextActions");
  if (nextActionsNode) {
    nextActionsNode.innerHTML = nextActions.map(([title, copy]) => `<div><strong>${title}</strong><span>${copy}</span></div>`).join("");
  }
  const feedNode = document.querySelector("#homeFeed");
  if (feedNode) {
    feedNode.innerHTML = feed.length
      ? feed.map(([title, copy]) => `<div><strong>${title}</strong><span>${copy}</span></div>`).join("")
      : `<div><strong>尚無案件動態</strong><span>建立第一個客戶、報告或發票後，這裡會顯示最近進度。</span></div>`;
  }
}

function renderHomeDashboard() {
  const launchScore = document.querySelector("#launchScore")?.textContent || "0%";
  const clients = appState.clients || [];
  const reports = appState.reports || [];
  const invoices = appState.invoices || [];
  const reportTypeText = fields.reportType?.options?.[fields.reportType.selectedIndex]?.textContent || fields.reportType?.value || "Mixed";
  const hasRequest = Boolean(fields.clientRequest.value.trim());
  const hasData = Boolean(fields.csvInput.value.trim() || fields.sheetUrl.value.trim());
  const hasDelivery = Boolean(appState.shareLinks.length || appState.emailJobs.length);
  const copy = uiState.lang === "en" ? {
    revenue: { invoice: "Invoice ready", checkout: "Checkout ready", draft: "Draft" },
    next: {
      requestDone: "Requirements ready",
      requestTodo: "Add client requirements",
      requestDoneCopy: "AI can generate the work order and client reply draft from the current request.",
      requestTodoCopy: "Describe the client's CPA, ROAS, SEO, or social priorities in plain language.",
      dataDone: "Data ready",
      dataTodo: "Connect data source",
      dataDoneCopy: "Charts, KPI cards, and report narrative can be generated from the current data.",
      dataTodoCopy: "Paste CSV data or connect a Google Sheets URL to generate the report automatically.",
      deliveryDone: "Delivery started",
      deliveryTodo: "Create delivery package",
      deliveryDoneCopy: "A share link or email queue record already exists.",
      deliveryTodoCopy: "After review, create a share link, email queue, and delivery record.",
    },
    labels: { client: "Client", report: "Report", invoice: "Invoice" },
    emptyTitle: "No case activity yet",
    emptyCopy: "Recent clients, reports, and invoices will appear here after you create them.",
  } : {
    revenue: { invoice: "發票就緒", checkout: "付款就緒", draft: "草稿" },
    next: {
      requestDone: "需求已建立",
      requestTodo: "補上客戶需求",
      requestDoneCopy: "AI 可以根據需求產出工作單與回覆草稿。",
      requestTodoCopy: "先用自然語言描述客戶最在意的 CPA、ROAS、SEO 或社群需求。",
      dataDone: "資料已準備",
      dataTodo: "串接資料來源",
      dataDoneCopy: "目前可產出圖表、KPI 與月報敘事。",
      dataTodoCopy: "貼上 CSV 或 Google Sheets URL，讓報告可以自動產生。",
      deliveryDone: "交付流程已啟動",
      deliveryTodo: "建立交付包",
      deliveryDoneCopy: "已有分享連結或 Email 佇列紀錄。",
      deliveryTodoCopy: "審稿後建立分享連結、Email 佇列與交付紀錄。",
    },
    labels: { client: "客戶", report: "報告", invoice: "發票" },
    emptyTitle: "尚無案件動態",
    emptyCopy: "建立第一個客戶、報告或發票後，這裡會顯示最近進度。",
  };
  const revenueStatus = invoices.length ? copy.revenue.invoice : appState.checkout ? copy.revenue.checkout : copy.revenue.draft;
  const nextActions = [
    [hasRequest ? copy.next.requestDone : copy.next.requestTodo, hasRequest ? copy.next.requestDoneCopy : copy.next.requestTodoCopy],
    [hasData ? copy.next.dataDone : copy.next.dataTodo, hasData ? copy.next.dataDoneCopy : copy.next.dataTodoCopy],
    [hasDelivery ? copy.next.deliveryDone : copy.next.deliveryTodo, hasDelivery ? copy.next.deliveryDoneCopy : copy.next.deliveryTodoCopy],
  ];
  const feed = [
    ...clients.slice(-2).reverse().map((client) => [copy.labels.client, `${client.clientName || client.name || "Untitled"} / ${client.deliveryEmail || client.email || "-"}`]),
    ...reports.slice(-2).reverse().map((report) => [copy.labels.report, `${report.clientName || "Untitled"} / ${report.reportMonth || report.month || "-"}`]),
    ...invoices.slice(-2).reverse().map((invoice) => [copy.labels.invoice, `${invoice.invoiceNumber || invoice.id || "Draft"} / ${formatInvoiceAmount(invoice)} / ${invoice.status || "draft"}`]),
  ];

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  setText("#homeLaunchScore", launchScore);
  setText("#homeClientCount", String(clients.length));
  setText("#homeReportCount", String(reports.length));
  setText("#homeRevenueStatus", revenueStatus);
  setText("#homeCaseName", fields.clientName.value || "Untitled");
  setText("#homeCaseMonth", fields.reportMonth.value || "-");
  setText("#homeCaseCurrency", fields.currency.value || "TWD");
  setText("#homeCaseType", reportTypeText);

  const nextActionsNode = document.querySelector("#homeNextActions");
  if (nextActionsNode) {
    nextActionsNode.innerHTML = nextActions.map(([title, body]) => `<div><strong>${title}</strong><span>${body}</span></div>`).join("");
  }
  const feedNode = document.querySelector("#homeFeed");
  if (feedNode) {
    feedNode.innerHTML = feed.length
      ? feed.map(([title, body]) => `<div><strong>${title}</strong><span>${body}</span></div>`).join("")
      : `<div><strong>${copy.emptyTitle}</strong><span>${copy.emptyCopy}</span></div>`;
  }
  updateAccountDock();
}

function accountDockCopy() {
  return uiState.lang === "en" ? {
    dock: "Settings",
    account: "Personal Account",
    signedOut: "Not signed in",
    profile: "Profile",
    settings: "Settings",
    usage: "Remaining Usage",
    reports: "Reports",
    clients: "Clients",
    upgrade: "Upgrade to Pro",
    reset: "Available resets",
    resetValue: "1 left",
    invite: "Invite teammate",
    logout: "Logout",
  } : {
    dock: "設定",
    account: "個人帳戶",
    signedOut: "尚未登入",
    profile: "個人檔案",
    settings: "設定",
    usage: "剩餘用量",
    reports: "報告",
    clients: "客戶",
    upgrade: "升級為 Pro",
    reset: "可用重設",
    resetValue: "1 次",
    invite: "邀請成員",
    logout: "登出",
  };
}

function updateAccountDock() {
  const copy = accountDockCopy();
  const plan = planLimits[fields.planSelect.value] || planLimits.starter;
  const clients = appState.clients || [];
  const reports = appState.reports || [];
  const reportPercent = Math.round(Math.min(1, reports.length / Math.max(plan.reports, 1)) * 100);
  const clientPercent = Math.round(Math.min(1, clients.length / Math.max(plan.clients, 1)) * 100);
  const usagePercent = Math.max(reportPercent, clientPercent);
  const user = appState.auth?.user || appState.auth || {};
  const accountName = fields.accountName.value || user.name || user.company || copy.account;
  const accountEmail = user.email || fields.accountEmail.value || copy.signedOut;
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  setText("#accountDockLabel", copy.dock);
  setText("#accountDockName", accountName);
  setText("#accountDockEmail", accountEmail);
  setText("#dockProfileLabel", copy.profile);
  setText("#dockSettingsLabel", copy.settings);
  setText("#dockUsageLabel", copy.usage);
  setText("#dockUsagePercent", `${usagePercent}%`);
  setText("#dockReportUsage", `${Math.max(plan.reports - reports.length, 0)} / ${plan.reports}`);
  setText("#dockReportUsageLabel", copy.reports);
  setText("#dockClientUsage", `${Math.max(plan.clients - clients.length, 0)} / ${plan.clients}`);
  setText("#dockClientUsageLabel", copy.clients);
  setText("#dockUpgradeLabel", copy.upgrade);
  setText("#dockResetLabel", copy.reset);
  setText("#dockResetValue", copy.resetValue);
  setText("#dockInviteLabel", copy.invite);
  setText("#dockLogoutLabel", copy.logout);
}

function closeAccountDock() {
  const menu = document.querySelector("#accountDockMenu");
  const toggle = document.querySelector("#accountDockToggle");
  if (!menu || !toggle) return;
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
}

function toggleAccountDock() {
  const menu = document.querySelector("#accountDockMenu");
  const toggle = document.querySelector("#accountDockToggle");
  if (!menu || !toggle) return;
  const willOpen = menu.hidden;
  updateAccountDock();
  menu.hidden = !willOpen;
  toggle.setAttribute("aria-expanded", String(willOpen));
}

function setupAccountDock() {
  ensureDockThemeToggle();
  document.querySelector("#accountDockToggle")?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAccountDock();
  });
  document.querySelector("#accountDockMenu")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const action = event.target.closest("[data-dock-action]")?.dataset.dockAction;
    if (!action) return;
    if (action === "profile") openCaseWorkspace("case");
    if (action === "settings") openCaseWorkspace("settings");
    if (action === "usage") openCaseWorkspace("overview");
    if (action === "billing") openUpgradeModal();
    if (action === "reset") openCaseWorkspace("billing");
    if (action === "logout") logoutAuth().catch(() => {});
    closeAccountDock();
  });
  document.addEventListener("click", closeAccountDock);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAccountDock();
    if ((event.ctrlKey || event.metaKey) && event.key === ",") {
      event.preventDefault();
      openCaseWorkspace("settings");
    }
  });
  updateAccountDock();
}

const upgradePlanOrder = ["starter", "agency", "whiteLabel"];

function upgradePlanCopy() {
  if (uiState.lang !== "en") {
    return {
      title: "升級方案",
      monthly: "月付",
      annual: "年付",
      current: "目前方案",
      upgrade: "選擇方案",
      checkout: "建立付款",
      perMonth: "/月",
      ready: "選擇方案後即可建立付款草稿。",
      created: "付款草稿已建立",
      openCheckout: "開啟付款",
      openQuote: "開啟報價",
      plans: {
        starter: { name: "入門版", features: ["每月 10 份月報", "CSV/Sheets 匯入", "AI 建議", "PDF/HTML 匯出"] },
        agency: { name: "代理商版", features: ["每月 50 份月報", "多客戶管理", "品牌化報告", "付款與交付紀錄"] },
        whiteLabel: { name: "專業版", features: ["更高月報量", "客戶入口與排程", "Email 草稿流程", "白標與進階 AI 分析"] },
      },
    };
  }
  return uiState.lang === "en" ? {
    title: "Upgrade Plan",
    monthly: "Monthly",
    annual: "Annual",
    current: "Current plan",
    upgrade: "Choose plan",
    checkout: "Create checkout",
    perMonth: "/mo",
    ready: "Choose a plan to generate a checkout draft.",
    created: "Checkout draft created",
    openCheckout: "Open checkout",
    openQuote: "Open quote",
    plans: {
      starter: { name: "Starter", features: ["10 monthly reports", "CSV/Sheets import", "AI recommendations", "PDF/HTML export"] },
      agency: { name: "Agency", features: ["50 monthly reports", "Multi-client workspace", "Branded reports", "Payment and delivery records"] },
      whiteLabel: { name: "Professional", features: ["Higher report volume", "Client portal and schedules", "Email draft workflow", "White label and advanced AI"] },
    },
  } : {
    title: "升級方案",
    monthly: "月繳",
    annual: "年繳",
    current: "目前方案",
    upgrade: "選擇方案",
    checkout: "建立付款",
    perMonth: "/月",
    ready: "選擇方案後可產生付款草稿。",
    created: "付款草稿已建立",
    openCheckout: "開啟付款",
    openQuote: "開啟報價",
    plans: {
      starter: { name: "Starter", features: ["每月 5 份報告", "1 組品牌範本", "CSV 匯入", "手動交付流程"] },
      agency: { name: "Agency", features: ["每月 30 份報告", "多客戶工作區", "Sheets 匯入", "PDF 與分享連結交付"] },
      whiteLabel: { name: "專業版", features: ["更高月報量", "客戶入口與排程", "Email 草稿流程", "白標與進階 AI 分析"] },
    },
  };
}

function upgradePrice(planKey, cycle) {
  const plan = planLimits[planKey] || planLimits.starter;
  const currency = fields.currency.value || "TWD";
  const monthly = currency === "TWD" ? plan.monthlyTwd : plan.monthlyUsd;
  const amount = cycle === "annual" ? Math.round(monthly * 12 * 0.85) : monthly;
  return new Intl.NumberFormat(uiState.lang === "en" ? "en-US" : "zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderUpgradePlans() {
  const copy = upgradePlanCopy();
  const cycle = document.querySelector(".upgrade-tabs button.active")?.dataset.upgradeCycle || "monthly";
  document.querySelector("#upgradeModalTitle").textContent = copy.title;
  document.querySelectorAll("[data-upgrade-cycle]").forEach((button) => {
    button.textContent = button.dataset.upgradeCycle === "annual" ? copy.annual : copy.monthly;
  });
  document.querySelector("#upgradePlans").innerHTML = upgradePlanOrder.map((planKey) => {
    const planCopy = copy.plans[planKey];
    const isCurrent = fields.planSelect.value === planKey;
    return `
      <article class="upgrade-plan ${planKey === "agency" ? "featured" : ""}">
        <h3>${planCopy.name}</h3>
        <div class="upgrade-price">${upgradePrice(planKey, cycle)}<small>${cycle === "annual" ? "/yr" : copy.perMonth}</small></div>
        <ul class="upgrade-feature-list">
          ${planCopy.features.map((feature) => `<li><span>◆</span>${feature}</li>`).join("")}
        </ul>
        <button class="${isCurrent ? "current" : ""}" type="button" data-upgrade-plan="${planKey}">${isCurrent ? copy.current : copy.upgrade}</button>
      </article>
    `;
  }).join("");
  document.querySelector("#upgradeStatus").textContent = copy.ready;
}

function openUpgradeModal() {
  const modal = document.querySelector("#upgradeModal");
  if (!modal) return;
  renderUpgradePlans();
  modal.hidden = false;
  closeAccountDock();
}

function closeUpgradeModal() {
  const modal = document.querySelector("#upgradeModal");
  if (modal) modal.hidden = true;
}

async function chooseUpgradePlan(planKey, button) {
  const copy = upgradePlanCopy();
  fields.planSelect.value = planKey;
  renderClientHub();
  renderBillingHub();
  updateAccountDock();
  renderUpgradePlans();
  const selectedButton = document.querySelector(`[data-upgrade-plan="${planKey}"]`);
  setButtonState(selectedButton || button, "loading", "createCheckout");
  const checkout = await createCheckout();
  const checkoutUrl = checkout?.checkoutUrl || "";
  const quoteUrl = checkout?.quoteUrl || "";
  renderUpgradePlans();
  document.querySelector("#upgradeStatus").innerHTML = `
    <strong>${copy.created}</strong>
    <span>${checkoutUrl ? `<a href="${checkoutUrl}" target="_blank" rel="noreferrer">${copy.openCheckout}</a>` : ""}${checkoutUrl && quoteUrl ? " · " : ""}${quoteUrl ? `<a href="${quoteUrl}" target="_blank" rel="noreferrer">${copy.openQuote}</a>` : ""}</span>
  `;
}

function setupUpgradeModal() {
  document.querySelector("#upgradeCloseBtn")?.addEventListener("click", closeUpgradeModal);
  document.querySelector("#upgradeModal")?.addEventListener("click", (event) => {
    if (event.target.id === "upgradeModal") closeUpgradeModal();
    const cycleButton = event.target.closest("[data-upgrade-cycle]");
    if (cycleButton) {
      document.querySelectorAll("[data-upgrade-cycle]").forEach((button) => button.classList.toggle("active", button === cycleButton));
      renderUpgradePlans();
    }
    const planButton = event.target.closest("[data-upgrade-plan]");
    if (planButton) chooseUpgradePlan(planButton.dataset.upgradePlan, planButton).catch(() => {
      document.querySelector("#upgradeStatus").textContent = uiState.lang === "en" ? "Could not create checkout. Please try again." : "無法建立付款，請再試一次。";
      setButtonState(planButton, "error", "createCheckout");
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUpgradeModal();
  });
}

function updateHomeLanguage() {
  const copy = uiState.lang === "en" ? {
    pages: ["Overview Home", "Case Detail"],
    heroTitle: "Agency Operations Overview",
    heroCopy: "Track the active case, AI automation, report delivery, and revenue readiness in one clean view.",
    demo: "Load Demo",
    open: "Open Case Detail",
    kpis: [
      ["Launch readiness", "Automation, data, delivery, and payment readiness."],
      ["Active clients", "Trackable client workspaces."],
      ["Saved reports", "Reports ready to reuse or deliver."],
      ["Revenue ops", "Payment, invoice, and plan status."],
    ],
    caseTitle: "Current Case",
    caseCopy: "Keep the workspace focused on one client instead of crowding every tool into the first screen.",
    detail: "View Detail",
    pipelineTitle: "Case Pipeline",
    pipelineCopy: "Recent client, report, and invoice activity.",
    shortcutTitle: "Workflow Shortcuts",
    shortcutCopy: "Grouped by the agency delivery flow so the workspace stays easier to scan.",
    shortcuts: [
      ["Case Data", "Client, requirements, report template"],
      ["Data Sources", "Sheets, CSV, source checks"],
      ["AI Automation", "Requirement parsing, drafts, schedules"],
      ["Delivery Center", "Review, links, email"],
      ["Revenue Ops", "Plans, checkout, invoices"],
      ["Settings & Trust", "Members, consent, audit"],
    ],
  } : {
    pages: ["總覽首頁", "案件詳情"],
    heroTitle: "代理商營運總覽",
    heroCopy: "用一個畫面掌握目前案件、AI 自動化、報告交付與營收準備狀態。",
    demo: "載入 Demo",
    open: "進入案件詳情",
    kpis: [
      ["Launch readiness", "自動化、資料、交付與收款完成度。"],
      ["Active clients", "已建立且可追蹤的客戶案件。"],
      ["Saved reports", "已保存、可交付或可複製的報告。"],
      ["Revenue ops", "付款、發票與方案準備狀態。"],
    ],
    caseTitle: "目前案件",
    caseCopy: "把工作台聚焦在單一客戶，避免所有功能同時擠在第一屏。",
    detail: "查看詳情",
    pipelineTitle: "案件管線",
    pipelineCopy: "最近客戶、報告與發票動態。",
    shortcutTitle: "工作流捷徑",
    shortcutCopy: "依照代理商交付流程分類，不需要在同一頁找所有功能。",
    shortcuts: [
      ["案件資料", "客戶、需求、報告範本"],
      ["資料串接", "Sheets、CSV、來源驗證"],
      ["AI 自動化", "需求解析、草稿、排程"],
      ["交付中心", "審稿、連結、Email"],
      ["營收帳務", "方案、收款、發票"],
      ["設定與信任", "成員、同意、稽核"],
    ],
  };
  document.querySelectorAll("[data-app-page]").forEach((button, index) => { button.textContent = copy.pages[index] || button.textContent; });
  const hero = document.querySelector(".home-hero");
  if (hero) {
    hero.querySelector("h2").textContent = copy.heroTitle;
    hero.querySelector("p:not(.eyebrow)").textContent = copy.heroCopy;
  }
  const demo = document.querySelector("#homeLoadDemoBtn");
  const open = document.querySelector("#openCaseDetailBtn");
  const detail = document.querySelector("#homeOpenCurrentCaseBtn");
  const landingLogin = document.querySelector("#landingLoginBtn");
  const landingStart = document.querySelector("#landingStartBtn");
  if (demo) demo.textContent = copy.demo;
  if (open) open.textContent = copy.open;
  if (detail) detail.textContent = copy.detail;
  if (landingLogin) landingLogin.textContent = uiState.lang === "en" ? "Sign in" : "登入";
  if (landingStart) landingStart.textContent = uiState.lang === "en" ? "Start free" : "開始使用";
  document.querySelectorAll(".home-kpi-card").forEach((card, index) => {
    const item = copy.kpis[index];
    if (!item) return;
    card.querySelector("span").textContent = item[0];
    card.querySelector("p").textContent = item[1];
  });
  const headings = document.querySelectorAll(".home-panel .section-heading");
  const headingCopy = [[copy.caseTitle, copy.caseCopy], [copy.pipelineTitle, copy.pipelineCopy], [copy.shortcutTitle, copy.shortcutCopy]];
  headings.forEach((heading, index) => {
    const item = headingCopy[index];
    if (!item) return;
    heading.querySelector("h3").textContent = item[0];
    heading.querySelector("p").textContent = item[1];
  });
  document.querySelectorAll(".home-shortcuts button").forEach((button, index) => {
    const item = copy.shortcuts[index];
    if (!item) return;
    button.querySelector("strong").textContent = item[0];
    button.querySelector("small").textContent = item[1];
  });
}

function updateSimpleModeCopy() {
  if (!document.documentElement.classList.contains("simple-mode")) return;
  const copy = uiState.lang === "en" ? {
    pages: ["Overview", "Generate Report"],
    heroTitle: "Monthly Report Generator",
    heroCopy: "Import client data, enter the request, and generate a client-ready monthly report.",
    demo: "Load Demo",
    open: "Start Report",
    detail: "Open",
    kpis: [
      ["Readiness", "Request, data, report, and delivery status."],
      ["Clients", "Trackable client cases."],
      ["Reports", "Saved monthly reports."],
      ["Revenue", "Plan and payment status."],
    ],
    headings: [
      ["Current Case", "Work on one client at a time so the reporting flow stays simple."],
      ["Recent Activity", "Latest client, report, and invoice activity."],
      ["Simple Workflow", "The client only needs to provide data and requirements."],
    ],
    shortcuts: [
      ["Client Info", "Client and month"],
      ["Import Data", "Sheets or CSV"],
      ["AI Draft", "Request to narrative"],
      ["Delivery", "Review and send"],
      ["Payment", "Plan and invoice"],
      ["Settings", "Consent and privacy"],
    ],
  } : {
    pages: ["總覽", "產生月報"],
    heroTitle: "月報自動產生器",
    heroCopy: "輸入客戶需求、匯入資料，立即產生可交付的客戶月報。",
    demo: "載入 Demo",
    open: "開始產生月報",
    detail: "開啟",
    kpis: [
      ["完成度", "需求、資料、報告與交付狀態。"],
      ["客戶", "目前可追蹤的客戶案件。"],
      ["報告", "已儲存的月報。"],
      ["營收", "方案與付款狀態。"],
    ],
    headings: [
      ["目前案件", "一次只處理一個客戶，讓月報流程保持簡單。"],
      ["近期活動", "最新客戶、報告與發票活動。"],
      ["簡化流程", "客戶只需要提供需求與資料。"],
    ],
    shortcuts: [
      ["客戶資料", "客戶與月份"],
      ["匯入資料", "Sheets 或 CSV"],
      ["AI 草稿", "需求轉成敘事"],
      ["交付月報", "審稿與寄送"],
      ["付款方案", "方案與發票"],
      ["設定", "同意與隱私"],
    ],
  };
  document.querySelectorAll("[data-app-page]").forEach((button, index) => { button.textContent = copy.pages[index] || button.textContent; });
  const hero = document.querySelector(".home-hero");
  if (hero) {
    hero.querySelector("h2").textContent = copy.heroTitle;
    hero.querySelector("p:not(.eyebrow)").textContent = copy.heroCopy;
  }
  const demo = document.querySelector("#homeLoadDemoBtn");
  const open = document.querySelector("#openCaseDetailBtn");
  const detail = document.querySelector("#homeOpenCurrentCaseBtn");
  const landingLogin = document.querySelector("#landingLoginBtn");
  const landingStart = document.querySelector("#landingStartBtn");
  if (demo) demo.textContent = copy.demo;
  if (open) open.textContent = copy.open;
  if (detail) detail.textContent = copy.detail;
  if (landingLogin) landingLogin.textContent = uiState.lang === "en" ? "Sign in" : "登入";
  if (landingStart) landingStart.textContent = uiState.lang === "en" ? "Start free" : "開始使用";
  document.querySelectorAll(".home-kpi-card").forEach((card, index) => {
    const item = copy.kpis[index];
    if (!item) return;
    card.querySelector("span").textContent = item[0];
    card.querySelector("p").textContent = item[1];
  });
  document.querySelectorAll(".home-panel .section-heading").forEach((heading, index) => {
    const item = copy.headings[index];
    if (!item) return;
    heading.querySelector("h3").textContent = item[0];
    heading.querySelector("p").textContent = item[1];
  });
  document.querySelectorAll(".home-shortcuts button").forEach((button, index) => {
    const item = copy.shortcuts[index];
    if (!item) return;
    button.querySelector("strong").textContent = item[0];
    button.querySelector("small").textContent = item[1];
  });
}

function updateSimpleModeCopy() {
  if (!document.documentElement.classList.contains("simple-mode")) return;
  const copy = uiState.lang === "en" ? {
    pages: ["System Overview", "Report Workspace"],
    heroTitle: "AI Reporting Operating System",
    heroCopy: "Collect requirements, import campaign data, generate AI analysis, and deliver branded monthly reports from one workflow.",
    demo: "Load Demo",
    open: "Build Report Flow",
    detail: "Open",
    kpis: [
      ["Readiness", "Database, AI, email, worker, payment, and delivery status."],
      ["Clients", "Active reporting workspaces."],
      ["Reports", "Saved reports ready to reuse or deliver."],
      ["Revenue", "Plan, quote, invoice, and payment readiness."],
    ],
    headings: [
      ["Current Case", "Work on one client at a time so the reporting flow stays focused."],
      ["Recent Activity", "Latest client, report, and invoice activity."],
      ["Guided Workflow", "A simple path from request intake to AI report delivery."],
    ],
    shortcuts: [
      ["Client Intake", "Client, month, and requirements"],
      ["Data Import", "Sheets, CSV, and validation"],
      ["AI Narrative", "Summary, risks, and next actions"],
      ["Report Studio", "Charts, branding, and export"],
      ["Revenue Ops", "Plans, quotes, and invoices"],
      ["Trust Settings", "Consent, privacy, and audit"],
    ],
  } : {
    pages: ["系統總覽", "月報工作台"],
    heroTitle: "AI 月報自動化作業系統",
    heroCopy: "把客戶需求、廣告資料、AI 分析、品牌化月報、排程與 Email 交付集中在同一套工作流。",
    demo: "載入 Demo",
    open: "建立月報流程",
    detail: "開啟",
    kpis: [
      ["上線狀態", "資料庫、AI、Email、Worker、付款與交付狀態。"],
      ["客戶案件", "目前可追蹤的客戶月報工作區。"],
      ["報告數量", "已保存、可交付或可複製的月報。"],
      ["營收流程", "方案、報價、發票與付款準備狀態。"],
    ],
    headings: [
      ["目前案件", "一次專注處理一位客戶，讓月報流程清楚不混亂。"],
      ["近期活動", "最近的客戶、報告與發票動態。"],
      ["引導式流程", "從需求輸入、資料匯入、AI 分析到報告交付。"],
    ],
    shortcuts: [
      ["需求入口", "客戶、月份與需求"],
      ["資料匯入", "Sheets、CSV 與驗證"],
      ["AI 文案", "摘要、風險與下月行動"],
      ["報告工作室", "圖表、品牌與匯出"],
      ["營收流程", "方案、報價與發票"],
      ["信任設定", "同意條款、隱私與稽核"],
    ],
  };
  document.querySelectorAll("[data-app-page]").forEach((button, index) => { button.textContent = copy.pages[index] || button.textContent; });
  const hero = document.querySelector(".home-hero");
  if (hero) {
    hero.querySelector("h2").textContent = copy.heroTitle;
    hero.querySelector("p:not(.eyebrow)").textContent = copy.heroCopy;
  }
  const demo = document.querySelector("#homeLoadDemoBtn");
  const open = document.querySelector("#openCaseDetailBtn");
  const detail = document.querySelector("#homeOpenCurrentCaseBtn");
  if (demo) demo.textContent = copy.demo;
  if (open) open.textContent = copy.open;
  if (detail) detail.textContent = copy.detail;
  document.querySelector("#landingLoginBtn") && (document.querySelector("#landingLoginBtn").textContent = uiState.lang === "en" ? "Sign in" : "登入");
  document.querySelector("#landingStartBtn") && (document.querySelector("#landingStartBtn").textContent = uiState.lang === "en" ? "Start free" : "開始使用");
  document.querySelectorAll(".home-kpi-card").forEach((card, index) => {
    const item = copy.kpis[index];
    if (!item) return;
    card.querySelector("span").textContent = item[0];
    card.querySelector("p").textContent = item[1];
  });
  document.querySelectorAll(".home-panel .section-heading").forEach((heading, index) => {
    const item = copy.headings[index];
    if (!item) return;
    heading.querySelector("h3").textContent = item[0];
    heading.querySelector("p").textContent = item[1];
  });
  document.querySelectorAll(".home-shortcuts button").forEach((button, index) => {
    const item = copy.shortcuts[index];
    if (!item) return;
    button.querySelector("strong").textContent = item[0];
    button.querySelector("small").textContent = item[1];
  });
}

function updateWorkspaceNavLanguage() {
  const labels = workspaceNavLabels[uiState.lang] || workspaceNavLabels.zh;
  document.querySelectorAll("[data-workspace-view]").forEach((button) => {
    button.textContent = labels[button.dataset.workspaceView] || button.textContent;
  });
}

function updateThemeLabels() {
  const labels = uiState.lang === "en" ? { dark: "Dark", light: "Light" } : { dark: "深色", light: "白色" };
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.textContent = labels[button.dataset.theme] || button.textContent;
  });
  const dockThemeLabel = document.querySelector("#dockThemeLabel");
  if (dockThemeLabel) dockThemeLabel.textContent = uiState.lang === "en" ? "Background" : "背景";
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  uiState.theme = nextTheme;
  localStorage.setItem("agencyReportTheme", nextTheme);
  document.documentElement.classList.toggle("theme-light", nextTheme === "light");
  document.documentElement.classList.toggle("theme-dark", nextTheme === "dark");
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === nextTheme);
  });
  updateThemeLabels();
}

function setupThemeToggle() {
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.theme));
  });
  applyTheme(uiState.theme);
}

function ensureDockThemeToggle() {
  const menu = document.querySelector("#accountDockMenu");
  const usageGrid = document.querySelector(".dock-usage-grid");
  if (!menu || !usageGrid || document.querySelector("#dockThemeRow")) return;
  const row = document.createElement("div");
  row.className = "dock-theme-row";
  row.id = "dockThemeRow";
  row.innerHTML = `
    <span id="dockThemeLabel">背景</span>
    <div class="theme-toggle dock-theme-toggle" aria-label="Theme">
      <button class="active" data-theme="dark" type="button">深色</button>
      <button data-theme="light" type="button">白色</button>
    </div>
  `;
  usageGrid.insertAdjacentElement("afterend", row);
}

function initPortalMode() {
  const token = portalTokenFromPath();
  if (!token) return;
  document.documentElement.classList.add("portal-mode");
  document.querySelector("#portalPage").hidden = false;
  document.querySelector("#portalToken").textContent = token;
  document.querySelector("#portalStatus").innerHTML = `<strong>${t("portalInviteReady")}</strong><span>${token}</span>`;
}

async function detectApi() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    appState.apiOnline = response.ok;
  } catch {
    appState.apiOnline = false;
  }
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
}

async function restoreAuth() {
  if (isPortalMode()) {
    setAuthState(null);
    return;
  }
  const token = authToken();
  if (!token) {
    setAuthState(null);
    return;
  }
  try {
    const user = await authRequest("me", null, "GET");
    setAuthState({ token, user });
    await loadWorkspaceData();
  } catch {
    localStorage.removeItem("agencyReportAuthToken");
    setAuthState(null);
  }
}

async function submitAuth(event) {
  event.preventDefault();
  const button = document.querySelector("#loginBtn");
  setButtonState(button, "loading", "login");
  const payload = {
    email: document.querySelector("#authEmail").value.trim(),
    password: document.querySelector("#authPassword").value,
  };
  try {
    const auth = await authRequest("login", payload);
    setAuthState(auth);
    await loadWorkspaceData();
    setButtonState(button, "success", "login");
  } catch (error) {
    showAuthError(error.message === "Invalid email or password" ? t("authLoginHint") : error.message, "authLoginHint");
    setButtonState(button, "error", "login");
  }
}

async function registerAuth() {
  const button = document.querySelector("#registerBtn");
  setButtonState(button, "loading", "register");
  const payload = {
    name: document.querySelector("#authName").value.trim(),
    email: document.querySelector("#authEmail").value.trim(),
    password: document.querySelector("#authPassword").value,
  };
  try {
    const auth = await authRequest("register", payload);
    setAuthState(auth);
    await loadWorkspaceData();
    const authStatus = document.querySelector("#authStatus");
    authStatus.className = "status-panel ok";
    authStatus.innerHTML = `<strong>${t("authRegistered")}</strong><span>${auth.user?.email || payload.email}</span>`;
    setButtonState(button, "success", "register");
  } catch (error) {
    showAuthError(error.message === "User already exists" ? t("authRegisterHint") : error.message, "authRegisterHint");
    setButtonState(button, "error", "register");
  }
}

async function logoutAuth() {
  try {
    await authRequest("logout", {}, "POST");
  } catch {}
  localStorage.removeItem("agencyReportAuthToken");
  setAuthState(null);
}

function loadWorkspaceData() {
  if (!appState.auth && !isPortalMode()) return Promise.resolve([]);
  return Promise.all([loadTemplates(), loadClients(), loadPortalInvites(), loadPortalSubmissions(), loadReports(), loadDataSources(), loadIntakes(), loadConsents(), loadTeamMembers(), loadDeliveries(), loadShareLinks(), loadEmailJobs(), loadInvoices(), loadBillingIntents(), loadAiRuns(), loadSchedules(), loadAuditLogs()]);
}

async function apiList(collection) {
  if (!appState.apiOnline) return null;
  const response = await fetch(`/api/${collection}`, {
    cache: "no-store",
    headers: authToken() ? { authorization: `Bearer ${authToken()}` } : {},
  });
  if (!response.ok) throw new Error(`API ${collection} list failed`);
  return (await response.json()).items || [];
}

async function apiCreate(collection, payload) {
  if (!appState.apiOnline) return null;
  const response = await fetch(`/api/${collection}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(authToken() ? { authorization: `Bearer ${authToken()}` } : {}) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`API ${collection} create failed`);
  return (await response.json()).item;
}

function localList(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function localSave(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

async function loadClients() {
  let clients = localList("agencyReportClients");
  try {
    clients = (await apiList("clients")) || clients;
  } catch {
    appState.apiOnline = false;
  }
  appState.clients = clients;
  renderClientHub();
}

async function loadPortalInvites() {
  let portalInvites = localList("agencyReportPortalInvites");
  try {
    portalInvites = (await apiList("portal-invites")) || portalInvites;
  } catch {
    appState.apiOnline = false;
  }
  appState.portalInvites = portalInvites;
  renderClientHub();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadPortalSubmissions() {
  let portalSubmissions = localList("agencyReportPortalSubmissions");
  try {
    portalSubmissions = (await apiList("portal-submissions")) || portalSubmissions;
  } catch {
    appState.apiOnline = false;
  }
  appState.portalSubmissions = portalSubmissions;
  renderIntakeStatus();
  renderPortalSubmissions();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadReports() {
  let reports = localList("agencyReportReports");
  try {
    reports = (await apiList("reports")) || reports;
  } catch {
    appState.apiOnline = false;
  }
  appState.reports = reports;
  renderClientHub();
  renderReportLibrary();
}

async function loadDataSources() {
  let dataSources = localList("agencyReportDataSources");
  try {
    dataSources = (await apiList("data-sources")) || dataSources;
  } catch {
    appState.apiOnline = false;
  }
  appState.dataSources = dataSources;
  renderSourceCenter();
}

async function loadIntakes() {
  let intakes = localList("agencyReportIntakes");
  try {
    intakes = (await apiList("intake")) || intakes;
  } catch {
    appState.apiOnline = false;
  }
  appState.intakes = intakes;
  renderIntakeStatus();
  renderPortalSubmissions();
}

async function loadConsents() {
  let consents = localList("agencyReportConsents");
  try {
    consents = (await apiList("consents")) || consents;
  } catch {
    appState.apiOnline = false;
  }
  appState.consents = consents;
  renderTrustCenter();
}

async function loadTeamMembers() {
  let teamMembers = localList("agencyReportTeamMembers");
  try {
    teamMembers = (await apiList("team-members")) || teamMembers;
  } catch {
    appState.apiOnline = false;
  }
  appState.teamMembers = teamMembers;
  renderTeamAccess();
}

async function loadDeliveries() {
  let deliveries = localList("agencyReportDeliveries");
  try {
    deliveries = (await apiList("deliveries")) || deliveries;
  } catch {
    appState.apiOnline = false;
  }
  appState.deliveries = deliveries;
  renderDeliveryCenter();
}

async function loadShareLinks() {
  let shareLinks = localList("agencyReportShareLinks");
  try {
    shareLinks = (await apiList("share-links")) || shareLinks;
  } catch {
    appState.apiOnline = false;
  }
  appState.shareLinks = shareLinks;
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadEmailJobs() {
  let emailJobs = localList("agencyReportEmailJobs");
  try {
    emailJobs = (await apiList("email-jobs")) || emailJobs;
  } catch {
    appState.apiOnline = false;
  }
  appState.emailJobs = emailJobs;
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadInvoices() {
  let invoices = localList("agencyReportInvoices");
  try {
    invoices = (await apiList("invoices")) || invoices;
  } catch {
    appState.apiOnline = false;
  }
  appState.invoices = invoices;
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadBillingIntents() {
  let intents = localList("agencyReportBillingIntents");
  try {
    intents = (await apiList("billing-intents")) || intents;
  } catch {
    appState.apiOnline = false;
  }
  appState.billingIntents = intents;
  appState.checkout = intents[intents.length - 1] || appState.checkout;
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
}

async function loadAiRuns() {
  let aiRuns = localList("agencyReportAiRuns");
  try {
    aiRuns = (await apiList("ai-runs")) || aiRuns;
  } catch {
    appState.apiOnline = false;
  }
  appState.aiRuns = aiRuns;
  renderAgentStatus();
}

async function loadSchedules() {
  let schedules = localList("agencyReportSchedules");
  try {
    schedules = (await apiList("schedules")) || schedules;
  } catch {
    appState.apiOnline = false;
  }
  appState.schedules = schedules;
  renderAgentStatus();
}

async function loadAuditLogs() {
  let auditLogs = [];
  try {
    auditLogs = (await apiList("audit-logs")) || [];
  } catch {
    appState.apiOnline = false;
  }
  appState.auditLogs = auditLogs;
  renderAuditCenter();
}

function renderAuditCenter() {
  const auditLogs = appState.auditLogs || [];
  document.querySelector("#auditCount").textContent = String(auditLogs.length);
  document.querySelector("#auditStatus").textContent = appState.apiOnline ? t("auditReady") : t("auditOffline");
  document.querySelector("#auditList").innerHTML = auditLogs.length
    ? auditLogs.slice(-5).reverse().map((entry) => `<div><strong>${entry.action || "event"}</strong><span>${entry.recordId || "-"} · ${entry.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noAuditLogs")}</p>`;
}

async function refreshAuditLogs() {
  const button = document.querySelector("#refreshAuditBtn");
  setButtonState(button, "loading", "refreshAudit");
  await loadAuditLogs();
  setButtonState(button, "success", "refreshAudit");
}

function sourcePayload() {
  const csvRows = fields.csvInput.value.trim() ? parseCsv(fields.csvInput.value).length : 0;
  return {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    type: fields.sourceType.value,
    url: fields.sheetUrl.value.trim(),
    csv: fields.csvInput.value.trim(),
    ownerEmail: fields.sourceOwner.value.trim(),
    rowCount: csvRows,
    status: csvRows > 0 || fields.sheetUrl.value.trim() ? "ready" : "needs_data",
    reportMonth: fields.reportMonth.value,
  };
}

function renderSourceCenter() {
  const latest = appState.dataSources[appState.dataSources.length - 1];
  const status = latest ? t("sourceSaved") : t("noSources");
  const detail = latest
    ? `${latest.type || "source"} · ${latest.rowCount || 0} rows · ${latest.ownerEmail || "-"}`
    : (fields.sheetUrl.value.trim() || fields.csvInput.value.trim() ? t("sourceNeedsUrl") : t("noSources"));
  document.querySelector("#sourceStatus").className = `source-status ${latest ? "ok" : ""}`;
  document.querySelector("#sourceStatus").innerHTML = `<strong>${status}</strong><span>${detail}</span>`;
  document.querySelector("#sourceList").innerHTML = appState.dataSources.length
    ? appState.dataSources.slice(-3).reverse().map((source) => `<div><strong>${source.clientName || fields.clientName.value}</strong><span>${source.type || "source"} · ${source.status || "ready"} · ${source.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noSources")}</p>`;
}

function intakePayload() {
  const workOrder = analyzeClientRequest();
  return {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    request: fields.clientRequest.value.trim(),
    businessType: fields.businessType.value,
    automationLevel: fields.automationLevel.value,
    deliveryEmail: fields.deliveryEmail.value.trim(),
    scheduleCadence: fields.scheduleCadence.value,
    kpis: workOrder.kpis,
    dataNeeds: workOrder.dataNeeds,
    readiness: workOrder.readiness,
    status: workOrder.readiness >= 80 ? "ready_for_ai" : "needs_setup",
  };
}

function renderIntakeStatus() {
  const latest = appState.intakes[appState.intakes.length - 1];
  document.querySelector("#intakeStatus").className = `intake-status ${latest ? "ok" : ""}`;
  document.querySelector("#intakeStatus").innerHTML = latest
    ? `<strong>${t("intakeSaved")}</strong><span>${latest.clientName || fields.clientName.value} · ${latest.status || "saved"} · ${latest.createdAt || ""}</span>`
    : `<strong>${t("noIntake")}</strong><span>${fields.clientRequest.value.trim() ? t("needsSetup") : t("clientRequest")}</span>`;
}

function renderPortalSubmissions() {
  const portalSubmissions = appState.portalSubmissions || [];
  const latest = portalSubmissions[portalSubmissions.length - 1];
  if (latest && !appState.intakes.length) {
    document.querySelector("#intakeStatus").className = "intake-status ok";
    document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalSubmissionReady")}</strong><span>${latest.contactEmail || "-"} · ${latest.status || "submitted"} · ${latest.createdAt || latest.submittedAt || ""}</span>`;
  }
  document.querySelector("#portalSubmissionList").innerHTML = portalSubmissions.length
    ? portalSubmissions.slice(-5).reverse().map((item) => `<div class="${item.status === "processed" ? "processed" : ""}"><strong>${item.goal || t("portalSubmissionReady")}</strong><span>${item.sourceUrl || "-"} · ${item.contactEmail || "-"} · ${item.status || "submitted"} · ${item.processedAt || item.createdAt || item.submittedAt || ""}</span></div>`).join("")
    : `<p>${t("noPortalSubmissions")}</p>`;
}

function latestPendingPortalSubmission() {
  return [...(appState.portalSubmissions || [])].reverse().find((item) => item.status !== "processed");
}

function consentPayload() {
  return {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    accountEmail: fields.accountEmail.value.trim(),
    deliveryEmail: fields.deliveryEmail.value.trim(),
    dataProcessing: document.querySelector("#consentData").checked,
    aiAnalysis: document.querySelector("#consentAi").checked,
    reportDelivery: document.querySelector("#consentDelivery").checked,
    version: "launch-consent-v1",
    status: "accepted",
  };
}

function renderTrustCenter() {
  const latest = appState.consents[appState.consents.length - 1];
  document.querySelector("#trustStatus").className = `trust-status ${latest ? "ok" : ""}`;
  document.querySelector("#trustStatus").innerHTML = latest
    ? `<strong>${t("consentSaved")}</strong><span>${latest.clientName || fields.clientName.value} · ${latest.version || "v1"} · ${latest.createdAt || ""}</span>`
    : `<strong>${t("noConsent")}</strong><span>${t("consentMissing")}</span>`;
}

function renderTeamAccess() {
  const members = appState.teamMembers || [];
  document.querySelector("#accessStatus").className = `access-status ${members.length ? "ok" : ""}`;
  document.querySelector("#accessStatus").innerHTML = members.length
    ? `<strong>${t("memberInvited")}</strong><span>${members.length} · ${appState.apiOnline ? t("backendConnected") : t("backendFallback")}</span>`
    : `<strong>${t("noMembers")}</strong><span>${fields.accountEmail.value || fields.agencyName.value}</span>`;
  document.querySelector("#memberList").innerHTML = members.length
    ? members.slice(-4).reverse().map((member) => `<div><strong>${member.email}</strong><span>${member.role || "viewer"} · ${member.status || "invited"} · ${member.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noMembers")}</p>`;
}

async function inviteTeamMember() {
  const button = document.querySelector("#inviteMemberBtn");
  setButtonState(button, "loading", "inviteMember");
  const email = fields.memberEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.querySelector("#accessStatus").className = "access-status error";
    document.querySelector("#accessStatus").innerHTML = `<strong>${t("memberEmail")}</strong><span>${t("needsSetup")}</span>`;
    setButtonState(button, "error", "inviteMember");
    return;
  }
  const payload = {
    agencyName: fields.agencyName.value,
    accountEmail: fields.accountEmail.value.trim(),
    email,
    role: fields.memberRole.value,
    status: "invited",
  };
  try {
    const saved = await apiCreate("team-members", payload);
    if (saved) {
      appState.teamMembers = [...appState.teamMembers, saved];
      renderTeamAccess();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "inviteMember");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const members = localList("agencyReportTeamMembers");
  members.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportTeamMembers", members);
  appState.teamMembers = members;
  renderTeamAccess();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "inviteMember");
}

async function saveConsent() {
  const button = document.querySelector("#saveConsentBtn");
  setButtonState(button, "loading", "saveConsent");
  const payload = consentPayload();
  if (!payload.dataProcessing || !payload.aiAnalysis || !payload.reportDelivery) {
    document.querySelector("#trustStatus").className = "trust-status error";
    document.querySelector("#trustStatus").innerHTML = `<strong>${t("consentMissing")}</strong><span>${t("trustTitle")}</span>`;
    setButtonState(button, "error", "saveConsent");
    return;
  }
  try {
    const saved = await apiCreate("consents", payload);
    if (saved) {
      appState.consents = [...appState.consents, saved];
      renderTrustCenter();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "saveConsent");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const consents = localList("agencyReportConsents");
  consents.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportConsents", consents);
  appState.consents = consents;
  renderTrustCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "saveConsent");
}

async function saveIntake() {
  const button = document.querySelector("#saveIntakeBtn");
  setButtonState(button, "loading", "saveIntake");
  const payload = intakePayload();
  if (!payload.request) {
    document.querySelector("#intakeStatus").className = "intake-status error";
    document.querySelector("#intakeStatus").innerHTML = `<strong>${t("noIntake")}</strong><span>${t("clientRequest")}</span>`;
    setButtonState(button, "error", "saveIntake");
    return;
  }
  try {
    const saved = await apiCreate("intake", payload);
    if (saved) {
      appState.intakes = [...appState.intakes, saved];
      renderIntakeStatus();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "saveIntake");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const intakes = localList("agencyReportIntakes");
  intakes.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportIntakes", intakes);
  appState.intakes = intakes;
  renderIntakeStatus();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "saveIntake");
}

async function testDataSource() {
  const button = document.querySelector("#testSourceBtn");
  setButtonState(button, "loading", "testSource");
  try {
    const connectorTest = await apiCreate("data-sources/test", sourcePayload());
    if (connectorTest) {
      document.querySelector("#sourceStatus").className = `source-status ${connectorTest.ok ? "ok" : "error"}`;
      document.querySelector("#sourceStatus").innerHTML = `<strong>${connectorTest.ok ? t("sourceTested") : t("sourceNeedsUrl")}</strong><span>${connectorTest.provider || fields.sourceType.value} · ${connectorTest.mode || "-"} · ${connectorTest.rowCount || 0} rows</span>`;
      setButtonState(button, connectorTest.ok ? "success" : "error", "testSource");
      return;
    }
    if (fields.sheetUrl.value.trim()) {
      const response = await fetch(fields.sheetUrl.value.trim());
      if (!response.ok) throw new Error("Source fetch failed");
      const text = await response.text();
      parseCsv(text);
    } else if (fields.csvInput.value.trim()) {
      parseCsv(fields.csvInput.value);
    } else {
      throw new Error("Missing data source");
    }
    document.querySelector("#sourceStatus").className = "source-status ok";
    document.querySelector("#sourceStatus").innerHTML = `<strong>${t("sourceTested")}</strong><span>${sourcePayload().rowCount || "URL"} · ${fields.sourceType.value}</span>`;
    setButtonState(button, "success", "testSource");
  } catch {
    document.querySelector("#sourceStatus").className = "source-status error";
    document.querySelector("#sourceStatus").innerHTML = `<strong>${t("sourceNeedsUrl")}</strong><span>${fields.sourceType.value}</span>`;
    setButtonState(button, "error", "testSource");
  }
}

async function saveDataSource() {
  const button = document.querySelector("#saveSourceBtn");
  setButtonState(button, "loading", "saveSource");
  const payload = sourcePayload();
  delete payload.csv;
  if (payload.status === "needs_data") {
    document.querySelector("#sourceStatus").className = "source-status error";
    document.querySelector("#sourceStatus").innerHTML = `<strong>${t("sourceNeedsUrl")}</strong><span>${fields.sourceType.value}</span>`;
    setButtonState(button, "error", "saveSource");
    return;
  }
  try {
    const saved = await apiCreate("data-sources", payload);
    if (saved) {
      appState.dataSources = [...appState.dataSources, saved];
      renderSourceCenter();
      renderLaunchChecklist();
      renderProgressContent();
      setButtonState(button, "success", "saveSource");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const dataSources = localList("agencyReportDataSources");
  dataSources.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportDataSources", dataSources);
  appState.dataSources = dataSources;
  renderSourceCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "saveSource");
}

function renderClientHub() {
  const mode = appState.apiOnline ? t("backendConnected") : t("backendFallback");
  const plan = planLimits[fields.planSelect.value] || planLimits.starter;
  const clients = appState.clients || [];
  const reports = appState.reports || [];
  const portalInvites = appState.portalInvites || [];
  const latestInvite = portalInvites[portalInvites.length - 1];
  document.querySelector("#apiMode").value = mode;
  document.querySelector("#clientCount").textContent = `${clients.length} / ${plan.clients}`;
  document.querySelector("#reportUsage").textContent = `${reports.length} / ${plan.reports}`;
  document.querySelector("#clientList").innerHTML = clients.length
    ? clients.slice(-5).reverse().map((client) => `<div><strong>${client.clientName || client.name}</strong><span>${client.deliveryEmail || client.email || "-"}</span></div>`).join("")
    : `<p>${t("noClients")}</p>`;
  document.querySelector("#portalInviteList").innerHTML = portalInvites.length
    ? portalInvites.slice(-3).reverse().map((invite) => `<div><strong>${invite.clientName || fields.clientName.value}</strong><span>${invite.url || invite.portalUrl || "-"} · ${invite.status || "active"} · ${invite.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noPortalInvites")}</p>`;
  const nearLimit = clients.length >= plan.clients * 0.8 || reports.length >= plan.reports * 0.8;
  document.querySelector("#clientHubStatus").className = `status-panel compact-status ${nearLimit ? "warning" : "ok"}`;
  document.querySelector("#clientHubStatus").innerHTML = nearLimit
    ? `<strong>${t("clientLimitWarning")}</strong><span>${mode}</span>`
    : latestInvite
    ? `<strong>${t("portalInviteCreated")}</strong><span>${latestInvite.url || latestInvite.portalUrl || "-"}</span>`
    : `<strong>${mode}</strong><span>${fields.planSelect.options[fields.planSelect.selectedIndex]?.textContent || "Starter"}</span>`;
}

function renderReportLibrary() {
  const reports = appState.reports || [];
  const latest = reports[reports.length - 1];
  document.querySelector("#libraryCount").textContent = String(reports.length);
  document.querySelector("#latestReportMonth").textContent = latest?.reportMonth || latest?.month || "-";
  document.querySelector("#reportList").innerHTML = reports.length
    ? reports.slice(-5).reverse().map((report) => {
      const score = report.score || report.snapshot?.score || "-";
      const month = report.reportMonth || report.month || "-";
      return `<div><strong>${report.clientName || fields.clientName.value}</strong><span>${month} · ${t("healthScoreLabel")} ${score} · ${report.createdAt || ""}</span></div>`;
    }).join("")
    : `<p>${t("noReports")}</p>`;
}

function renderBillingHub() {
  {
  const planLabel = fields.planSelect.options[fields.planSelect.selectedIndex]?.textContent || "Starter";
  const invoices = appState.invoices || [];
  const billingIntents = appState.billingIntents || [];
  const latestInvoice = invoices[invoices.length - 1];
  const latestIntent = billingIntents[billingIntents.length - 1] || appState.checkout;
  const acceptedCount = billingIntents.filter((intent) => intent.status === "accepted").length;
  const quoteLink = latestIntent?.quoteUrl
    ? `<a href="${latestIntent.quoteUrl}" target="_blank" rel="noreferrer">${latestIntent.quoteUrl}</a>`
    : (latestIntent?.checkoutUrl || "-");
  document.querySelector("#billingPlan").textContent = planLabel;
  document.querySelector("#checkoutStatus").textContent = acceptedCount ? `Accepted ${acceptedCount}` : (latestInvoice ? t("invoiceReady") : (latestIntent ? t("checkoutCreated") : t("checkoutDraft")));
  document.querySelector("#billingStatus").className = `status-panel compact-status ${latestIntent || latestInvoice ? "ok" : ""}`;
  document.querySelector("#billingStatus").innerHTML = latestInvoice
    ? `<strong>${t("invoiceCreated")}</strong><span>${latestInvoice.invoiceNumber || latestInvoice.id || "-"} / ${formatInvoiceAmount(latestInvoice)}</span>`
    : latestIntent
    ? `<strong>${latestIntent.status === "accepted" ? "Quote accepted" : t("checkoutCreated")}</strong><span>${quoteLink}</span>`
    : `<strong>${t("checkoutDraft")}</strong><span>${appState.apiOnline ? t("backendConnected") : t("backendFallback")}</span>`;
  const quoteRows = billingIntents.slice(-4).reverse().map((intent) => `<div><strong>${intent.status === "accepted" ? "Accepted quote" : "Quote draft"} · ${formatBillingAmount(intent)}</strong><span>${intent.accountName || fields.accountName.value || fields.agencyName.value} / ${intent.plan || "-"} / ${intent.quoteUrl ? `<a href="${intent.quoteUrl}" target="_blank" rel="noreferrer">${intent.quoteUrl}</a>` : "-"} / ${intent.acceptedAt || intent.createdAt || ""}</span></div>`);
  const invoiceRows = invoices.slice(-4).reverse().map((invoice) => `<div><strong>${invoice.invoiceNumber || invoice.id}</strong><span>${invoice.accountName || fields.accountName.value || fields.agencyName.value} / ${formatInvoiceAmount(invoice)} / ${invoice.status || "draft"} / ${invoice.invoiceUrl ? `<a href="${invoice.invoiceUrl}" target="_blank" rel="noreferrer">${invoice.invoiceUrl}</a>` : (invoice.createdAt || "")}</span></div>`);
  const actionRows = billingIntents.filter((intent) => intent.status === "accepted" && !invoices.some((invoice) => invoice.quoteId === intent.id || invoice.quoteToken === intent.token)).slice(-3).reverse().map((intent) => `<div><strong>Ready to invoice / ${formatBillingAmount(intent)}</strong><span>${intent.accountName || fields.accountName.value || fields.agencyName.value} / ${intent.plan || "-"} / ${intent.acceptedAt || ""}</span><button class="ghost mini-action" type="button" data-quote-invoice="${intent.token || intent.id}">Create Invoice</button></div>`);
  document.querySelector("#invoiceList").innerHTML = quoteRows.length || invoiceRows.length
    ? [...actionRows, ...quoteRows, ...invoiceRows].join("")
    : `<p>${t("noInvoices")}</p>`;
  return;
  }
  const planLabel = fields.planSelect.options[fields.planSelect.selectedIndex]?.textContent || "Starter";
  const invoices = appState.invoices || [];
  const latestInvoice = invoices[invoices.length - 1];
  const quoteLink = appState.checkout?.quoteUrl
    ? `<a href="${appState.checkout.quoteUrl}" target="_blank" rel="noreferrer">${appState.checkout.quoteUrl}</a>`
    : (appState.checkout?.checkoutUrl || "-");
  document.querySelector("#billingPlan").textContent = planLabel;
  document.querySelector("#checkoutStatus").textContent = latestInvoice ? t("invoiceReady") : (appState.checkout ? t("checkoutCreated") : t("checkoutDraft"));
  document.querySelector("#billingStatus").className = `status-panel compact-status ${appState.checkout || latestInvoice ? "ok" : ""}`;
  document.querySelector("#billingStatus").innerHTML = latestInvoice
    ? `<strong>${t("invoiceCreated")}</strong><span>${latestInvoice.invoiceNumber || latestInvoice.id || "-"} · ${formatInvoiceAmount(latestInvoice)}</span>`
    : appState.checkout
    ? `<strong>${t("checkoutCreated")}</strong><span>${quoteLink}</span>`
    : `<strong>${t("checkoutDraft")}</strong><span>${appState.apiOnline ? t("backendConnected") : t("backendFallback")}</span>`;
  document.querySelector("#invoiceList").innerHTML = invoices.length
    ? invoices.slice(-4).reverse().map((invoice) => `<div><strong>${invoice.invoiceNumber || invoice.id}</strong><span>${invoice.accountName || fields.accountName.value || fields.agencyName.value} · ${formatInvoiceAmount(invoice)} · ${invoice.status || "draft"} · ${invoice.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noInvoices")}</p>`;
}

function renderAgentStatus() {
  const latestRun = appState.aiRuns[appState.aiRuns.length - 1];
  const latestSchedule = appState.schedules[appState.schedules.length - 1];
  const aiMeta = latestRun ? `${latestRun.provider || "fallback"} / ${latestRun.model || "rules"} / ${latestRun.mode || "fallback"}` : t("noBackendAiRun");
  document.querySelector("#agentStatus").innerHTML = `
    <div><span>${t("backendAiRun")}</span><strong>${latestRun ? latestRun.status || "completed" : t("noBackendAiRun")}</strong><small>${aiMeta}</small></div>
    <div><span>${t("scheduleSaved")}</span><strong>${latestSchedule ? latestSchedule.status || "active" : t("noSchedule")}</strong></div>
  `;
}

async function runBackendAi() {
  const button = document.querySelector("#runBackendAiBtn");
  await createBackendAiDraft(button, "runBackendAi");
}

async function createBackendAiDraft(button, labelKey = "runBackendAi") {
  setButtonState(button, "loading", labelKey);
  const workOrder = analyzeClientRequest();
  const payload = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    request: fields.clientRequest.value,
    kpis: workOrder.kpis,
    dataNeeds: workOrder.dataNeeds,
    tone: fields.tone.value,
  };
  try {
    const saved = await apiCreate("report/run", payload);
    if (saved) {
      appState.aiRuns = [...appState.aiRuns, saved];
      renderAgentStatus();
      renderLaunchChecklist();
      renderProgressContent();
      setButtonState(button, "success", labelKey);
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const aiRuns = localList("agencyReportAiRuns");
  aiRuns.push({ ...payload, id: `local-${Date.now()}`, status: "completed", createdAt: new Date().toISOString() });
  localSave("agencyReportAiRuns", aiRuns);
  appState.aiRuns = aiRuns;
  renderAgentStatus();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", labelKey);
}

async function createSchedule() {
  const button = document.querySelector("#createScheduleBtn");
  setButtonState(button, "loading", "createSchedule");
  const payload = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    cadence: fields.scheduleCadence.value,
    deliveryEmail: fields.deliveryEmail.value,
    automationLevel: fields.automationLevel.value,
  };
  try {
    const saved = await apiCreate("report/schedule", payload);
    if (saved) {
      appState.schedules = [...appState.schedules, saved];
      renderAgentStatus();
      renderLaunchChecklist();
      renderProgressContent();
      setButtonState(button, "success", "createSchedule");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const schedules = localList("agencyReportSchedules");
  schedules.push({ ...payload, id: `local-${Date.now()}`, status: "active", createdAt: new Date().toISOString() });
  localSave("agencyReportSchedules", schedules);
  appState.schedules = schedules;
  renderAgentStatus();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "createSchedule");
}

function renderDeliveryCenter() {
  const latest = appState.deliveries[appState.deliveries.length - 1];
  const latestShare = appState.shareLinks[appState.shareLinks.length - 1];
  const latestEmail = appState.emailJobs[appState.emailJobs.length - 1];
  const cards = [
    [t("reviewStatus"), appState.lastReviewedAt ? t("reviewed") : t("notReviewed")],
    [t("deliveryStatus"), latest ? t("delivered") : t("notDelivered")],
    [t("shareLinkReady"), latestShare ? (latestShare.url || latestShare.shareUrl || "-") : t("noShareLinks")],
    [t("emailQueueReady"), latestEmail ? (latestEmail.status || "queued") : t("noEmailJobs")],
    [t("deliveryEmail"), fields.deliveryEmail.value || "-"],
    [t("deliveryHistory"), latest ? `${latest.clientName || fields.clientName.value} · ${latest.deliveredAt || latest.createdAt || ""}` : t("noDeliveries")],
  ];
  document.querySelector("#deliveryCenter").innerHTML = cards
    .map(([label, value]) => `<div class="delivery-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
  document.querySelector("#shareLinkPanel").innerHTML = appState.shareLinks.length
    ? appState.shareLinks.slice(-3).reverse().map((link) => `<div><strong>${link.clientName || fields.clientName.value}</strong><span>${link.url || link.shareUrl || "-"} · ${link.status || "active"} · ${link.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noShareLinks")}</p>`;
  document.querySelector("#emailJobPanel").innerHTML = appState.emailJobs.length
    ? appState.emailJobs.slice(-3).reverse().map((job) => `<div><strong>${job.to || "-"}</strong><span>${job.subject || "-"} · ${job.status || "queued"} · ${job.createdAt || ""}</span></div>`).join("")
    : `<p>${t("noEmailJobs")}</p>`;
}

function approveDraft() {
  appState.lastReviewedAt = new Date();
  renderDeliveryCenter();
  renderLaunchChecklist();
  setButtonState(document.querySelector("#approveDraftBtn"), "success", "approveDraft");
}

async function createShareLink() {
  const button = document.querySelector("#createShareLinkBtn");
  setButtonState(button, "loading", "createShareLink");
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const latestReport = appState.reports[appState.reports.length - 1];
  const payload = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportMonth: fields.reportMonth.value,
    reportType: fields.reportType.value,
    status: "active",
    token,
    url: `/client/report/${token}`,
    reportId: latestReport?.id || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  try {
    const saved = await apiCreate("share-links", payload);
    if (saved) {
      appState.shareLinks = [...appState.shareLinks, saved];
      renderDeliveryCenter();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "createShareLink");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const shareLinks = localList("agencyReportShareLinks");
  shareLinks.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportShareLinks", shareLinks);
  appState.shareLinks = shareLinks;
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "createShareLink");
}

async function queueEmailDelivery() {
  const button = document.querySelector("#queueEmailBtn");
  setButtonState(button, "loading", "queueEmail");
  const latestShare = appState.shareLinks[appState.shareLinks.length - 1];
  const to = fields.deliveryEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    setButtonState(button, "error", "queueEmail");
    return;
  }
  const payload = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportMonth: fields.reportMonth.value,
    reportType: fields.reportType.value,
    to,
    subject: `${fields.clientName.value || "Client"} ${monthLabel(fields.reportMonth.value)} ${reportTypeLabel(fields.reportType.value)}`,
    shareUrl: latestShare?.url || null,
    status: "queued",
    provider: "manual",
  };
  try {
    const saved = await apiCreate("email-jobs", payload);
    if (saved) {
      appState.emailJobs = [...appState.emailJobs, saved];
      renderDeliveryCenter();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "queueEmail");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const emailJobs = localList("agencyReportEmailJobs");
  emailJobs.push({ ...payload, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportEmailJobs", emailJobs);
  appState.emailJobs = emailJobs;
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "queueEmail");
}

async function deliverReport() {
  const button = document.querySelector("#deliverReportBtn");
  setButtonState(button, "loading", "deliverReport");
  const delivery = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportMonth: fields.reportMonth.value,
    reportType: fields.reportType.value,
    deliveryEmail: fields.deliveryEmail.value,
    reviewedAt: appState.lastReviewedAt ? appState.lastReviewedAt.toISOString() : null,
    status: "delivered",
  };
  try {
    const saved = await apiCreate("report/deliver", delivery);
    if (saved) {
      appState.deliveries = [...appState.deliveries, saved];
      renderDeliveryCenter();
      renderLaunchChecklist();
      renderProgressContent();
      setButtonState(button, "success", "deliverReport");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const deliveries = localList("agencyReportDeliveries");
  deliveries.push({ ...delivery, id: `local-${Date.now()}`, deliveredAt: new Date().toISOString() });
  localSave("agencyReportDeliveries", deliveries);
  appState.deliveries = deliveries;
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "deliverReport");
}

async function saveAccount() {
  const button = document.querySelector("#saveAccountBtn");
  setButtonState(button, "loading", "saveAccount");
  const account = {
    name: fields.accountName.value || fields.agencyName.value,
    email: fields.accountEmail.value,
    plan: fields.planSelect.value,
  };
  try {
    const saved = await apiCreate("accounts", account);
    appState.account = saved || { ...account, id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
  } catch {
    appState.apiOnline = false;
    appState.account = { ...account, id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
  }
  if (!appState.apiOnline) localStorage.setItem("agencyReportAccount", JSON.stringify(appState.account));
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "saveAccount");
}

async function createCheckout() {
  const button = document.querySelector("#createCheckoutBtn");
  setButtonState(button, "loading", "createCheckout");
  const plan = planLimits[fields.planSelect.value] || planLimits.starter;
  const currency = fields.currency.value;
  const payload = {
    accountName: fields.accountName.value || fields.agencyName.value,
    accountEmail: fields.accountEmail.value,
    plan: fields.planSelect.value,
    currency,
    amount: currency === "TWD" ? plan.monthlyTwd : plan.monthlyUsd,
    legalVersion,
  };
  try {
    if (!appState.apiOnline) throw new Error("API offline");
    appState.checkout = await apiCreate("billing/checkout", payload);
    appState.billingIntents = [...appState.billingIntents, appState.checkout];
  } catch {
    appState.checkout = {
      id: `local-checkout-${Date.now()}`,
      token: `local-${Date.now().toString(36)}`,
      status: "draft",
      plan: payload.plan,
      currency: payload.currency,
      amount: payload.amount,
      quoteUrl: `/billing/quote/local-${Date.now().toString(36)}`,
      checkoutUrl: `/billing/mock-checkout?plan=${payload.plan}`,
      createdAt: new Date().toISOString(),
    };
    appState.billingIntents = [...appState.billingIntents, appState.checkout];
  }
  localStorage.setItem("agencyReportCheckout", JSON.stringify(appState.checkout));
  localStorage.setItem("agencyReportBillingIntents", JSON.stringify(appState.billingIntents));
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "createCheckout");
  return appState.checkout;
}

async function createInvoice() {
  const button = document.querySelector("#createInvoiceBtn");
  setButtonState(button, "loading", "createInvoice");
  const plan = planLimits[fields.planSelect.value] || planLimits.starter;
  const currency = fields.currency.value;
  const amount = currency === "TWD" ? plan.monthlyTwd : plan.monthlyUsd;
  const payload = {
    accountName: fields.accountName.value || fields.agencyName.value,
    accountEmail: fields.accountEmail.value,
    clientName: fields.clientName.value,
    plan: fields.planSelect.value,
    currency,
    amount,
    status: "draft",
    invoiceNumber: `AR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String((appState.invoices || []).length + 1).padStart(3, "0")}`,
    dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };
  try {
    const saved = await apiCreate("invoices", payload);
    if (saved) {
      appState.invoices = [...appState.invoices, saved];
      renderBillingHub();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "createInvoice");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const invoices = localList("agencyReportInvoices");
  invoices.push({ ...payload, id: `local-invoice-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportInvoices", invoices);
  appState.invoices = invoices;
  renderBillingHub();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "createInvoice");
}

async function createInvoiceFromAcceptedQuote(token) {
  const button = document.querySelector(`[data-quote-invoice="${CSS.escape(token)}"]`);
  if (button) {
    button.disabled = true;
    button.textContent = t("loading");
  }
  try {
    const saved = await apiCreate("billing/quote/invoice", { token, clientName: fields.clientName.value });
    if (saved) {
      appState.invoices = [...appState.invoices, saved];
      renderBillingHub();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  if (button) {
    button.disabled = false;
    button.textContent = "Create Invoice";
  }
}

async function saveClient() {
  const button = document.querySelector("#saveClientBtn");
  setButtonState(button, "loading", "saveClient");
  const client = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    deliveryEmail: fields.deliveryEmail.value,
    plan: fields.planSelect.value,
    automationLevel: fields.automationLevel.value,
    scheduleCadence: fields.scheduleCadence.value,
    request: fields.clientRequest.value,
  };
  try {
    const saved = await apiCreate("clients", client);
    if (saved) {
      await loadClients();
      setButtonState(button, "success", "saveClient");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const clients = localList("agencyReportClients");
  clients.push({ ...client, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportClients", clients);
  appState.clients = clients;
  renderClientHub();
  setButtonState(button, "success", "saveClient");
}

async function syncClientData() {
  const button = document.querySelector("#syncClientsBtn");
  setButtonState(button, "loading", "syncClients");
  await detectApi();
  await Promise.all([loadTemplates(), loadClients(), loadReports(), loadPortalInvites()]);
  setButtonState(button, "success", "syncClients");
}

async function createPortalInvite() {
  const button = document.querySelector("#createPortalInviteBtn");
  setButtonState(button, "loading", "createPortalInvite");
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const payload = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    request: fields.clientRequest.value.trim(),
    recipientEmail: fields.deliveryEmail.value.trim() || fields.accountEmail.value.trim(),
    status: "active",
    token,
    url: `/client/intake/${token}`,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  };
  try {
    const saved = await apiCreate("portal-invites", payload);
    if (saved) {
      appState.portalInvites = [...appState.portalInvites, saved];
      renderClientHub();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      setButtonState(button, "success", "createPortalInvite");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const portalInvites = localList("agencyReportPortalInvites");
  portalInvites.push({ ...payload, id: `local-portal-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportPortalInvites", portalInvites);
  appState.portalInvites = portalInvites;
  renderClientHub();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "createPortalInvite");
}

async function refreshPortalSubmissions() {
  const button = document.querySelector("#refreshPortalSubmissionsBtn");
  setButtonState(button, "loading", "refreshPortalSubmissions");
  await loadPortalSubmissions();
  setButtonState(button, "success", "refreshPortalSubmissions");
}

function applyLatestPortalSubmission() {
  const button = document.querySelector("#applyPortalSubmissionBtn");
  const latest = latestPendingPortalSubmission() || appState.portalSubmissions[appState.portalSubmissions.length - 1];
  if (!latest) {
    setButtonState(button, "error", "applyPortalSubmission");
    return;
  }
  const notes = latest.notes ? `\n\n${latest.notes}` : "";
  fields.clientRequest.value = `${latest.goal || ""}${notes}`.trim();
  if (latest.sourceUrl) fields.sheetUrl.value = latest.sourceUrl;
  if (latest.contactEmail) fields.deliveryEmail.value = latest.contactEmail;
  refreshAiAutomation();
  renderSourceCenter();
  renderIntakeStatus();
  renderPortalSubmissions();
  renderLaunchChecklist();
  renderProgressContent();
  document.querySelector("#intakeStatus").className = "intake-status ok";
  document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalSubmissionApplied")}</strong><span>${latest.contactEmail || latest.token || "-"}</span>`;
  setButtonState(button, "success", "applyPortalSubmission");
}

async function processLatestPortalSubmission() {
  const button = document.querySelector("#processPortalSubmissionBtn");
  const latest = latestPendingPortalSubmission();
  if (!latest) {
    document.querySelector("#intakeStatus").className = "intake-status error";
    document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalAlreadyProcessed")}</strong><span>${t("portalSubmissionReady")}</span>`;
    setButtonState(button, "error", "processPortalSubmission");
    return;
  }
  setButtonState(button, "loading", "processPortalSubmission");
  applyLatestPortalSubmission();
  const requestText = fields.clientRequest.value.trim();
  const client = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    deliveryEmail: fields.deliveryEmail.value,
    plan: fields.planSelect.value,
    automationLevel: fields.automationLevel.value,
    scheduleCadence: fields.scheduleCadence.value,
    request: requestText,
    source: "portal_submission",
    portalToken: latest.token,
  };
  const intake = intakePayload();
  const source = {
    ...sourcePayload(),
    url: latest.sourceUrl || fields.sheetUrl.value.trim(),
    ownerEmail: latest.contactEmail || fields.sourceOwner.value.trim(),
    status: latest.sourceUrl || fields.sheetUrl.value.trim() ? "ready" : "needs_data",
    source: "portal_submission",
    portalToken: latest.token,
  };
  try {
    const savedClient = await apiCreate("clients", client);
    const savedIntake = await apiCreate("intake", intake);
    const savedSource = await apiCreate("data-sources", source);
    if (savedClient) appState.clients = [...appState.clients, savedClient];
    if (savedIntake) appState.intakes = [...appState.intakes, savedIntake];
    if (savedSource) appState.dataSources = [...appState.dataSources, savedSource];
    if (savedClient || savedIntake || savedSource) {
      const processed = await apiCreate("portal-submissions/process", {
        id: latest.id,
        token: latest.token,
        caseClientId: savedClient?.id || null,
        caseIntakeId: savedIntake?.id || null,
        caseDataSourceId: savedSource?.id || null,
      });
      if (processed) {
        appState.portalSubmissions = appState.portalSubmissions.map((item) => (item.id === processed.id || item.token === processed.token ? processed : item));
      }
      renderClientHub();
      renderIntakeStatus();
      renderPortalSubmissions();
      renderSourceCenter();
      renderLaunchChecklist();
      renderProgressContent();
      await loadAuditLogs();
      document.querySelector("#intakeStatus").className = "intake-status ok";
      document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalSubmissionProcessed")}</strong><span>${latest.contactEmail || latest.token || "-"}</span>`;
      setButtonState(button, "success", "processPortalSubmission");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const clients = localList("agencyReportClients");
  const intakes = localList("agencyReportIntakes");
  const dataSources = localList("agencyReportDataSources");
  const portalSubmissions = localList("agencyReportPortalSubmissions");
  clients.push({ ...client, id: `local-client-${Date.now()}`, createdAt: new Date().toISOString() });
  intakes.push({ ...intake, id: `local-intake-${Date.now()}`, createdAt: new Date().toISOString() });
  dataSources.push({ ...source, id: `local-source-${Date.now()}`, createdAt: new Date().toISOString() });
  const processedAt = new Date().toISOString();
  const updatedSubmissions = portalSubmissions.map((item) => (item.id === latest.id || item.token === latest.token ? { ...item, status: "processed", processedAt } : item));
  localSave("agencyReportClients", clients);
  localSave("agencyReportIntakes", intakes);
  localSave("agencyReportDataSources", dataSources);
  localSave("agencyReportPortalSubmissions", updatedSubmissions);
  appState.clients = clients;
  appState.intakes = intakes;
  appState.dataSources = dataSources;
  appState.portalSubmissions = updatedSubmissions;
  renderClientHub();
  renderIntakeStatus();
  renderPortalSubmissions();
  renderSourceCenter();
  renderLaunchChecklist();
  renderProgressContent();
  document.querySelector("#intakeStatus").className = "intake-status ok";
  document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalSubmissionProcessed")}</strong><span>${latest.contactEmail || latest.token || "-"}</span>`;
  setButtonState(button, "success", "processPortalSubmission");
}

async function runPortalAiDraft() {
  const button = document.querySelector("#runPortalAiDraftBtn");
  setButtonState(button, "loading", "runPortalAiDraft");
  if (latestPendingPortalSubmission()) {
    await processLatestPortalSubmission();
  } else {
    applyLatestPortalSubmission();
  }
  if (!fields.clientRequest.value.trim()) {
    document.querySelector("#intakeStatus").className = "intake-status error";
    document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalAlreadyProcessed")}</strong><span>${t("clientRequest")}</span>`;
    setButtonState(button, "error", "runPortalAiDraft");
    return;
  }
  await createBackendAiDraft(button, "runPortalAiDraft");
  document.querySelector("#intakeStatus").className = "intake-status ok";
  document.querySelector("#intakeStatus").innerHTML = `<strong>${t("portalAiDraftCreated")}</strong><span>${fields.deliveryEmail.value || fields.clientName.value}</span>`;
}

function applyLanguage(lang) {
  uiState.lang = lang;
  localStorage.setItem("agencyReportLang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
  document.title = `AgencyReport AI | ${t("appTitle")}`;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (i18n[lang][key]) node.textContent = i18n[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (i18n[lang][key]) node.placeholder = i18n[lang][key];
  });
  document.querySelectorAll("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === lang));
  updateWorkspaceNavLanguage();
  updateThemeLabels();
  updateHomeLanguage();
  updateSimpleModeCopy();
  updateAccountDock();
  if (!document.querySelector("#upgradeModal")?.hidden) renderUpgradePlans();
  applyLegalText();
  renderLegalPanel();
  updateOptionsLanguage();
  if (isDefaultClientName(fields.clientName.value)) {
    fields.clientName.value = defaultClientName(fields.sampleSelect.value, lang);
  }
  loadTemplates();
  generateReport();
  updateCaseSummary();
  refreshAiAutomation();
  renderClientHub();
  renderReportLibrary();
  renderBillingHub();
  renderTeamAccess();
  renderSourceCenter();
  renderIntakeStatus();
  renderPortalSubmissions();
  renderTrustCenter();
  renderDeliveryCenter();
  renderAgentStatus();
  renderAuditCenter();
  renderLaunchChecklist();
  renderProgressContent();
}

function updateOptionsLanguage() {
  const optionText = {
    zh: {
      samples: ["Google / Meta 廣告月報", "SEO 成效月報", "社群成效月報"],
      reportTypes: ["廣告成效月報", "SEO 成效月報", "社群成效月報", "整合行銷月報"],
      tones: ["高層摘要", "顧問式說明", "直接行動導向"],
      businessTypes: ["在地服務", "電商", "B2B", "內容 / 媒體"],
      automationLevels: ["AI 輔助", "AI 產草稿", "全自動交付草案"],
      scheduleCadences: [t("scheduleManual"), t("scheduleMonthly"), t("scheduleWeekly")],
    },
    en: {
      samples: ["Google / Meta Ads Report", "SEO Performance Report", "Social Performance Report"],
      reportTypes: ["Ads Performance Report", "SEO Performance Report", "Social Performance Report", "Integrated Marketing Report"],
      tones: ["Executive Summary", "Consultative", "Direct Action"],
      businessTypes: ["Local Service", "E-commerce", "B2B", "Content / Media"],
      automationLevels: ["AI Assist", "AI Draft", "Auto Delivery Draft"],
      scheduleCadences: [t("scheduleManual"), t("scheduleMonthly"), t("scheduleWeekly")],
    },
  }[uiState.lang];
  [...fields.sampleSelect.options].forEach((option, index) => { option.textContent = optionText.samples[index]; });
  [...fields.reportType.options].forEach((option, index) => { option.textContent = optionText.reportTypes[index]; });
  [...fields.tone.options].forEach((option, index) => { option.textContent = optionText.tones[index]; });
  [...fields.businessType.options].forEach((option, index) => { option.textContent = optionText.businessTypes[index]; });
  [...fields.automationLevel.options].forEach((option, index) => { option.textContent = optionText.automationLevels[index]; });
  [...fields.scheduleCadence.options].forEach((option, index) => { option.textContent = optionText.scheduleCadences[index]; });
  const planNames = uiState.lang === "en" ? ["Starter", "Agency", "Professional"] : ["入門版", "代理商版", "專業版"];
  [...fields.planSelect.options].forEach((option, index) => { option.textContent = planNames[index] || option.textContent; });
}

function updateCaseSummary() {
  const reportText = fields.reportType.options[fields.reportType.selectedIndex]?.textContent || "";
  document.querySelector("#caseSummary").textContent = `${fields.clientName.value || "Untitled"} / ${reportText}`;
  document.querySelector("#caseMonthChip").textContent = fields.reportMonth.value || metricLabel("noMonth");
  document.querySelector("#caseCurrencyChip").textContent = fields.currency.value;
  renderHomeDashboard();
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeNumber(value) {
  const cleaned = String(value ?? "").replace(/[$,%\s,]/g, "");
  if (!cleaned) return 0;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], headers: [], errors: ["至少需要表頭與一列資料。"] };
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());
  const missing = requiredColumns.filter((column) => !headers.includes(column));
  const errors = missing.length ? [`缺少必填欄位：${missing.join(", ")}。`] : [];
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = header === "channel" ? values[index] || "未命名渠道" : normalizeNumber(values[index]);
      return record;
    }, {});
  });
  return { rows, headers, errors };
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function change(current, previous) {
  if (!previous) return 0;
  return (current - previous) / previous;
}

function formatTrend(value) {
  return `${value > 0 ? "+" : ""}${percentFormatter.format(value)}`;
}

function trendClass(value, reverse = false) {
  if (Math.abs(value) < 0.025) return "flat";
  return reverse ? (value < 0 ? "up" : "down") : value > 0 ? "up" : "down";
}

function monthLabel(value) {
  if (!value) return uiState.lang === "en" ? "No month set" : "未設定月份";
  const [year, month] = value.split("-");
  if (uiState.lang === "en") return `${year}-${month}`;
  return `${year} 年 ${month} 月`;
}

function reportTypeLabel(type) {
  const labels = {
    zh: { ads: "廣告成效月報", seo: "SEO 成效月報", social: "社群成效月報", mixed: "整合行銷月報" },
    en: { ads: "Ads Performance Report", seo: "SEO Performance Report", social: "Social Performance Report", mixed: "Integrated Marketing Report" },
  };
  return labels[uiState.lang][type];
}

function calculate(rows) {
  const spend = sum(rows, "spend");
  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");
  const conversions = sum(rows, "conversions");
  const revenue = sum(rows, "revenue");
  const lastSpend = sum(rows, "last_spend");
  const lastClicks = sum(rows, "last_clicks");
  const lastConversions = sum(rows, "last_conversions");
  const lastRevenue = sum(rows, "last_revenue");
  const ctr = impressions ? clicks / impressions : 0;
  const conversionRate = clicks ? conversions / clicks : 0;
  const cpa = conversions ? spend / conversions : 0;
  const cpc = clicks ? spend / clicks : 0;
  const roas = spend ? revenue / spend : 0;
  const lastCpa = lastConversions ? lastSpend / lastConversions : 0;
  const lastRoas = lastSpend ? lastRevenue / lastSpend : 0;
  return {
    spend,
    impressions,
    clicks,
    conversions,
    revenue,
    ctr,
    conversionRate,
    cpa,
    cpc,
    roas,
    spendChange: change(spend, lastSpend),
    clickChange: change(clicks, lastClicks),
    conversionChange: change(conversions, lastConversions),
    revenueChange: change(revenue, lastRevenue),
    cpaChange: change(cpa, lastCpa),
    roasChange: change(roas, lastRoas),
  };
}

function buildChannelRows(rows, metrics) {
  return rows
    .map((row) => ({
      ...row,
      roas: row.spend ? row.revenue / row.spend : 0,
      cpa: row.conversions ? row.spend / row.conversions : 0,
      cpc: row.clicks ? row.spend / row.clicks : 0,
      ctr: row.impressions ? row.clicks / row.impressions : 0,
      cvr: row.clicks ? row.conversions / row.clicks : 0,
      revenueShare: metrics.revenue ? row.revenue / metrics.revenue : 0,
    }))
    .sort((a, b) => b.roas - a.roas);
}

function buildScore(metrics) {
  return Math.max(38, Math.min(96, Math.round(70 + metrics.roasChange * 22 + metrics.conversionChange * 26 + metrics.revenueChange * 24 - metrics.cpaChange * 18)));
}

function scoreLabel(score) {
  if (uiState.lang === "en") {
    if (score >= 86) return "Strong Growth";
    if (score >= 72) return "Stable Growth";
    if (score >= 58) return "Needs Optimization";
    return "Priority Fix";
  }
  if (score >= 86) return "強勢成長";
  if (score >= 72) return "穩定成長";
  if (score >= 58) return "需要優化";
  return "優先處理";
}

function buildSummary(metrics, money) {
  if (uiState.lang === "en") {
    return [
      { label: metrics.conversionChange >= 0 ? "Conversions Improved" : "Conversions Declined", value: formatTrend(metrics.conversionChange), body: `${numberFormatter.format(metrics.conversions)} conversions this month.`, className: trendClass(metrics.conversionChange) },
      { label: metrics.revenueChange >= 0 ? "Revenue Momentum Up" : "Revenue Momentum Down", value: formatTrend(metrics.revenueChange), body: `Estimated revenue ${money.format(metrics.revenue)}.`, className: trendClass(metrics.revenueChange) },
      { label: metrics.cpaChange <= 0 ? "Acquisition Cost Improved" : "Acquisition Cost Increased", value: formatTrend(metrics.cpaChange), body: `Average CPA ${money.format(metrics.cpa)}.`, className: trendClass(metrics.cpaChange, true) },
      { label: metrics.roasChange >= 0 ? "ROAS Improved" : "ROAS Declined", value: formatTrend(metrics.roasChange), body: `This month ROAS ${metrics.roas.toFixed(2)}.`, className: trendClass(metrics.roasChange) },
    ];
  }
  return [
    { label: metrics.conversionChange >= 0 ? "轉換量優於上月" : "轉換量低於上月", value: formatTrend(metrics.conversionChange), body: `本月共帶來 ${numberFormatter.format(metrics.conversions)} 筆轉換。`, className: trendClass(metrics.conversionChange) },
    { label: metrics.revenueChange >= 0 ? "營收動能增加" : "營收動能下滑", value: formatTrend(metrics.revenueChange), body: `估計營收 ${money.format(metrics.revenue)}。`, className: trendClass(metrics.revenueChange) },
    { label: metrics.cpaChange <= 0 ? "獲客成本改善" : "獲客成本上升", value: formatTrend(metrics.cpaChange), body: `平均 CPA ${money.format(metrics.cpa)}。`, className: trendClass(metrics.cpaChange, true) },
    { label: metrics.roasChange >= 0 ? "投資回報提升" : "投資回報下降", value: formatTrend(metrics.roasChange), body: `本月 ROAS ${metrics.roas.toFixed(2)}。`, className: trendClass(metrics.roasChange) },
  ];
}

function buildInsight(metrics, channels) {
  const best = channels[0];
  const weak = channels[channels.length - 1];
  const highSpendWeak = [...channels].sort((a, b) => b.spend - a.spend).find((row) => row.roas < metrics.roas) || weak;
  if (uiState.lang === "en") {
    const opening = {
      executive: "This month should be read through revenue, conversion volume, and acquisition cost.",
      consultative: "From a consulting perspective, the key question is whether budget is flowing into the most efficient channels.",
      direct: "Next month should focus on budget reallocation and reducing low-efficiency spend.",
    }[fields.tone.value];
    const efficiency = metrics.cpaChange <= 0 ? "CPA decreased versus last month, suggesting stronger traffic quality or better media allocation." : "CPA increased versus last month, so creative fatigue, audience competition, and landing-page friction should be checked.";
    const growth = metrics.revenueChange >= 0 ? "Revenue and conversions grew together, which supports controlled scaling." : "With revenue declining, high-value audiences, retargeting, and conversion tracking should be reviewed first.";
    return `${opening} Overall ROAS is ${metrics.roas.toFixed(2)}. ${efficiency} ${growth} ${best.channel} is the strongest candidate for expansion, while ${highSpendWeak.channel} needs review on budget share, creative message, and conversion quality.`;
  }
  const tone = {
    executive: "本月重點可從營收、轉換量與獲客成本三個面向判讀。",
    consultative: "從顧問角度來看，本月最重要的是確認預算是否流向高效率渠道。",
    direct: "下月應優先調整預算配置，避免低效率渠道拖累整體回報。",
  }[fields.tone.value];
  const efficiency = metrics.cpaChange <= 0 ? "CPA 較上月下降，代表流量品質或投放配置改善。" : "CPA 較上月上升，需檢查素材疲乏、受眾競價與落地頁阻力。";
  const growth = metrics.revenueChange >= 0 ? "營收與轉換同步成長，具備小幅擴量基礎。" : "營收下滑時，應優先檢查高價值受眾、再行銷漏斗與轉換追蹤。";
  return `${tone} 目前整體 ROAS 為 ${metrics.roas.toFixed(2)}，${efficiency} ${growth} 渠道方面，${best.channel} 是最值得保留並測試擴量的來源；${highSpendWeak.channel} 則需要重新檢查預算占比、素材訊息與轉換品質。`;
}

function buildRisks(metrics, rows) {
  if (uiState.lang === "en") {
    const risks = [];
    if (metrics.cpaChange > 0.1) risks.push("CPA increased by more than 10% versus last month. Review low-converting channels and creative fatigue.");
    if (metrics.roas < 2.5) risks.push("Overall ROAS is below 2.5. Avoid aggressive scaling in the short term.");
    if (metrics.conversionRate < 0.02) risks.push("Click-to-conversion rate is low. Landing page, form friction, or offer clarity may be causing leakage.");
    if (rows.some((row) => row.spend > 0 && row.conversions === 0)) risks.push("Some channels spent budget without conversions. Add stop-loss thresholds.");
    if (!risks.length) risks.push("No major risk signal detected. Consider controlled scaling and creative testing next month.");
    return risks;
  }
  const risks = [];
  if (metrics.cpaChange > 0.1) risks.push("CPA 較上月上升超過 10%，需要檢查低轉換渠道與素材疲乏。");
  if (metrics.roas < 2.5) risks.push("整體 ROAS 低於 2.5，短期不建議大幅擴量。");
  if (metrics.conversionRate < 0.02) risks.push("點擊到轉換率偏低，可能是落地頁、表單或優惠訊息造成流失。");
  if (rows.some((row) => row.spend > 0 && row.conversions === 0)) risks.push("部分渠道有花費但沒有轉換，建議設定停損門檻。");
  if (!risks.length) risks.push("目前沒有明顯高風險訊號，下月可採小幅擴量與素材測試。");
  return risks;
}

function buildRecommendations(metrics, channels) {
  const best = channels[0];
  const weak = channels[channels.length - 1];
  if (uiState.lang === "en") {
    const items = [
      `Move 10-20% of budget from ${weak.channel} to ${best.channel}, then monitor CPA and conversion volume for 7 days.`,
      `Add 2-3 new creative or keyword variants for ${best.channel} while preserving the current winning message.`,
      "Build a high-intent retargeting audience and track bookings, inquiries, or purchases as separate events.",
    ];
    items.push(metrics.cpaChange > 0.08 ? "Pause ad groups with CPA 30% above average and audit search terms, placements, audiences, and landing-page speed." : "Efficiency is acceptable. Next month can use controlled scaling with weekly budget increases below 15%.");
    return items;
  }
  const items = [
    `將 10-20% 預算從 ${weak.channel} 移至 ${best.channel}，並用 7 天觀察 CPA 與轉換量變化。`,
    `針對 ${best.channel} 新增 2-3 組素材或關鍵字變體，保留目前有效訊息並測試新角度。`,
    "建立高意圖受眾再行銷名單，將預約、諮詢或購買行為拆成獨立追蹤事件。",
  ];
  items.push(metrics.cpaChange > 0.08 ? "先暫停 CPA 高於平均 30% 的廣告組，集中檢查搜尋字詞、版位、受眾與落地頁速度。" : "目前獲客效率可接受，下月可小幅擴量，單週預算增幅建議控制在 15% 以內。");
  return items;
}

function ensureClientReplyPanel() {
  let panel = document.querySelector("#clientReplyDraft");
  if (panel) return panel;
  const recommendations = document.querySelector("#recommendations");
  if (!recommendations) return null;
  panel = document.createElement("div");
  panel.id = "clientReplyDraft";
  panel.className = "client-reply-draft";
  recommendations.insertAdjacentElement("afterend", panel);
  return panel;
}

function renderClientReplyDraft(text, mode = "rules") {
  const panel = ensureClientReplyPanel();
  if (!panel) return;
  if (!text) {
    panel.hidden = true;
    panel.textContent = "";
    return;
  }
  panel.hidden = false;
  panel.innerHTML = "";
  const eyebrow = document.createElement("span");
  eyebrow.className = "ai-source-pill";
  eyebrow.textContent = mode === "live" ? (uiState.lang === "en" ? "Live AI client reply" : "即時 AI 客戶說明稿") : (uiState.lang === "en" ? "Rule-based client reply" : "規則型客戶說明稿");
  const body = document.createElement("p");
  body.textContent = text;
  panel.append(eyebrow, body);
}

function setAiReportStatus(status, detail = "") {
  let node = document.querySelector("#aiReportStatus");
  const heading = document.querySelector("#recommendations")?.closest(".report-section")?.querySelector(".section-heading");
  if (!node && heading) {
    node = document.createElement("div");
    node.id = "aiReportStatus";
    node.className = "ai-report-status";
    heading.appendChild(node);
  }
  if (!node) return;
  const labels = {
    loading: uiState.lang === "en" ? "AI analyzing..." : "AI 分析中...",
    live: uiState.lang === "en" ? "Live AI recommendations" : "即時 AI 建議",
    fallback: uiState.lang === "en" ? "Rule preview / fallback" : "規則型預覽 / 備援",
  };
  node.className = `ai-report-status ${status}`;
  node.textContent = detail || labels[status] || "";
}

function renderRuleBasedNarrative(metrics, rows, channels) {
  document.querySelector("#insights").textContent = buildInsight(metrics, channels);
  document.querySelector("#riskList").innerHTML = buildRisks(metrics, rows).map((risk) => `<div class="risk-item">${risk}</div>`).join("");
  document.querySelector("#recommendations").innerHTML = buildRecommendations(metrics, channels).map((item) => `<li>${item}</li>`).join("");
  renderClientReplyDraft("", "rules");
  setAiReportStatus("fallback");
}

function buildAiReportPayload(metrics, channels) {
  const workOrder = analyzeClientRequest();
  const best = channels[0] || null;
  const weak = channels[channels.length - 1] || null;
  const channelPayload = channels.map((row) => ({
    channel: row.channel,
    spend: row.spend,
    clicks: row.clicks,
    conversions: row.conversions,
    revenue: row.revenue,
    cpa: row.cpa,
    roas: row.roas,
    conversionRate: row.conversionRate,
    spendShare: row.spendShare,
    revenueShare: row.revenueShare,
  }));
  return {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    request: fields.clientRequest.value,
    kpis: workOrder.kpis,
    dataNeeds: workOrder.dataNeeds,
    tone: fields.tone.value,
    metrics: {
      spend: metrics.spend,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      conversions: metrics.conversions,
      revenue: metrics.revenue,
      cpa: metrics.cpa,
      cpc: metrics.cpc,
      ctr: metrics.ctr,
      conversionRate: metrics.conversionRate,
      roas: metrics.roas,
      spendChange: metrics.spendChange,
      clickChange: metrics.clickChange,
      conversionChange: metrics.conversionChange,
      revenueChange: metrics.revenueChange,
      cpaChange: metrics.cpaChange,
      roasChange: metrics.roasChange,
    },
    bestChannel: best ? channelPayload.find((row) => row.channel === best.channel) : null,
    weakChannel: weak ? channelPayload.find((row) => row.channel === weak.channel) : null,
    channels: channelPayload,
  };
}

function renderAiNarrative(draft) {
  if (!draft || draft.mode !== "live") return false;
  if (draft.summary) document.querySelector("#insights").textContent = draft.summary;
  if (Array.isArray(draft.risks) && draft.risks.length) {
    const riskList = document.querySelector("#riskList");
    riskList.innerHTML = "";
    draft.risks.forEach((risk) => {
      const item = document.createElement("div");
      item.className = "risk-item";
      item.textContent = risk;
      riskList.appendChild(item);
    });
  }
  if (Array.isArray(draft.nextActions) && draft.nextActions.length) {
    const recommendations = document.querySelector("#recommendations");
    recommendations.innerHTML = "";
    draft.nextActions.forEach((action) => {
      const item = document.createElement("li");
      item.textContent = action;
      recommendations.appendChild(item);
    });
  }
  renderClientReplyDraft(draft.clientReplyDraft, "live");
  setAiReportStatus("live");
  return true;
}

async function enrichReportWithAi(metrics, channels) {
  if (!appState.apiOnline) throw new Error("API offline");
  const draft = await apiCreate("report/run", buildAiReportPayload(metrics, channels));
  if (!draft || draft.mode !== "live") throw new Error(draft?.providerError || "AI fallback");
  appState.aiRuns = [...appState.aiRuns, draft];
  renderAiNarrative(draft);
  renderAgentStatus();
  renderLaunchChecklist();
  renderProgressContent();
  return draft;
}

function analyzeClientRequest() {
  const request = fields.clientRequest.value.trim();
  const text = request.toLowerCase();
  const lang = uiState.lang;
  const hasSeo = /seo|search console|organic|關鍵字|自然|排名|搜尋/.test(text);
  const hasSocial = /social|instagram|facebook|threads|社群|貼文|粉絲|互動/.test(text);
  const hasAds = /ads|google|meta|cpa|roas|廣告|投放|預約|轉換/.test(text) || (!hasSeo && !hasSocial);
  const wantsCost = /cpa|cost|成本|降低|太貴|浪費/.test(text);
  const wantsRevenue = /roas|revenue|營收|銷售|回收|回報/.test(text);
  const wantsLeads = /lead|booking|預約|名單|詢問|表單|諮詢/.test(text);

  const reportType = hasSeo ? "seo" : hasSocial ? "social" : hasAds ? "ads" : "mixed";
  const tone = wantsCost || wantsRevenue ? "direct" : "consultative";
  const businessType = fields.businessType.value;
  const automationLevel = fields.automationLevel.value;
  const scheduleCadence = fields.scheduleCadence.value;
  const deliveryEmail = fields.deliveryEmail.value.trim();
  const hasDataSource = Boolean(fields.sheetUrl.value.trim() || fields.csvInput.value.trim());
  const kpis = [
    wantsCost ? "CPA" : null,
    wantsRevenue ? "ROAS" : null,
    wantsLeads ? (lang === "en" ? "Conversions / Leads" : "轉換 / 名單") : null,
    hasSeo ? (lang === "en" ? "Organic clicks" : "自然點擊") : null,
    hasSocial ? (lang === "en" ? "Engagement rate" : "互動率") : null,
  ].filter(Boolean);
  if (!kpis.length) kpis.push("CPA", "ROAS", lang === "en" ? "Conversions" : "轉換");

  const goal = request || (lang === "en" ? "Generate a monthly client report and identify budget opportunities." : "產生客戶月報並找出預算優化機會。");
  const dataNeeds = [
    "channel, spend, impressions, clicks, conversions, revenue",
    "last_spend, last_clicks, last_conversions, last_revenue",
    hasSeo ? "Search Console / ranking data" : null,
    hasSocial ? "Post reach, engagement, followers" : null,
  ].filter(Boolean);
  const actions = [
    lang === "en" ? "Select the closest sample report and apply the matching tone." : "選擇最接近的範例報告並套用合適語氣。",
    lang === "en" ? "Generate executive summary, KPI cards, risks, and next actions." : "產生高層摘要、KPI、風險提醒與下月行動。",
    lang === "en" ? "Highlight the strongest and weakest channel for budget decisions." : "標出最強與最弱渠道，支援預算決策。",
    automationLevel === "auto"
      ? (lang === "en" ? "Prepare an auto-delivery draft with PM approval safeguards." : "準備自動交付草稿，並保留 PM 審核保護。")
      : (lang === "en" ? "Keep this case in assisted mode until integrations are complete." : "整合完成前先維持 AI 輔助模式。"),
  ];
  const reply = lang === "en"
    ? `Got it. I will focus this report on ${kpis.join(", ")} and compare channel efficiency, budget waste, and next-month actions. Please provide a CSV or Google Sheets link with the required fields.`
    : `收到。我會把這份報告聚焦在 ${kpis.join("、")}，比較各渠道效率、預算浪費與下月行動。請提供含必要欄位的 CSV 或 Google Sheets 連結。`;

  const missing = [
    hasDataSource ? null : (lang === "en" ? "Connect a Google Sheets CSV URL or upload/paste CSV data." : "串接 Google Sheets CSV URL，或上傳/貼上 CSV 資料。"),
    deliveryEmail ? null : (lang === "en" ? "Add a delivery email for client notifications." : "填寫交付 Email，才能自動通知客戶。"),
    automationLevel === "auto" && scheduleCadence === "manual" ? (lang === "en" ? "Choose a weekly or monthly schedule for recurring automation." : "選擇每週或每月排程，才能定期自動產出。") : null,
  ].filter(Boolean);
  const readiness = Math.min(100,
    30 +
    (hasDataSource ? 25 : 0) +
    (deliveryEmail ? 15 : 0) +
    (scheduleCadence !== "manual" ? 15 : 0) +
    (automationLevel === "auto" ? 15 : automationLevel === "draft" ? 8 : 0)
  );

  return { reportType, tone, businessType, automationLevel, scheduleCadence, deliveryEmail, hasDataSource, missing, readiness, kpis, goal, dataNeeds, actions, reply };
}

function renderWorkOrder(workOrder) {
  const blocks = [
    [t("workGoal"), workOrder.goal],
    [t("workKpis"), workOrder.kpis.join(", ")],
    [t("workData"), workOrder.dataNeeds.join(" / ")],
    [t("workActions"), workOrder.actions.join(" ")],
    [t("workReply"), workOrder.reply],
  ];
  document.querySelector("#aiWorkOrder").innerHTML = blocks
    .map(([title, body]) => `<div class="workorder-card"><span>${title}</span><p>${body}</p></div>`)
    .join("");
  document.querySelector("#autopilotOutput").className = "ai-output ok";
  document.querySelector("#autopilotOutput").innerHTML = `<strong>${t("autopilotDone")}</strong><span>${workOrder.kpis.join(" / ")}</span>`;
}

function renderAutomationPlan(workOrder) {
  const scheduleText = fields.scheduleCadence.options[fields.scheduleCadence.selectedIndex]?.textContent || t("scheduleManual");
  const reviewText = fields.automationLevel.options[fields.automationLevel.selectedIndex]?.textContent || "";
  const statusItems = [
    [t("readinessData"), workOrder.hasDataSource ? t("ready") : t("needsSetup")],
    [t("readinessAi"), workOrder.kpis.join(" / ")],
    [t("readinessDelivery"), workOrder.deliveryEmail || t("needsSetup")],
    [t("readinessReview"), `${reviewText} · ${scheduleText}`],
  ];
  const missingList = workOrder.missing.length
    ? workOrder.missing.map((item) => `<li>${item}</li>`).join("")
    : `<li>${uiState.lang === "en" ? "Ready for backend AI, scheduler, and email integration." : "可進入後端 AI、排程與 Email 整合。"}</li>`;

  document.querySelector("#automationPlan").innerHTML = `
    <div class="readiness-card">
      <span>${t("readinessScore")}</span>
      <strong>${workOrder.readiness}%</strong>
      <div class="readiness-bar"><i style="width:${workOrder.readiness}%"></i></div>
    </div>
    ${statusItems.map(([title, body]) => `<div class="automation-step"><span>${title}</span><strong>${body}</strong></div>`).join("")}
    <div class="automation-step wide"><span>${uiState.lang === "en" ? "Next Setup Tasks" : "下一步設定"}</span><ul>${missingList}</ul></div>
  `;
}

function renderLaunchChecklist() {
  const hasRequest = Boolean(fields.clientRequest.value.trim());
  const hasData = Boolean(fields.csvInput.value.trim() || fields.sheetUrl.value.trim());
  const hasAutomation = fields.automationLevel.value !== "assist" && fields.scheduleCadence.value !== "manual";
  const hasDelivery = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.deliveryEmail.value.trim());
  const hasReport = Boolean(appState.lastGeneratedAt && appState.metrics);
  const hasExport = Boolean(appState.lastExportedAt);
  const hasSavedSource = appState.dataSources.length > 0;
  const hasIntake = appState.intakes.length > 0;
  const hasConsent = appState.consents.length > 0;
  const hasShareLink = appState.shareLinks.length > 0;
  const hasEmailJob = appState.emailJobs.length > 0;
  const hasBilling = Boolean(appState.checkout || appState.invoices.length > 0);
  const hasPortalInvite = appState.portalInvites.length > 0;
  const hasPortalSubmission = appState.portalSubmissions.length > 0;
  const items = [
    [t("launchNeed"), hasRequest],
    [t("portalInviteReady"), hasPortalInvite],
    [t("portalSubmissionReady"), hasPortalSubmission],
    [t("intakeReady"), hasIntake],
    [t("consentReady"), hasConsent],
    [t("launchData"), hasData],
    [t("sourceReady"), hasSavedSource],
    [t("launchAutomation"), hasAutomation],
    [t("launchDelivery"), hasDelivery],
    [t("launchReport"), hasReport],
    [t("launchExport"), hasExport],
    [t("launchBackend"), appState.apiOnline],
    [t("backendAiRun"), appState.aiRuns.length > 0],
    [t("scheduleSaved"), appState.schedules.length > 0],
    [t("shareLinkReady"), hasShareLink],
    [t("emailQueueReady"), hasEmailJob],
    [t("paymentSetup"), hasBilling],
    [t("invoiceReady"), appState.invoices.length > 0],
    [t("deliveryRecord"), appState.deliveries.length > 0],
  ];
  const score = Math.round((items.filter(([, done]) => done).length / items.length) * 100);
  document.querySelector("#launchScore").textContent = `${score}%`;
  document.querySelector("#launchChecklist").innerHTML = items
    .map(([label, done]) => `<div class="${done ? "done" : ""}"><i>${done ? "OK" : "!"}</i><span>${label}</span><strong>${done ? t("launchReady") : t("launchMissing")}</strong></div>`)
    .join("");
  renderSetupWizard();
  renderIntegrationHealth();
  renderHomeDashboard();
  return score;
}

function wizardText() {
  return uiState.lang === "en" ? {
    title: "Setup Wizard",
    copy: "Follow one guided path to finish the first billable client workspace.",
    action: "Run Next Step",
    done: "Done",
    complete: "Setup complete",
    completeCopy: "This workspace has a demo, client portal, AI draft, schedule, and delivery record.",
    demoTitle: "Prepare the first demo case",
    demoBody: "Load sample data, client needs, delivery email, and monthly report settings.",
    clientTitle: "Create the client profile",
    clientBody: "Save the current case as a trackable client for billing and delivery.",
    portalTitle: "Create the client intake portal",
    portalBody: "Generate a client-facing link for requirements and data-source collection.",
    aiTitle: "Generate the AI report draft",
    aiBody: "Create goals, KPI focus, data requirements, and client reply draft.",
    scheduleTitle: "Turn on automation schedule",
    scheduleBody: "Create the recurring weekly or monthly report draft schedule.",
    deliveryTitle: "Create the delivery package",
    deliveryBody: "Mark review, create share link, queue email, and save delivery history.",
    copyPack: "Copy Pack",
    downloadPack: "Download Pack",
    packReady: "Onboarding pack ready",
  } : {
    title: "上線設定精靈",
    copy: "照著一條路徑完成第一個可收費客戶工作區。",
    action: "執行下一步",
    done: "完成",
    complete: "設定已完成",
    completeCopy: "此工作區已具備 Demo、客戶入口、AI 草稿、排程與交付紀錄。",
    demoTitle: "準備第一個 Demo 案件",
    demoBody: "自動載入範例資料、客戶需求、交付 Email 與月報設定。",
    clientTitle: "建立客戶檔案",
    clientBody: "把目前案例保存為可追蹤、可計費、可交付的客戶。",
    portalTitle: "建立客戶需求入口",
    portalBody: "產生客戶可自行填需求與資料來源的入口連結。",
    aiTitle: "產生 AI 報告草稿",
    aiBody: "建立目標、KPI、資料需求與客戶回覆草稿。",
    scheduleTitle: "啟用自動排程",
    scheduleBody: "建立每週或每月自動產生報告草稿的排程。",
    deliveryTitle: "建立交付包",
    deliveryBody: "完成審核、分享連結、Email 佇列與交付紀錄。",
  };
}

function setupWizardSteps() {
  const text = wizardText();
  const hasDemo = Boolean(fields.clientRequest.value.trim() && (fields.csvInput.value.trim() || fields.sheetUrl.value.trim()) && appState.metrics);
  const hasClient = appState.clients.length > 0;
  const hasPortal = appState.portalInvites.length > 0;
  const hasAi = appState.aiRuns.length > 0;
  const hasSchedule = appState.schedules.length > 0 || fields.scheduleCadence.value !== "manual";
  const hasDelivery = appState.deliveries.length > 0 && appState.shareLinks.length > 0;
  return [
    { id: "demo", done: hasDemo, title: text.demoTitle, body: text.demoBody },
    { id: "client", done: hasClient, title: text.clientTitle, body: text.clientBody },
    { id: "portal", done: hasPortal, title: text.portalTitle, body: text.portalBody },
    { id: "ai", done: hasAi, title: text.aiTitle, body: text.aiBody },
    { id: "schedule", done: hasSchedule, title: text.scheduleTitle, body: text.scheduleBody },
    { id: "delivery", done: hasDelivery, title: text.deliveryTitle, body: text.deliveryBody },
  ];
}

function renderSetupWizard() {
  const container = document.querySelector("#setupWizard");
  if (!container) return;
  const text = wizardText();
  const steps = setupWizardSteps();
  const next = steps.find((step) => !step.done);
  container.innerHTML = `
    <header>
      <div>
        <h3>${text.title}</h3>
        <p>${next ? next.body : text.completeCopy}</p>
      </div>
      <strong>${steps.filter((step) => step.done).length}/${steps.length}</strong>
    </header>
    <div class="wizard-steps">
      ${steps.map((step, index) => `
        <div class="wizard-step ${step.done ? "done" : ""} ${next?.id === step.id ? "active" : ""}">
          <i>${step.done ? "OK" : index + 1}</i>
          <div><strong>${step.title}</strong><span>${step.done ? text.done : step.body}</span></div>
        </div>
      `).join("")}
    </div>
    <div class="wizard-actions">
      <span>${next ? next.title : text.complete}</span>
      <button class="ghost" id="copyOnboardingPackBtn" type="button">${text.copyPack || (uiState.lang === "en" ? "Copy Pack" : "複製交接包")}</button>
      <button class="ghost" id="downloadOnboardingPackBtn" type="button">${text.downloadPack || (uiState.lang === "en" ? "Download Pack" : "下載交接包")}</button>
      <button class="primary" id="setupWizardActionBtn" type="button" data-next-step="${next?.id || "complete"}" ${next ? "" : "disabled"}>${next ? text.action : text.done}</button>
    </div>
  `;
}

function markdownList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

function latestItem(items) {
  return Array.isArray(items) && items.length ? items[items.length - 1] : null;
}

function safeFileName(value, fallback = "client") {
  return String(value || fallback).trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 80) || fallback;
}

function buildOnboardingPack() {
  const lang = uiState.lang;
  const workOrder = analyzeClientRequest();
  const metrics = appState.metrics;
  const latestPortal = latestItem(appState.portalInvites);
  const latestShare = latestItem(appState.shareLinks);
  const latestInvoice = latestItem(appState.invoices);
  const latestAi = latestItem(appState.aiRuns);
  const latestSchedule = latestItem(appState.schedules);
  const money = appState.money || moneyFormatter();
  const title = lang === "en" ? "AgencyReport AI Onboarding Pack" : "AgencyReport AI 客戶交接包";
  const portalUrl = latestPortal?.url || latestPortal?.portalUrl || "-";
  const shareUrl = latestShare?.url || latestShare?.shareUrl || "-";
  const invoiceText = latestInvoice ? `${latestInvoice.invoiceNumber || latestInvoice.id} / ${formatInvoiceAmount(latestInvoice)} / ${latestInvoice.status || "draft"} / ${latestInvoice.invoiceUrl || "-"}` : "-";
  const quoteText = appState.checkout?.quoteUrl || appState.checkout?.checkoutUrl || "-";
  const sections = [
    `# ${title}`,
    "",
    `## ${lang === "en" ? "Case" : "案件"}`,
    markdownList([
      `${lang === "en" ? "Agency" : "代理商"}: ${fields.agencyName.value || "-"}`,
      `${lang === "en" ? "Client" : "客戶"}: ${fields.clientName.value || "-"}`,
      `${lang === "en" ? "Month" : "月份"}: ${fields.reportMonth.value || "-"}`,
      `${lang === "en" ? "Report type" : "報告類型"}: ${reportTypeLabel(fields.reportType.value)}`,
      `${lang === "en" ? "Delivery email" : "交付 Email"}: ${fields.deliveryEmail.value || "-"}`,
    ]),
    "",
    `## ${lang === "en" ? "Client Goal" : "客戶目標"}`,
    fields.clientRequest.value.trim() || "-",
    "",
    `## ${lang === "en" ? "KPI Focus" : "KPI 焦點"}`,
    markdownList(workOrder.kpis || []),
    "",
    `## ${lang === "en" ? "Performance Snapshot" : "成效快照"}`,
    metrics ? markdownList([
      `${t("spend")}: ${money.format(metrics.spend)}`,
      `ROAS: ${metrics.roas.toFixed(2)}`,
      `CPA: ${money.format(metrics.cpa)}`,
      `${t("conversions")}: ${numberFormatter.format(metrics.conversions)}`,
    ]) : "-",
    "",
    `## ${lang === "en" ? "Automation Setup" : "自動化設定"}`,
    markdownList([
      `${lang === "en" ? "Automation level" : "自動化程度"}: ${fields.automationLevel.value}`,
      `${lang === "en" ? "Schedule" : "排程"}: ${latestSchedule?.cadence || fields.scheduleCadence.value}`,
      `${lang === "en" ? "AI draft" : "AI 草稿"}: ${latestAi ? (latestAi.status || latestAi.id) : "-"}`,
      `${lang === "en" ? "Data source" : "資料來源"}: ${fields.sheetUrl.value || (fields.csvInput.value.trim() ? "CSV" : "-")}`,
    ]),
    "",
    `## ${lang === "en" ? "Client Links" : "客戶連結"}`,
    markdownList([
      `${lang === "en" ? "Intake portal" : "需求入口"}: ${portalUrl}`,
      `${lang === "en" ? "Report share link" : "報告分享連結"}: ${shareUrl}`,
      `${lang === "en" ? "Quote link" : "報價連結"}: ${quoteText}`,
      `${lang === "en" ? "Invoice" : "發票"}: ${invoiceText}`,
    ]),
    "",
    `## ${lang === "en" ? "Next Actions" : "下一步"}`,
    markdownList(workOrder.actions || []),
    "",
    `## ${lang === "en" ? "Internal Handoff" : "內部交接"}`,
    markdownList(setupWizardSteps().map((step) => `${step.done ? "[x]" : "[ ]"} ${step.title}`)),
    "",
    `_${lang === "en" ? "Generated at" : "產生時間"}: ${new Date().toISOString()}_`,
  ];
  return sections.join("\n");
}

async function copyOnboardingPack() {
  const text = buildOnboardingPack();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  document.querySelector("#setupWizardStatus").className = "status-panel compact-status ok";
  document.querySelector("#setupWizardStatus").innerHTML = `<strong>${wizardText().packReady || (uiState.lang === "en" ? "Onboarding pack ready" : "交接包已建立")}</strong><span>${uiState.lang === "en" ? "Copied to clipboard." : "已複製到剪貼簿。"}</span>`;
}

function downloadOnboardingPack() {
  const text = buildOnboardingPack();
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeFileName(fields.clientName.value)}-onboarding-pack.md`;
  link.click();
  URL.revokeObjectURL(link.href);
  document.querySelector("#setupWizardStatus").className = "status-panel compact-status ok";
  document.querySelector("#setupWizardStatus").innerHTML = `<strong>${wizardText().packReady || (uiState.lang === "en" ? "Onboarding pack ready" : "交接包已建立")}</strong><span>${link.download}</span>`;
}

function renderIntegrationHealth() {
  const checks = [
    [t("healthApi"), appState.apiOnline],
    [t("healthData"), appState.dataSources.length > 0 || Boolean(fields.csvInput.value.trim() || fields.sheetUrl.value.trim())],
    [t("portalInviteReady"), appState.portalInvites.length > 0],
    [t("portalSubmissionReady"), appState.portalSubmissions.length > 0],
    [t("healthConsent"), appState.consents.length > 0],
    [t("healthAi"), appState.aiRuns.length > 0],
    [t("healthSchedule"), appState.schedules.length > 0 || fields.scheduleCadence.value !== "manual"],
    [t("healthDelivery"), appState.deliveries.length > 0 || appState.shareLinks.length > 0 || appState.emailJobs.length > 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.deliveryEmail.value.trim())],
    [t("healthPayment"), Boolean(appState.checkout || appState.invoices.length > 0)],
  ];
  const score = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);
  document.querySelector("#integrationScore").textContent = `${score}%`;
  document.querySelector("#integrationList").innerHTML = checks.map(([label, ok]) => `
    <div class="${ok ? "ok" : ""}">
      <i>${ok ? "OK" : "!"}</i>
      <span>${label}</span>
      <strong>${ok ? t("healthOk") : t("healthWarn")}</strong>
    </div>
  `).join("");
}

function renderProgressContent() {
  const launchText = document.querySelector("#launchScore")?.textContent || "0%";
  const launchScore = Number(launchText.replace("%", "")) || 0;
  const workOrder = analyzeClientRequest();
  const cards = [
    { title: t("progressMvp"), score: 92, status: t("progressDone"), body: t("progressMvpBody") },
    { title: t("progressRevenue"), score: Math.max(58, launchScore), status: launchScore >= 80 ? t("progressTesting") : t("launchMissing"), body: t("progressRevenueBody") },
    { title: t("progressAutomation"), score: Math.min(72, Math.max(42, workOrder.readiness - 18)), status: t("progressNeeded"), body: t("progressAutomationBody") },
    { title: t("progressDeploy"), score: 64, status: t("progressNeeded"), body: t("progressDeployBody") },
  ];
  document.querySelector("#progressGrid").innerHTML = cards.map((card) => `
    <div class="progress-card">
      <div class="progress-head"><span>${card.status}</span><strong>${card.score}%</strong></div>
      <h4>${card.title}</h4>
      <div class="progress-bar"><i style="width:${card.score}%"></i></div>
      <p>${card.body}</p>
    </div>
  `).join("");
  renderCompletionChecklist();
}

function renderCompletionChecklist() {
  const evidence = uiState.lang === "en"
    ? ["Sidebar input + presets", "Autopilot rules + template switch", "5 AI work-order cards", "UI polish + README roadmap", "Local browser QA passed"]
    : ["側欄輸入區 + 快速需求", "Autopilot 規則 + 樣板切換", "5 張 AI 工作單", "UI 美化 + README 路線", "本機瀏覽器驗證通過"];
  const items = [
    [t("completeAutopilotInput"), t("completeAutopilotInputBody"), evidence[0]],
    [t("completeParsing"), t("completeParsingBody"), evidence[1]],
    [t("completeWorkOrder"), t("completeWorkOrderBody"), evidence[2]],
    [t("completePolish"), t("completePolishBody"), evidence[3]],
    [t("completeQa"), t("completeQaBody"), evidence[4]],
  ];
  document.querySelector("#completionList").innerHTML = items.map(([title, body, proof], index) => `
    <article class="completion-item done">
      <i>OK</i>
      <div>
        <span>${String(index + 1).padStart(2, "0")}</span>
        <h4>${title}</h4>
        <p>${body}</p>
        <strong>${t("completionEvidence")}: ${proof}</strong>
      </div>
    </article>
  `).join("");
}

function refreshAiAutomation() {
  const workOrder = analyzeClientRequest();
  renderWorkOrder(workOrder);
  renderAutomationPlan(workOrder);
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
}

function runAutopilot() {
  const button = document.querySelector("#runAutopilotBtn");
  setButtonState(button, "loading", "runAutopilot");
  const workOrder = analyzeClientRequest();
  fields.reportType.value = workOrder.reportType;
  fields.tone.value = workOrder.tone;
  fields.sampleSelect.value = workOrder.reportType === "mixed" ? "ads" : workOrder.reportType;
  fields.csvInput.value = samples[fields.sampleSelect.value] || samples.ads;
  generateReport();
  renderWorkOrder(workOrder);
  renderAutomationPlan(workOrder);
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "runAutopilot");
}

function completeDemoSetup() {
  const button = document.querySelector("#completeDemoBtn");
  setButtonState(button, "loading", "completeDemoSetup");
  fields.sampleSelect.value = "ads";
  resetForm("ads");
  fields.clientRequest.value = uiState.lang === "en"
    ? "We need a client-ready monthly report that compares Google Ads and Meta Ads, reduces CPA, and recommends next month budget actions."
    : "我們需要一份可直接交付客戶的月報，比較 Google Ads 與 Meta Ads，降低 CPA，並提出下月預算建議。";
  fields.businessType.value = "local";
  fields.automationLevel.value = "auto";
  fields.scheduleCadence.value = "monthly";
  fields.deliveryEmail.value = uiState.lang === "en" ? "client@example.com" : "client@example.com";
  fields.tone.value = "direct";
  runAutopilot();
  appState.lastExportedAt = new Date();
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(button, "success", "completeDemoSetup");
}

function ensureWizardBasics() {
  if (!fields.clientRequest.value.trim() || !fields.csvInput.value.trim() || !appState.metrics) {
    completeDemoSetup();
  }
  if (!fields.deliveryEmail.value.trim()) fields.deliveryEmail.value = "client@example.com";
  if (fields.scheduleCadence.value === "manual") fields.scheduleCadence.value = "monthly";
  refreshAiAutomation();
  renderIntakeStatus();
}

async function runSetupWizardStep() {
  const button = document.querySelector("#setupWizardActionBtn");
  if (!button || button.dataset.nextStep === "complete") return;
  const baseLabel = button.textContent;
  button.classList.add("is-loading");
  button.disabled = true;
  button.textContent = t("loading");
  document.querySelector("#setupWizardStatus").className = "status-panel compact-status";
  document.querySelector("#setupWizardStatus").innerHTML = "";
  try {
    const step = button.dataset.nextStep;
    if (step === "demo") {
      completeDemoSetup();
    } else if (step === "client") {
      ensureWizardBasics();
      await saveClient();
    } else if (step === "portal") {
      ensureWizardBasics();
      if (!appState.clients.length) await saveClient();
      await createPortalInvite();
    } else if (step === "ai") {
      ensureWizardBasics();
      await createBackendAiDraft(button, "runBackendAi");
    } else if (step === "schedule") {
      ensureWizardBasics();
      await createSchedule();
    } else if (step === "delivery") {
      ensureWizardBasics();
      if (!appState.metrics) generateReport();
      if (!appState.lastReviewedAt) approveDraft();
      if (!appState.shareLinks.length) await createShareLink();
      if (!appState.emailJobs.length) await queueEmailDelivery();
      await deliverReport();
    }
    renderSetupWizard();
    document.querySelector("#setupWizardStatus").className = "status-panel compact-status ok";
    document.querySelector("#setupWizardStatus").innerHTML = `<strong>${wizardText().done}</strong><span>${setupWizardSteps().find((item) => !item.done)?.title || wizardText().complete}</span>`;
  } catch (error) {
    document.querySelector("#setupWizardStatus").className = "status-panel compact-status error";
    document.querySelector("#setupWizardStatus").innerHTML = `<strong>${uiState.lang === "en" ? "Step failed" : "步驟失敗"}</strong><span>${error.message || "-"}</span>`;
  } finally {
    button.classList.remove("is-loading");
    button.disabled = false;
    button.textContent = baseLabel;
    renderLaunchChecklist();
  }
}

function applyPromptPreset(type) {
  const presets = {
    zh: {
      cpa: "我們是牙醫診所，想知道 Google Ads 和 Meta Ads 哪個帶來更多預約，並降低 CPA。",
      roas: "我們是電商品牌，想提升 ROAS，找出哪些渠道值得加預算，哪些渠道正在浪費。",
      seo: "我們的 SEO 排名和自然流量下滑，想知道哪些頁面需要優先優化，並產出下月行動建議。",
    },
    en: {
      cpa: "We are a dental clinic. Compare Google Ads and Meta Ads bookings, reduce CPA, and recommend next month budget actions.",
      roas: "We are an e-commerce brand. Improve ROAS, identify channels worth scaling, and find wasted spend.",
      seo: "Our SEO rankings and organic traffic declined. Identify priority pages to optimize and generate next-month actions.",
    },
  };
  fields.clientRequest.value = presets[uiState.lang][type];
  if (type === "seo") fields.businessType.value = "content";
  if (type === "roas") fields.businessType.value = "ecommerce";
  if (type === "cpa") fields.businessType.value = "local";
  runAutopilot();
}

function buildDiagnostics(metrics, channels, money) {
  const highestRevenue = [...channels].sort((a, b) => b.revenue - a.revenue)[0];
  const highestSpend = [...channels].sort((a, b) => b.spend - a.spend)[0];
  const bestEfficiency = [...channels].sort((a, b) => a.cpa - b.cpa)[0];
  const weakEfficiency = [...channels].sort((a, b) => b.cpa - a.cpa)[0];
  if (uiState.lang === "en") {
    return [
      { label: "Top Revenue Source", value: highestRevenue.channel, body: `${money.format(highestRevenue.revenue)}, ${percentFormatter.format(highestRevenue.revenueShare)} of total revenue.` },
      { label: "Largest Budget Source", value: highestSpend.channel, body: `${money.format(highestSpend.spend)}. Confirm whether spend matches conversion value.` },
      { label: "Lowest CPA", value: bestEfficiency.channel, body: `${money.format(bestEfficiency.cpa)} per conversion. Good candidate for scaling tests.` },
      { label: "Highest CPA", value: weakEfficiency.channel, body: `${money.format(weakEfficiency.cpa)} per conversion. Needs stop-loss or creative refresh.` },
      { label: "Funnel Efficiency", value: percentFormatter.format(metrics.conversionRate), body: "Overall click-to-conversion rate. Below 2% usually means landing-page review." },
      { label: "Average CPC", value: money.format(metrics.cpc), body: "If CPC rises while CVR stays flat, auction or audience cost is likely increasing." },
    ];
  }
  return [
    { label: "最大營收來源", value: highestRevenue.channel, body: `${money.format(highestRevenue.revenue)}，占本月營收 ${percentFormatter.format(highestRevenue.revenueShare)}。` },
    { label: "最大預算來源", value: highestSpend.channel, body: `${money.format(highestSpend.spend)}，確認是否與轉換價值匹配。` },
    { label: "最低 CPA", value: bestEfficiency.channel, body: `${money.format(bestEfficiency.cpa)} / 轉換，適合優先擴量測試。` },
    { label: "最高 CPA", value: weakEfficiency.channel, body: `${money.format(weakEfficiency.cpa)} / 轉換，需要設定停損或重整素材。` },
    { label: "漏斗效率", value: percentFormatter.format(metrics.conversionRate), body: "從點擊到轉換的整體 CVR，低於 2% 時應檢查落地頁。" },
    { label: "平均點擊成本", value: money.format(metrics.cpc), body: "若 CPC 上升但 CVR 不變，通常代表競價或受眾成本提高。" },
  ];
}

function renderCards(selector, cards, className = "summary-card") {
  document.querySelector(selector).innerHTML = cards.map((card) => `<div class="${className}"><span>${card.label}</span><strong class="${card.className || ""}">${card.value}</strong><p>${card.body}</p></div>`).join("");
}

function renderStatus(parsed, rows) {
  const missingOptional = optionalColumns.filter((column) => !parsed.headers.includes(column));
  const status = parsed.errors.length ? "error" : missingOptional.length ? "warning" : "ok";
  const title = uiState.lang === "en"
    ? status === "ok" ? "Data looks good" : status === "warning" ? "Usable, but missing comparison fields" : "Data needs fixes"
    : status === "ok" ? "資料狀態良好" : status === "warning" ? "資料可用，但缺少上月比較欄位" : "資料需要修正";
  const detail = parsed.errors.length
    ? parsed.errors.join(" ")
    : uiState.lang === "en"
      ? `${rows.length} channels loaded.${missingOptional.length ? ` Missing ${missingOptional.join(", ")}; comparison values will show as 0.` : " Full report is ready."}`
      : `${rows.length} 個渠道已讀取。${missingOptional.length ? `缺少 ${missingOptional.join(", ")}，比較數字會以 0 顯示。` : "可產生完整月報。"}`;
  document.querySelector("#dataStatus").className = `status-panel ${status}`;
  document.querySelector("#dataStatus").innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  document.querySelector("#qualityPill").textContent = status === "ok" ? "資料完整" : status === "warning" ? "部分比較" : "待修正";
  if (uiState.lang === "en") {
    document.querySelector("#qualityPill").textContent = status === "ok" ? "Complete Data" : status === "warning" ? "Partial Comparison" : "Needs Fix";
  }
}

function isActiveChannel(channel) {
  return !appState.selectedChannel || appState.selectedChannel === channel;
}

function chartAlpha(channel) {
  return isActiveChannel(channel) ? 1 : 0.28;
}

function canvasContext(id) {
  const canvas = document.querySelector(id);
  const logicalWidth = Number(canvas.getAttribute("width"));
  const logicalHeight = Number(canvas.getAttribute("height"));
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  canvas.dataset.logicalWidth = String(logicalWidth);
  canvas.dataset.logicalHeight = String(logicalHeight);
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);
  canvas.style.aspectRatio = `${logicalWidth} / ${logicalHeight}`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  return { canvas, ctx, width: logicalWidth, height: logicalHeight };
}

function roundRect(ctx, x, y, width, height, radius = 8) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawText(ctx, text, x, y, options = {}) {
  ctx.fillStyle = options.color || "#172026";
  ctx.font = `${options.weight || 500} ${options.size || 13}px system-ui, sans-serif`;
  ctx.textAlign = options.align || "left";
  ctx.fillText(text, x, y);
}

function setCanvasHits(canvas, hits) {
  chartHits.set(canvas.id, hits);
}

function drawTrendChart(metrics) {
  const { canvas, ctx, width, height } = canvasContext("#trendChart");
  const modes = {
    overview: [
      [metricLabel("spend"), metrics.spendChange, "#a16207"],
      [metricLabel("clicks"), metrics.clickChange, "#2563a8"],
      [metricLabel("conversions"), metrics.conversionChange, "#0f766e"],
      [metricLabel("revenue"), metrics.revenueChange, "#be3f62"],
      ["CPA", metrics.cpaChange, "#64748b"],
      ["ROAS", metrics.roasChange, "#6d5aa7"],
    ],
    efficiency: [
      ["CPA", metrics.cpaChange, "#64748b"],
      ["ROAS", metrics.roasChange, "#6d5aa7"],
      ["CTR", metrics.ctr, "#2563a8", true],
      ["CVR", metrics.conversionRate, "#0f766e", true],
    ],
    growth: [
      [metricLabel("spend"), metrics.spendChange, "#a16207"],
      [metricLabel("clicks"), metrics.clickChange, "#2563a8"],
      [metricLabel("conversions"), metrics.conversionChange, "#0f766e"],
      [metricLabel("revenue"), metrics.revenueChange, "#be3f62"],
    ],
  };
  const values = modes[appState.chartMode];
  const zeroY = height / 2;
  const maxAbs = Math.max(0.1, ...values.map((item) => Math.abs(item[1])));
  const scale = 125 / maxAbs;
  const hits = [];
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#fbfcfc");
  bg.addColorStop(1, "#f6f8f7");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e4eaed";
  for (let i = 0; i < 5; i += 1) {
    const y = 52 + i * 58;
    ctx.beginPath();
    ctx.moveTo(54, y);
    ctx.lineTo(width - 30, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#9eabb2";
  ctx.beginPath();
  ctx.moveTo(54, zeroY);
  ctx.lineTo(width - 30, zeroY);
  ctx.stroke();
  values.forEach(([label, value, color, raw], index) => {
    const x = 76 + index * (values.length > 4 ? 102 : 138);
    const barHeight = Math.max(4, Math.abs(value) * scale);
    const y = value >= 0 ? zeroY - barHeight : zeroY;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `${color}99`);
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, 52, barHeight, 8);
    ctx.fill();
    drawText(ctx, label, x + 26, height - 34, { align: "center", weight: 750 });
    drawText(ctx, raw ? percentFormatter.format(value) : formatTrend(value), x + 26, value >= 0 ? y - 10 : y + barHeight + 20, { align: "center", size: 12, weight: 700, color: value >= 0 ? "#0f766e" : "#be3f62" });
    hits.push({ type: "rect", x, y, width: 52, height: barHeight, title: label, value: raw ? percentFormatter.format(value) : formatTrend(value) });
  });
  setCanvasHits(canvas, hits);
}

function drawRevenueChart(channels, money) {
  const { canvas, ctx } = canvasContext("#revenueChart");
  const cx = 150;
  const cy = 148;
  const radius = 92;
  const hits = [];
  let start = -Math.PI / 2;
  channels.forEach((row, index) => {
    const slice = row.revenueShare * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.globalAlpha = chartAlpha(row.channel);
    ctx.fill();
    ctx.globalAlpha = 1;
    hits.push({ type: "arc", x: cx, y: cy, radius, innerRadius: 52, start, end: start + slice, channel: row.channel, title: row.channel, rows: [`營收 ${money.format(row.revenue)}`, `占比 ${percentFormatter.format(row.revenueShare)}`, `ROAS ${row.roas.toFixed(2)}`] });
    start += slice;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(23,32,38,.12)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  drawText(ctx, metricLabel("revenue"), cx, cy - 4, { align: "center", color: "#66757f", size: 12, weight: 700 });
  drawText(ctx, money.format(channels.reduce((total, row) => total + row.revenue, 0)), cx, cy + 18, { align: "center", size: 15, weight: 800 });
  channels.slice(0, 5).forEach((row, index) => {
    const y = 42 + index * 34;
    ctx.fillStyle = palette[index % palette.length];
    ctx.globalAlpha = chartAlpha(row.channel);
    ctx.fillRect(286, y - 10, 12, 12);
    ctx.globalAlpha = 1;
    drawText(ctx, row.channel, 306, y, { size: 12, weight: 700 });
    drawText(ctx, percentFormatter.format(row.revenueShare), 306, y + 16, { size: 12, color: "#66757f" });
  });
  setCanvasHits(canvas, hits);
}

function drawRoasChart(channels) {
  const { canvas, ctx } = canvasContext("#roasChart");
  const maxRoas = Math.max(1, ...channels.map((row) => row.roas));
  const hits = [];
  channels.forEach((row, index) => {
    const y = 42 + index * 52;
    const barWidth = (row.roas / maxRoas) * 310;
    drawText(ctx, row.channel, 24, y, { size: 13, weight: 700 });
    ctx.fillStyle = "#edf2f0";
    roundRect(ctx, 160, y - 16, 320, 18, 9);
    ctx.fill();
    ctx.fillStyle = palette[index % palette.length];
    ctx.globalAlpha = chartAlpha(row.channel);
    roundRect(ctx, 160, y - 16, barWidth, 18, 9);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawText(ctx, row.roas.toFixed(2), 490, y - 2, { align: "right", size: 12, weight: 800 });
    hits.push({ type: "rect", x: 160, y: y - 16, width: Math.max(barWidth, 8), height: 18, channel: row.channel, title: row.channel, rows: [`ROAS ${row.roas.toFixed(2)}`, `CPA ${appState.money.format(row.cpa)}`, `${metricLabel("conversions")} ${numberFormatter.format(row.conversions)}`] });
  });
  setCanvasHits(canvas, hits);
}

function drawFunnelChart(metrics) {
  const { ctx, width } = canvasContext("#funnelChart");
  const steps = [
    [metricLabel("impressions"), metrics.impressions, "#2563a8"],
    [metricLabel("clicks"), metrics.clicks, "#0f766e"],
    [metricLabel("conversions"), metrics.conversions, "#a16207"],
  ];
  steps.forEach(([label, value, color], index) => {
    const topWidth = 410 - index * 96;
    const bottomWidth = 410 - (index + 1) * 96;
    const y = 42 + index * 82;
    const center = width / 2;
    ctx.beginPath();
    ctx.moveTo(center - topWidth / 2, y);
    ctx.lineTo(center + topWidth / 2, y);
    ctx.lineTo(center + bottomWidth / 2, y + 54);
    ctx.lineTo(center - bottomWidth / 2, y + 54);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(center - topWidth / 2, y, center + topWidth / 2, y + 54);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `${color}bb`);
    ctx.fillStyle = gradient;
    ctx.fill();
    drawText(ctx, label, center, y + 24, { align: "center", color: "#fff", size: 14, weight: 800 });
    drawText(ctx, numberFormatter.format(value), center, y + 43, { align: "center", color: "#fff", size: 12, weight: 700 });
  });
  drawText(ctx, `CTR ${percentFormatter.format(metrics.ctr)}`, 80, 300, { color: "#66757f", weight: 700 });
  drawText(ctx, `CVR ${percentFormatter.format(metrics.conversionRate)}`, 330, 300, { color: "#66757f", weight: 700 });
}

function drawQuadrantChart(channels, metrics, money) {
  const { canvas, ctx } = canvasContext("#quadrantChart");
  const left = 58;
  const top = 34;
  const width = 400;
  const height = 238;
  const maxRoas = Math.max(1, ...channels.map((row) => row.roas));
  const maxCpa = Math.max(1, ...channels.map((row) => row.cpa));
  const hits = [];
  ctx.strokeStyle = "#d9e1e5";
  ctx.fillStyle = "#fbfcfc";
  roundRect(ctx, left, top, width, height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, top + height / 2);
  ctx.lineTo(left + width, top + height / 2);
  ctx.moveTo(left + width / 2, top);
  ctx.lineTo(left + width / 2, top + height);
  ctx.stroke();
  drawText(ctx, uiState.lang === "en" ? "High ROAS" : "高 ROAS", left + 6, top - 10, { size: 12, color: "#66757f", weight: 700 });
  drawText(ctx, uiState.lang === "en" ? "High CPA" : "高 CPA", left + width - 8, top + height + 24, { align: "right", size: 12, color: "#66757f", weight: 700 });
  channels.forEach((row, index) => {
    const x = left + (row.cpa / maxCpa) * width;
    const y = top + height - (row.roas / maxRoas) * height;
    const radius = 8 + Math.min(14, row.revenueShare * 50);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = palette[index % palette.length];
    ctx.globalAlpha = 0.84 * chartAlpha(row.channel);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawText(ctx, row.channel, x + 12, y + 4, { size: 11, weight: 700 });
    hits.push({ type: "circle", x, y, radius: radius + 4, channel: row.channel, title: row.channel, rows: [`CPA ${money.format(row.cpa)}`, `ROAS ${row.roas.toFixed(2)}`, `${uiState.lang === "en" ? "Revenue share" : "營收占比"} ${percentFormatter.format(row.revenueShare)}`] });
  });
  drawText(ctx, `${uiState.lang === "en" ? "Average CPA" : "平均 CPA"} ${money.format(metrics.cpa)}`, 58, 306, { size: 12, color: "#66757f" });
  setCanvasHits(canvas, hits);
}

function renderChannels(channels, money) {
  document.querySelector("#channelList").innerHTML = channels.map((row, index) => `<div class="channel-item ${appState.selectedChannel === row.channel ? "selected" : ""} ${isActiveChannel(row.channel) ? "" : "muted-item"}" data-channel="${row.channel}"><div><h4>${index + 1}. ${row.channel}</h4><p>${metricLabel("spend")} ${money.format(row.spend)}，${metricLabel("clicks")} ${numberFormatter.format(row.clicks)}，${metricLabel("conversions")} ${numberFormatter.format(row.conversions)}</p></div><div class="channel-metric"><strong>ROAS ${row.roas.toFixed(2)}</strong><span>CPA ${money.format(row.cpa)}</span></div></div>`).join("");
}

function renderDetailTable(channels, money) {
  document.querySelector("#detailTable").innerHTML = channels.map((row) => `<tr class="${appState.selectedChannel === row.channel ? "selected" : ""} ${isActiveChannel(row.channel) ? "" : "muted-item"}" data-channel="${row.channel}"><td>${row.channel}</td><td>${money.format(row.spend)}</td><td>${numberFormatter.format(row.clicks)}</td><td>${numberFormatter.format(row.conversions)}</td><td>${money.format(row.revenue)}</td><td>${percentFormatter.format(row.ctr)}</td><td>${percentFormatter.format(row.cvr)}</td><td>${money.format(row.cpa)}</td><td>${row.roas.toFixed(2)}</td></tr>`).join("");
}

function hitTest(hit, x, y) {
  if (hit.type === "rect") return x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height;
  if (hit.type === "circle") return Math.hypot(x - hit.x, y - hit.y) <= hit.radius;
  if (hit.type === "arc") {
    const distance = Math.hypot(x - hit.x, y - hit.y);
    if (distance < hit.innerRadius || distance > hit.radius) return false;
    let angle = Math.atan2(y - hit.y, x - hit.x);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    return angle >= hit.start && angle <= hit.end;
  }
  return false;
}

function showTooltip(event, hit) {
  const tooltip = document.querySelector("#chartTooltip");
  tooltip.innerHTML = `<strong>${hit.title}</strong>${hit.rows ? hit.rows.map((row) => `<span>${row}</span>`).join("") : `<span>${hit.value}</span>`}`;
  tooltip.classList.add("visible");
  tooltip.style.left = `${event.clientX + 14}px`;
  tooltip.style.top = `${event.clientY + 14}px`;
}

function hideTooltip() {
  document.querySelector("#chartTooltip").classList.remove("visible");
}

function setSelectedChannel(channel) {
  appState.selectedChannel = appState.selectedChannel === channel ? null : channel;
  document.querySelector("#selectedChannel").textContent = `目前檢視：${appState.selectedChannel || "全部渠道"}`;
  document.querySelector("#selectedChannel").textContent = `${uiState.lang === "en" ? "Viewing:" : "目前檢視："} ${appState.selectedChannel || metricLabel("selectedAll")}`;
  renderInteractiveState();
}

function renderInteractiveState() {
  if (!appState.metrics) return;
  renderChannels(appState.channels, appState.money);
  renderDetailTable(appState.channels, appState.money);
  drawTrendChart(appState.metrics);
  drawRevenueChart(appState.channels, appState.money);
  drawRoasChart(appState.channels);
  drawFunnelChart(appState.metrics);
  drawQuadrantChart(appState.channels, appState.metrics, appState.money);
}

function attachChartInteractions() {
  document.querySelectorAll("canvas").forEach((canvas) => {
    if (canvas.dataset.interactive === "true") return;
    canvas.dataset.interactive = "true";
    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * Number(canvas.dataset.logicalWidth || canvas.width);
      const y = ((event.clientY - rect.top) / rect.height) * Number(canvas.dataset.logicalHeight || canvas.height);
      const hit = (chartHits.get(canvas.id) || []).find((item) => hitTest(item, x, y));
      canvas.classList.toggle("is-hovering", Boolean(hit));
      if (hit) showTooltip(event, hit);
      else hideTooltip();
    });
    canvas.addEventListener("mouseleave", () => {
      canvas.classList.remove("is-hovering");
      hideTooltip();
    });
    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * Number(canvas.dataset.logicalWidth || canvas.width);
      const y = ((event.clientY - rect.top) / rect.height) * Number(canvas.dataset.logicalHeight || canvas.height);
      const hit = (chartHits.get(canvas.id) || []).find((item) => hitTest(item, x, y));
      if (hit?.channel) setSelectedChannel(hit.channel);
    });
  });
}

function generateReport(options = {}) {
  const useAi = typeof options === "object" && options.useAi === true;
  const parsed = parseCsv(fields.csvInput.value);
  renderStatus(parsed, parsed.rows);
  if (parsed.errors.length || !parsed.rows.length) return;
  const money = moneyFormatter();
  const metrics = calculate(parsed.rows);
  const channels = buildChannelRows(parsed.rows, metrics);
  const score = buildScore(metrics);
  appState.metrics = metrics;
  appState.channels = channels;
  appState.money = money;
  appState.lastGeneratedAt = new Date();
  document.querySelector("#selectedChannel").textContent = `${uiState.lang === "en" ? "Viewing:" : "目前檢視："} ${appState.selectedChannel || metricLabel("selectedAll")}`;

  document.querySelector("#coverAgency").textContent = fields.agencyName.value || "AgencyReport AI";
  const fallbackClient = uiState.lang === "en" ? "Untitled Client" : "未命名客戶";
  const titleSeparator = uiState.lang === "en" ? " " : "";
  document.querySelector("#coverTitle").textContent = `${fields.clientName.value || fallbackClient}${titleSeparator}${reportTypeLabel(fields.reportType.value)}`;
  document.querySelector("#coverMonth").textContent = monthLabel(fields.reportMonth.value);
  document.querySelector("#healthScore").textContent = score;
  document.querySelector("#scoreLabel").textContent = scoreLabel(score);
  renderCards("#summaryCards", buildSummary(metrics, money));
  renderCards("#kpiGrid", [
    { label: metricLabel("totalSpend"), value: money.format(metrics.spend), body: `${uiState.lang === "en" ? "vs last month" : "較上月"} ${formatTrend(metrics.spendChange)}`, className: trendClass(metrics.spendChange, true) },
    { label: `${metricLabel("clicks")} / CTR`, value: numberFormatter.format(metrics.clicks), body: `CTR ${percentFormatter.format(metrics.ctr)}，CPC ${money.format(metrics.cpc)}`, className: trendClass(metrics.clickChange) },
    { label: `${metricLabel("conversions")} / CVR`, value: numberFormatter.format(metrics.conversions), body: `CVR ${percentFormatter.format(metrics.conversionRate)}，${uiState.lang === "en" ? "vs last month" : "較上月"} ${formatTrend(metrics.conversionChange)}`, className: trendClass(metrics.conversionChange) },
    { label: "ROAS", value: metrics.roas.toFixed(2), body: `${metricLabel("revenue")} ${money.format(metrics.revenue)}，${uiState.lang === "en" ? "vs last month" : "較上月"} ${formatTrend(metrics.roasChange)}`, className: trendClass(metrics.roasChange) },
  ], "kpi-card");
  renderChannels(channels, money);
  renderCards("#diagnostics", buildDiagnostics(metrics, channels, money), "diagnostic-card");
  renderDetailTable(channels, money);
  renderRuleBasedNarrative(metrics, parsed.rows, channels);
  drawTrendChart(metrics);
  drawRevenueChart(channels, money);
  drawRoasChart(channels);
  drawFunnelChart(metrics);
  drawQuadrantChart(channels, metrics, money);
  attachChartInteractions();
  updateCaseSummary();
  renderDeliveryCenter();
  renderLaunchChecklist();
  renderProgressContent();
  if (useAi) {
    setAiReportStatus("loading");
    return enrichReportWithAi(metrics, channels).catch(() => {
      renderRuleBasedNarrative(metrics, parsed.rows, channels);
      setAiReportStatus("fallback");
    });
  }
}

async function generateReportFromButton() {
  const button = document.querySelector("#generateBtn");
  setButtonState(button, "loading", "generateReport");
  try {
    await Promise.resolve(generateReport({ useAi: true }));
    setButtonState(button, "success", "generateReport");
  } catch {
    setAiReportStatus("fallback");
    setButtonState(button, "success", "generateReport");
  }
}

async function saveReportSnapshot(snapshot) {
  const report = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    reportMonth: fields.reportMonth.value,
    currency: fields.currency.value,
    tone: fields.tone.value,
    request: fields.clientRequest.value,
    automationLevel: fields.automationLevel.value,
    scheduleCadence: fields.scheduleCadence.value,
    deliveryEmail: fields.deliveryEmail.value,
    metrics: snapshot.metrics,
    score: snapshot.score,
    channels: snapshot.channels.map((row) => ({
      channel: row.channel,
      spend: row.spend,
      clicks: row.clicks,
      conversions: row.conversions,
      revenue: row.revenue,
      cpa: row.cpa,
      roas: row.roas,
    })),
  };
  try {
    const saved = await apiCreate("reports", report);
    if (saved) {
      appState.reports = [...appState.reports, saved];
      renderClientHub();
      renderReportLibrary();
      await loadAuditLogs();
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const reports = localList("agencyReportReports");
  reports.push({ ...report, id: `local-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportReports", reports);
  appState.reports = reports;
  renderClientHub();
  renderReportLibrary();
}

async function saveCurrentReport() {
  const button = document.querySelector("#saveReportBtn");
  setButtonState(button, "loading", "saveReport");
  if (!appState.metrics || !appState.channels.length) {
    generateReport();
  }
  if (!appState.metrics || !appState.channels.length) {
    setButtonState(button, "error", "saveReport");
    return;
  }
  await saveReportSnapshot({
    metrics: appState.metrics,
    channels: appState.channels,
    score: document.querySelector("#healthScore").textContent,
  });
  setButtonState(button, "success", "saveReport");
}

async function loadTemplates() {
  let templates = JSON.parse(localStorage.getItem("agencyReportTemplates") || "[]");
  try {
    templates = (await apiList("templates")) || templates;
  } catch {
    appState.apiOnline = false;
  }
  appState.templates = templates;
  const currentLabel = uiState.lang === "en" ? "Current setup" : "目前設定";
  fields.templateSelect.innerHTML = `<option value="">${currentLabel}</option>${templates.map((template, index) => `<option value="${index}">${template.clientName} / ${template.agencyName}</option>`).join("")}`;
}

async function saveTemplate() {
  const button = document.querySelector("#saveTemplateBtn");
  const templates = JSON.parse(localStorage.getItem("agencyReportTemplates") || "[]");
  const template = {
    agencyName: fields.agencyName.value,
    clientName: fields.clientName.value,
    reportType: fields.reportType.value,
    currency: fields.currency.value,
    tone: fields.tone.value,
    sheetUrl: fields.sheetUrl.value,
  };
  try {
    const saved = await apiCreate("templates", template);
    if (saved) {
      await loadTemplates();
      fields.templateSelect.value = String(appState.templates.length - 1);
      setButtonState(button, "success", "saveTemplate");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  templates.push(template);
  appState.templates = templates;
  localStorage.setItem("agencyReportTemplates", JSON.stringify(templates));
  await loadTemplates();
  fields.templateSelect.value = String(templates.length - 1);
  setButtonState(button, "success", "saveTemplate");
}

function applyTemplate() {
  const templates = appState.templates.length ? appState.templates : JSON.parse(localStorage.getItem("agencyReportTemplates") || "[]");
  const template = templates[Number(fields.templateSelect.value)];
  if (!template) return;
  ["agencyName", "clientName", "reportType", "currency", "tone", "sheetUrl"].forEach((key) => {
    fields[key].value = template[key] || fields[key].value;
  });
  generateReport();
}

async function importSheet() {
  const button = document.querySelector("#importSheetBtn");
  if (!fields.sheetUrl.value.trim()) {
    alert("請貼上 Google Sheets 發佈成 CSV 的網址。");
    return;
  }
  setButtonState(button, "loading", "importSheets");
  const response = await fetch(fields.sheetUrl.value.trim());
  if (!response.ok) {
    setButtonState(button, "error", "importSheets");
    throw new Error("無法讀取 Sheets CSV，請確認已發佈或權限為公開。");
  }
  fields.csvInput.value = await response.text();
  generateReport();
  setButtonState(button, "success", "importSheets");
}

function exportHtml() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${document.querySelector("#coverTitle").textContent}</title><link rel="stylesheet" href="./styles.css"></head><body><main class="export-page">${document.querySelector("#report").outerHTML}</main></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fields.clientName.value || "report"}-${fields.reportMonth.value || "month"}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
  appState.lastExportedAt = new Date();
  if (appState.metrics && appState.channels.length) {
    saveReportSnapshot({ metrics: appState.metrics, channels: appState.channels, score: document.querySelector("#healthScore").textContent });
  }
  renderLaunchChecklist();
  renderProgressContent();
  setButtonState(document.querySelector("#exportHtmlBtn"), "success", "exportHtml");
}

async function copyCsvTemplate() {
  const button = document.querySelector("#insertCsvTemplateBtn");
  const template = "channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue";
  fields.csvInput.value = `${template}\n`;
  refreshAiAutomation();
  setButtonState(button, "success", "copyCsvTemplate");
}

function downloadSampleCsv() {
  const button = document.querySelector("#downloadSampleBtn");
  const sample = fields.sampleSelect.value || "ads";
  const blob = new Blob([samples[sample]], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `agencyreport-${sample}-sample.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  setButtonState(button, "success", "downloadSample");
}

function clearLocalData() {
  localStorage.removeItem("agencyReportTemplates");
  localStorage.removeItem("agencyReportLeads");
  localStorage.removeItem("agencyReportClients");
  localStorage.removeItem("agencyReportPortalInvites");
  localStorage.removeItem("agencyReportPortalSubmissions");
  localStorage.removeItem("agencyReportReports");
  localStorage.removeItem("agencyReportDataSources");
  localStorage.removeItem("agencyReportIntakes");
  localStorage.removeItem("agencyReportConsents");
  localStorage.removeItem("agencyReportTeamMembers");
  localStorage.removeItem("agencyReportDeliveries");
  localStorage.removeItem("agencyReportShareLinks");
  localStorage.removeItem("agencyReportEmailJobs");
  localStorage.removeItem("agencyReportInvoices");
  localStorage.removeItem("agencyReportBillingIntents");
  localStorage.removeItem("agencyReportAiRuns");
  localStorage.removeItem("agencyReportSchedules");
  appState.clients = [];
  appState.portalInvites = [];
  appState.portalSubmissions = [];
  appState.reports = [];
  appState.dataSources = [];
  appState.intakes = [];
  appState.consents = [];
  appState.teamMembers = [];
  appState.deliveries = [];
  appState.shareLinks = [];
  appState.emailJobs = [];
  appState.invoices = [];
  appState.billingIntents = [];
  appState.aiRuns = [];
  appState.schedules = [];
  loadTemplates();
  renderClientHub();
  renderReportLibrary();
  renderTeamAccess();
  renderSourceCenter();
  renderIntakeStatus();
  renderTrustCenter();
  renderDeliveryCenter();
  renderBillingHub();
  renderAgentStatus();
  document.querySelector("#leadStatus").className = "status-panel";
  document.querySelector("#leadStatus").innerHTML = "";
  setButtonState(document.querySelector("#clearLocalBtn"), "success", "clearLocal");
}

async function saveLead(event) {
  event.preventDefault();
  const legalConsent = document.querySelector("#leadLegalConsent");
  if (!legalConsent.checked) {
    document.querySelector("#leadStatus").className = "status-panel error";
    document.querySelector("#leadStatus").innerHTML = `<strong>${legalText().requiredTitle}</strong><span>${legalText().requiredBody}</span>`;
    return;
  }
  const leads = JSON.parse(localStorage.getItem("agencyReportLeads") || "[]");
  const lead = {
    name: document.querySelector("#leadName").value,
    email: document.querySelector("#leadEmail").value,
    request: fields.clientRequest.value,
    planInterest: fields.automationLevel.value,
    legalConsent: {
      accepted: true,
      version: legalVersion,
      source: "lead-form",
      acceptedAt: new Date().toISOString(),
    },
  };
  try {
    const saved = await apiCreate("leads", lead);
    if (!saved) throw new Error("API fallback");
    leads.push(saved);
  } catch {
    appState.apiOnline = false;
    leads.push({ ...lead, createdAt: new Date().toISOString() });
    localStorage.setItem("agencyReportLeads", JSON.stringify(leads));
  }
  document.querySelector("#leadStatus").className = "status-panel ok";
  document.querySelector("#leadStatus").innerHTML = uiState.lang === "en"
    ? `<strong>Lead saved</strong><span>${leads.length} lead(s) collected. ${appState.apiOnline ? t("backendConnected") : t("backendFallback")}.</span>`
    : `<strong>已儲存名單</strong><span>目前累積 ${leads.length} 筆。${appState.apiOnline ? t("backendConnected") : t("backendFallback")}。</span>`;
  event.target.reset();
  renderLaunchChecklist();
  renderProgressContent();
}

async function submitPortalRequest(event) {
  event.preventDefault();
  const button = document.querySelector("#submitPortalBtn");
  const status = document.querySelector("#portalStatus");
  const goal = document.querySelector("#portalGoal").value.trim();
  const sourceUrl = document.querySelector("#portalSourceUrl").value.trim();
  const legalConsent = document.querySelector("#portalLegalConsent");
  if (!legalConsent.checked) {
    status.className = "status-panel error";
    status.innerHTML = `<strong>${legalText().requiredTitle}</strong><span>${legalText().requiredBody}</span>`;
    setButtonState(button, "error", "submitPortal");
    return;
  }
  if (!goal && !sourceUrl) {
    status.className = "status-panel error";
    status.innerHTML = `<strong>${t("portalMissing")}</strong><span>${t("portalTitle")}</span>`;
    setButtonState(button, "error", "submitPortal");
    return;
  }
  setButtonState(button, "loading", "submitPortal");
  const payload = {
    token: portalTokenFromPath(),
    contactEmail: document.querySelector("#portalContactEmail").value.trim(),
    goal,
    sourceUrl,
    notes: document.querySelector("#portalNotes").value.trim(),
    legalConsent: {
      accepted: true,
      version: legalVersion,
      source: "client-portal",
      acceptedAt: new Date().toISOString(),
    },
    status: "submitted",
    submittedAt: new Date().toISOString(),
  };
  try {
    const saved = await apiCreate("portal-submissions", payload);
    if (saved) {
      appState.portalSubmissions = [...appState.portalSubmissions, saved];
      status.className = "status-panel ok";
      status.innerHTML = `<strong>${t("portalSubmitted")}</strong><span>${saved.submittedAt || saved.createdAt || ""}</span>`;
      setButtonState(button, "success", "submitPortal");
      return;
    }
  } catch {
    appState.apiOnline = false;
  }
  const submissions = localList("agencyReportPortalSubmissions");
  submissions.push({ ...payload, id: `local-portal-submission-${Date.now()}`, createdAt: new Date().toISOString() });
  localSave("agencyReportPortalSubmissions", submissions);
  appState.portalSubmissions = submissions;
  status.className = "status-panel ok";
  status.innerHTML = `<strong>${t("portalSubmitted")}</strong><span>${payload.submittedAt}</span>`;
  setButtonState(button, "success", "submitPortal");
}

function resetForm(sample = "ads") {
  fields.agencyName.value = "Northstar Marketing";
  fields.clientName.value = defaultClientName(sample);
  fields.reportType.value = sample;
  fields.currency.value = "TWD";
  fields.tone.value = "executive";
  fields.csvInput.value = samples[sample];
  setDefaultMonth();
  generateReport();
}

document.querySelector("#loadDemoBtn").addEventListener("click", () => resetForm(fields.sampleSelect.value));
document.querySelector("#authForm").addEventListener("submit", (event) => submitAuth(event).catch(() => setButtonState(document.querySelector("#loginBtn"), "error", "login")));
document.querySelector("#registerBtn").addEventListener("click", () => registerAuth().catch(() => setButtonState(document.querySelector("#registerBtn"), "error", "register")));
document.querySelector("#logoutBtn").addEventListener("click", () => logoutAuth().catch(() => {}));
document.querySelector("#closeLegalBtn").addEventListener("click", hideLegalPanel);
document.querySelector("#leadLegalBtn").addEventListener("click", showLegalPanel);
document.querySelector("#portalLegalBtn").addEventListener("click", showLegalPanel);
document.querySelector("#legalPanel").addEventListener("click", (event) => {
  if (event.target.id === "legalPanel") hideLegalPanel();
});
document.querySelector("#quickAdsBtn").addEventListener("click", () => {
  fields.sampleSelect.value = "ads";
  resetForm("ads");
});
document.querySelector("#quickSeoBtn").addEventListener("click", () => {
  fields.sampleSelect.value = "seo";
  resetForm("seo");
});
document.querySelector("#quickSocialBtn").addEventListener("click", () => {
  fields.sampleSelect.value = "social";
  resetForm("social");
});
document.querySelector("#sampleSelect").addEventListener("change", () => resetForm(fields.sampleSelect.value));
document.querySelector("#generateBtn").addEventListener("click", () => generateReportFromButton());
document.querySelector("#saveTemplateBtn").addEventListener("click", () => saveTemplate().catch(() => setButtonState(document.querySelector("#saveTemplateBtn"), "error", "saveTemplate")));
document.querySelector("#templateSelect").addEventListener("change", applyTemplate);
document.querySelector("#saveReportBtn").addEventListener("click", () => saveCurrentReport().catch(() => setButtonState(document.querySelector("#saveReportBtn"), "error", "saveReport")));
document.querySelector("#importSheetBtn").addEventListener("click", () => importSheet().catch((error) => alert(error.message)));
document.querySelector("#exportHtmlBtn").addEventListener("click", exportHtml);
document.querySelector("#printBtn").addEventListener("click", () => window.print());
document.querySelector("#insertCsvTemplateBtn").addEventListener("click", copyCsvTemplate);
document.querySelector("#downloadSampleBtn").addEventListener("click", downloadSampleCsv);
document.querySelector("#clearLocalBtn").addEventListener("click", clearLocalData);
document.querySelector("#testSourceBtn").addEventListener("click", () => testDataSource().catch(() => setButtonState(document.querySelector("#testSourceBtn"), "error", "testSource")));
document.querySelector("#saveSourceBtn").addEventListener("click", () => saveDataSource().catch(() => setButtonState(document.querySelector("#saveSourceBtn"), "error", "saveSource")));
document.querySelector("#refreshAuditBtn").addEventListener("click", () => refreshAuditLogs().catch(() => setButtonState(document.querySelector("#refreshAuditBtn"), "error", "refreshAudit")));
document.querySelector("#saveIntakeBtn").addEventListener("click", () => saveIntake().catch(() => setButtonState(document.querySelector("#saveIntakeBtn"), "error", "saveIntake")));
document.querySelector("#refreshPortalSubmissionsBtn").addEventListener("click", () => refreshPortalSubmissions().catch(() => setButtonState(document.querySelector("#refreshPortalSubmissionsBtn"), "error", "refreshPortalSubmissions")));
document.querySelector("#applyPortalSubmissionBtn").addEventListener("click", applyLatestPortalSubmission);
document.querySelector("#processPortalSubmissionBtn").addEventListener("click", () => processLatestPortalSubmission().catch(() => setButtonState(document.querySelector("#processPortalSubmissionBtn"), "error", "processPortalSubmission")));
document.querySelector("#runPortalAiDraftBtn").addEventListener("click", () => runPortalAiDraft().catch(() => setButtonState(document.querySelector("#runPortalAiDraftBtn"), "error", "runPortalAiDraft")));
document.querySelector("#saveConsentBtn").addEventListener("click", () => saveConsent().catch(() => setButtonState(document.querySelector("#saveConsentBtn"), "error", "saveConsent")));
document.querySelector("#runAutopilotBtn").addEventListener("click", runAutopilot);
document.querySelector("#completeDemoBtn").addEventListener("click", completeDemoSetup);
document.querySelector("#setupWizard").addEventListener("click", (event) => {
  if (event.target.closest("#setupWizardActionBtn")) runSetupWizardStep();
  if (event.target.closest("#copyOnboardingPackBtn")) copyOnboardingPack();
  if (event.target.closest("#downloadOnboardingPackBtn")) downloadOnboardingPack();
});
document.querySelector("#saveClientBtn").addEventListener("click", () => saveClient().catch(() => setButtonState(document.querySelector("#saveClientBtn"), "error", "saveClient")));
document.querySelector("#syncClientsBtn").addEventListener("click", () => syncClientData().catch(() => setButtonState(document.querySelector("#syncClientsBtn"), "error", "syncClients")));
document.querySelector("#createPortalInviteBtn").addEventListener("click", () => createPortalInvite().catch(() => setButtonState(document.querySelector("#createPortalInviteBtn"), "error", "createPortalInvite")));
document.querySelector("#saveAccountBtn").addEventListener("click", () => saveAccount().catch(() => setButtonState(document.querySelector("#saveAccountBtn"), "error", "saveAccount")));
document.querySelector("#createCheckoutBtn").addEventListener("click", () => createCheckout().catch(() => setButtonState(document.querySelector("#createCheckoutBtn"), "error", "createCheckout")));
document.querySelector("#createInvoiceBtn").addEventListener("click", () => createInvoice().catch(() => setButtonState(document.querySelector("#createInvoiceBtn"), "error", "createInvoice")));
document.querySelector("#invoiceList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quote-invoice]");
  if (button) createInvoiceFromAcceptedQuote(button.dataset.quoteInvoice);
});
document.querySelector("#inviteMemberBtn").addEventListener("click", () => inviteTeamMember().catch(() => setButtonState(document.querySelector("#inviteMemberBtn"), "error", "inviteMember")));
document.querySelector("#approveDraftBtn").addEventListener("click", approveDraft);
document.querySelector("#createShareLinkBtn").addEventListener("click", () => createShareLink().catch(() => setButtonState(document.querySelector("#createShareLinkBtn"), "error", "createShareLink")));
document.querySelector("#queueEmailBtn").addEventListener("click", () => queueEmailDelivery().catch(() => setButtonState(document.querySelector("#queueEmailBtn"), "error", "queueEmail")));
document.querySelector("#deliverReportBtn").addEventListener("click", () => deliverReport().catch(() => setButtonState(document.querySelector("#deliverReportBtn"), "error", "deliverReport")));
document.querySelector("#runBackendAiBtn").addEventListener("click", () => runBackendAi().catch(() => setButtonState(document.querySelector("#runBackendAiBtn"), "error", "runBackendAi")));
document.querySelector("#createScheduleBtn").addEventListener("click", () => createSchedule().catch(() => setButtonState(document.querySelector("#createScheduleBtn"), "error", "createSchedule")));
document.querySelector("#planSelect").addEventListener("change", () => {
  renderClientHub();
  renderBillingHub();
  renderHomeDashboard();
});
["clientRequest", "businessType", "automationLevel", "deliveryEmail", "scheduleCadence", "sheetUrl", "sourceType", "sourceOwner", "csvInput"].forEach((key) => {
  fields[key].addEventListener(key === "clientRequest" || key === "deliveryEmail" || key === "sheetUrl" || key === "sourceOwner" || key === "csvInput" ? "input" : "change", () => {
    refreshAiAutomation();
    if (key === "sheetUrl" || key === "sourceType" || key === "sourceOwner" || key === "csvInput") renderSourceCenter();
    if (key === "clientRequest" || key === "businessType" || key === "automationLevel" || key === "deliveryEmail" || key === "scheduleCadence") renderIntakeStatus();
    renderHomeDashboard();
  });
});
document.querySelectorAll("[data-prompt-preset]").forEach((button) => {
  button.addEventListener("click", () => applyPromptPreset(button.dataset.promptPreset));
});
document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.lang));
});
document.querySelector("#leadForm").addEventListener("submit", (event) => saveLead(event).catch(() => {
  document.querySelector("#leadStatus").className = "status-panel error";
  document.querySelector("#leadStatus").innerHTML = uiState.lang === "en" ? "<strong>Save failed</strong><span>Please try again.</span>" : "<strong>儲存失敗</strong><span>請再試一次。</span>";
}));
document.querySelector("#portalForm").addEventListener("submit", (event) => submitPortalRequest(event).catch(() => {
  document.querySelector("#portalStatus").className = "status-panel error";
  document.querySelector("#portalStatus").innerHTML = `<strong>${t("portalMissing")}</strong><span>${t("portalTitle")}</span>`;
}));
document.querySelector("#csvFile").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  fields.csvInput.value = await file.text();
  generateReport();
});
document.querySelectorAll("[data-chart-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    appState.chartMode = button.dataset.chartMode;
    document.querySelectorAll("[data-chart-mode]").forEach((item) => item.classList.toggle("active", item === button));
    renderInteractiveState();
  });
});
document.querySelector("#channelList").addEventListener("click", (event) => {
  const item = event.target.closest("[data-channel]");
  if (item) setSelectedChannel(item.dataset.channel);
});
document.querySelector("#detailTable").addEventListener("click", (event) => {
  const item = event.target.closest("[data-channel]");
  if (item) setSelectedChannel(item.dataset.channel);
});
["agencyName", "clientName", "reportMonth", "reportType", "currency", "tone"].forEach((key) => fields[key].addEventListener("change", generateReport));

applyEnvironmentMode();
setupWorkspaceNavigation();
setupAppPages();
setupAccountDock();
setupThemeToggle();
setupUpgradeModal();
loadTemplates();
resetForm("ads");
applyLanguage(uiState.lang);
initPortalMode();
refreshAiAutomation();
renderLaunchChecklist();
renderProgressContent();
renderClientHub();
renderReportLibrary();
renderBillingHub();
renderTeamAccess();
renderSourceCenter();
renderIntakeStatus();
renderPortalSubmissions();
renderTrustCenter();
renderDeliveryCenter();
renderAgentStatus();
renderAuditCenter();
renderHomeDashboard();
detectApi().then(() => restoreAuth());

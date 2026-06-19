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

const planLimits = {
  free: { reports: 3, monthlyTwd: 0, monthlyUsd: 0 },
  starter: { reports: 10, monthlyTwd: 790, monthlyUsd: 25 },
  agency: { reports: 50, monthlyTwd: 2490, monthlyUsd: 79 },
  professional: { reports: 150, monthlyTwd: 5990, monthlyUsd: 189 },
};

const state = {
  lang: localStorage.getItem("agencyReportLang") || "zh",
  theme: localStorage.getItem("agencyReportTheme") || "dark",
  auth: null,
  usage: null,
  rows: [],
  metrics: null,
  ai: null,
  reports: [],
  clients: [],
  deliveries: [],
  invoices: [],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const copy = {
  zh: {
    appTitle: "代理商 AI 月報平台",
    navFeatures: "特色",
    navWorkflow: "流程",
    navSamples: "範例",
    navPricing: "定價",
    navContact: "接觸",
    login: "登入",
    register: "建立帳號",
    logout: "登出",
    startFree: "開始使用",
    viewSample: "查看範例報告",
    authTitle: "工作台登入",
    authCopy: "登入後才能管理客戶、產生月報、建立付款與追蹤交付。",
    authName: "名稱 / 公司",
    authPassword: "密碼",
    heroEyebrow: "AI 驅動的代理商報告",
    heroCopy: "上傳廣告資料與客戶需求，AgencyReport AI 會在數秒內產生可交付的品牌化月報。",
    heroAiTitle: "AI 下月行動",
    heroAiCopy: "提高搜尋預算、暫停低轉換受眾，並更新登陸頁 CTA。",
    trustTrial: "14 天免費試用",
    trustImport: "CSV / Sheets 匯入",
    trustAi: "AI 摘要與交付草稿",
    featureOneTitle: "資料匯入",
    featureOneCopy: "CSV、Google Sheets、客戶需求與交付 Email 集中管理。",
    featureTwoTitle: "AI 分析",
    featureTwoCopy: "自動產生摘要、風險、下月行動與客戶說明稿。",
    featureThreeTitle: "視覺月報",
    featureThreeCopy: "KPI、趨勢、渠道表現與互動圖表可直接審核。",
    featureFourTitle: "交付追蹤",
    featureFourCopy: "HTML / PDF / Email 草稿、付款與交付紀錄都連在案件裡。",
    workflowKicker: "流程",
    workflowTitle: "四個步驟，把月報變成可重複交付的系統",
    workflowCopy: "從資料收集到 AI 產出，再到品牌化交付，每一步都為小型代理商設計。",
    stepOneLabel: "收集",
    stepOneTitle: "收回資料",
    stepOneCopy: "客戶需求、報告月份、CSV 或 Sheets。",
    stepTwoLabel: "整理",
    stepTwoTitle: "新增上下文",
    stepTwoCopy: "補上產業、KPI、預算與交付語氣。",
    stepThreeLabel: "AI",
    stepThreeTitle: "產生報告",
    stepThreeCopy: "AI 產生摘要、風險、下月建議與客戶說明。",
    stepFourLabel: "交付",
    stepFourTitle: "審核並發送",
    stepFourCopy: "輸出 HTML/PDF，排入 Email 任務並留下紀錄。",
    sampleTitle: "一份真正能交給客戶看的 AI 月報",
    sampleCopy: "它不是只列數字，而是把 KPI 變化、風險、下一步行動整理成代理商能直接使用的說明。",
    sampleClient: "晨光牙醫診所 / 2026-06",
    sampleHeadline: "本月 ROAS 提升，Meta CPA 需控管",
    sampleInsightOne: "搜尋廣告帶來穩定轉換，整體營收優於上月。",
    sampleInsightTwo: "下月建議把預算移往搜尋，並重新整理 Meta 受眾。",
    pricingTitle: "先用低成本驗證，再逐步自動化交付",
    pricingCopy: "方案設計給單人工作室、小型代理商與需要半自動化月報交付的團隊。",
    starterPlanName: "入門版",
    agencyPlanName: "代理商版",
    professionalPlanName: "專業版",
    starterPrice: "NT$790/月",
    agencyPrice: "NT$2,490/月",
    whiteLabelPrice: "NT$5,990/月",
    starterCopy: "每月 10 份 AI 月報、CSV/Sheets 匯入、AI 建議、PDF/HTML 匯出。",
    agencyCopy: "每月 50 份 AI 月報、多客戶、品牌化報告、付款與交付紀錄。",
    whiteLabelCopy: "更高月報量、客戶入口、排程、Email 草稿、白標與進階 AI 分析。",
    finalTitle: "讓第一份 AI 月報成為你的產品化服務",
    finalCopy: "登入後匯入範例資料，先跑出一份完整月報，再逐步接上正式資料源與收款流程。",
    agencyBrand: "代理商品牌",
    clientName: "客戶名稱",
    reportMonth: "報告月份",
    reportType: "報告類型",
    currency: "幣別",
    tone: "語氣",
    clientRequest: "客戶需求",
    dataSource: "資料匯入",
    dataSourceCopy: "貼上 CSV 或匯入 Google Sheets，系統會先產生基礎 KPI 與圖表。",
    csvData: "CSV 資料",
    generateReport: "產生月報",
    aiWorkOrderTitle: "AI 工作單",
    aiWorkOrderCopy: "把客戶需求、CSV 指標與最佳/最弱渠道送給後端 AI。",
    businessType: "產業",
    automationLevel: "自動化程度",
    deliveryCenterTitle: "交付中心",
    deliveryCenterCopy: "匯出客戶報告，並在完成交付後留下紀錄。",
    deliveryEmail: "客戶 Email（選填）",
    exportHtml: "下載 HTML",
    exportPdf: "匯出 PDF",
    markDelivered: "記錄已交付",
    savedReports: "已存報告",
    latestReport: "最新月份",
    saveReport: "儲存目前報告",
    billingTitle: "方案與收款",
    billingCopy: "管理方案、付款草稿、發票與 AI 用量。",
    accountName: "帳戶名稱",
    selectedPlan: "選擇方案",
    checkoutStatus: "付款狀態",
    clientCount: "客戶數",
    reportUsage: "報告用量",
    consentData: "客戶同意資料用於月報分析",
    consentAi: "客戶同意使用 AI 產生建議",
    consentDelivery: "客戶同意 Email / PDF / HTML 交付",
    healthScoreLabel: "健康分數",
    executiveSummary: "執行摘要",
    executiveSummaryCopy: "AI 會將本月成效濃縮成客戶看得懂的重點。",
    riskAlerts: "風險提醒",
    nextActions: "下月行動建議",
    trendChartTitle: "營收與花費趨勢",
    revenueChartTitle: "渠道營收占比",
    roasChartTitle: "渠道 ROAS 排名",
    funnelChartTitle: "轉換漏斗",
    detailData: "渠道明細資料",
    saveLead: "儲存名單",
  },
  en: {
    appTitle: "Agency AI Reporting Platform",
    navFeatures: "Features",
    navWorkflow: "Workflow",
    navSamples: "Samples",
    navPricing: "Pricing",
    navContact: "Contact",
    login: "Sign in",
    register: "Create account",
    logout: "Sign out",
    startFree: "Start free",
    viewSample: "View sample report",
    authTitle: "Workspace sign in",
    authCopy: "Sign in to manage clients, reports, payments, and delivery tracking.",
    authName: "Name / Company",
    authPassword: "Password",
    heroEyebrow: "AI-powered agency reporting",
    heroCopy: "Upload campaign data and client requirements. AgencyReport AI generates a branded monthly report in seconds.",
    heroAiTitle: "AI Next Action",
    heroAiCopy: "Increase search budget, pause weak audiences, and refresh the landing page CTA.",
    trustTrial: "14-day free trial",
    trustImport: "CSV / Sheets import",
    trustAi: "AI summary and delivery draft",
    featureOneTitle: "Data import",
    featureOneCopy: "Manage CSV, Google Sheets, client requirements, and delivery email in one place.",
    featureTwoTitle: "AI analysis",
    featureTwoCopy: "Generate summaries, risks, next-month actions, and client-ready explanations.",
    featureThreeTitle: "Visual report",
    featureThreeCopy: "Review KPI, trends, channel performance, and interactive charts.",
    featureFourTitle: "Delivery tracking",
    featureFourCopy: "Connect HTML / PDF / Email drafts, payment, and handoff records to each case.",
    workflowKicker: "Workflow",
    workflowTitle: "Four steps turn reporting into a repeatable system",
    workflowCopy: "From data collection to AI output and branded delivery, each step is built for small agencies.",
    stepOneLabel: "Collect",
    stepOneTitle: "Collect assets",
    stepOneCopy: "Client needs, report month, CSV, or Sheets.",
    stepTwoLabel: "Context",
    stepTwoTitle: "Add context",
    stepTwoCopy: "Add industry, KPI, budget, and delivery tone.",
    stepThreeLabel: "AI",
    stepThreeTitle: "Generate report",
    stepThreeCopy: "AI creates summary, risks, next actions, and client wording.",
    stepFourLabel: "Delivery",
    stepFourTitle: "Review and send",
    stepFourCopy: "Export HTML/PDF, queue email, and keep a record.",
    sampleTitle: "An AI report your client can actually read",
    sampleCopy: "It turns KPI changes, risks, and next actions into agency-ready narrative.",
    sampleClient: "Sunrise Dental / 2026-06",
    sampleHeadline: "ROAS improved while Meta CPA needs control",
    sampleInsightOne: "Search ads brought stable conversions and revenue improved month over month.",
    sampleInsightTwo: "Move more budget to search and rebuild Meta audiences next month.",
    pricingTitle: "Validate cheaply, then automate delivery",
    pricingCopy: "Plans for solo studios, small agencies, and teams scaling monthly report delivery.",
    starterPlanName: "Starter",
    agencyPlanName: "Agency",
    professionalPlanName: "Professional",
    starterPrice: "NT$790/mo",
    agencyPrice: "NT$2,490/mo",
    whiteLabelPrice: "NT$5,990/mo",
    starterCopy: "10 AI reports per month, CSV/Sheets import, AI recommendations, PDF/HTML export.",
    agencyCopy: "50 AI reports per month, multiple clients, branded reports, payment and delivery records.",
    whiteLabelCopy: "Higher report volume, client portal, schedules, email drafts, white label, advanced AI.",
    finalTitle: "Turn the first AI report into a productized service",
    finalCopy: "Sign in, load sample data, generate a full report, then connect production data and payments.",
    agencyBrand: "Agency brand",
    clientName: "Client name",
    reportMonth: "Report month",
    reportType: "Report type",
    currency: "Currency",
    tone: "Tone",
    clientRequest: "Client request",
    dataSource: "Data import",
    dataSourceCopy: "Paste CSV or import Google Sheets to create KPI and charts first.",
    csvData: "CSV data",
    generateReport: "Generate report",
    aiWorkOrderTitle: "AI work order",
    aiWorkOrderCopy: "Send client needs, CSV metrics, and best/worst channels to backend AI.",
    businessType: "Industry",
    automationLevel: "Automation level",
    deliveryCenterTitle: "Delivery",
    deliveryCenterCopy: "Export the client report and record it after delivery.",
    deliveryEmail: "Client email (optional)",
    exportHtml: "Download HTML",
    exportPdf: "Export PDF",
    markDelivered: "Mark delivered",
    savedReports: "Saved reports",
    latestReport: "Latest month",
    saveReport: "Save current report",
    billingTitle: "Plans & payments",
    billingCopy: "Manage plans, checkout drafts, invoices, and AI usage.",
    accountName: "Account name",
    selectedPlan: "Selected plan",
    checkoutStatus: "Checkout status",
    clientCount: "Clients",
    reportUsage: "Report usage",
    consentData: "Client approved data processing for report analysis",
    consentAi: "Client approved AI-generated recommendations",
    consentDelivery: "Client approved Email / PDF / HTML delivery",
    healthScoreLabel: "Health score",
    executiveSummary: "Executive summary",
    executiveSummaryCopy: "AI condenses the month into client-readable points.",
    riskAlerts: "Risk alerts",
    nextActions: "Next-month actions",
    trendChartTitle: "Revenue and spend trend",
    revenueChartTitle: "Revenue by channel",
    roasChartTitle: "Channel ROAS ranking",
    funnelChartTitle: "Conversion funnel",
    detailData: "Channel detail data",
    saveLead: "Save lead",
  },
};

function t(key) {
  return copy[state.lang]?.[key] || copy.zh[key] || key;
}

function setText(selector, text) {
  const node = $(selector);
  if (node) node.textContent = text;
}

function authToken() {
  return localStorage.getItem("agencyReportAuthToken") || "";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(authToken() ? { authorization: `Bearer ${authToken()}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.code || body.error || body.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = body.code;
    error.details = body.item;
    throw error;
  }
  return body.item ?? body.items ?? body;
}

function applyLanguage(lang = state.lang) {
  state.lang = lang === "en" ? "en" : "zh";
  localStorage.setItem("agencyReportLang", state.lang);
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hant";
  if ($("#authStatus")) $("#authStatus").innerHTML = "";
  $$("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === state.lang));
  $$("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (copy[state.lang][key]) node.textContent = copy[state.lang][key];
  });
  const clientName = $("#clientName");
  if (clientName) {
    if (state.lang === "en" && clientName.value === "晨光牙醫診所") clientName.value = "Morning Light Dental Clinic";
    if (state.lang !== "en" && clientName.value === "Morning Light Dental Clinic") clientName.value = "晨光牙醫診所";
  }
  const heroTitle = $("#heroTitle");
  if (heroTitle) {
    heroTitle.innerHTML = state.lang === "en"
      ? "Stop writing reports.<br />Send them instead."
      : '<span class="title-line"><span class="title-word title-word-a">別再</span><span class="title-word title-word-b">寫報告了，</span></span><span class="title-line"><span class="title-word title-word-c">直接</span><span class="title-word title-word-d">發送報告吧。</span></span>';
  }
  const workspaceLabels = state.lang === "en" ? {
    overview: ["AI assistant", "Add data and analyze automatically"],
    case: ["Case details", "Client and report month"],
    data: ["Data review", "Sources and data quality"],
    report: ["Report results", "KPI, charts, and summary"],
    ai: ["AI advice", "Risks and next actions"],
    delivery: ["Deliver report", "Email and delivery records"],
    settings: ["Privacy settings", "Consent and audit records"],
  } : {
    overview: ["AI 助手", "加入資料並自動分析"],
    case: ["案件資料", "客戶與報告月份"],
    data: ["資料檢查", "來源與數據品質"],
    report: ["報告結果", "KPI、圖表與摘要"],
    ai: ["AI 建議", "風險與下月行動"],
    delivery: ["交付報告", "Email 與交付紀錄"],
    settings: ["隱私設定", "同意與稽核紀錄"],
  };
  $$("[data-workspace-view]").forEach((button) => {
    const label = workspaceLabels[button.dataset.workspaceView];
    if (!label) return;
    const title = button.querySelector("span");
    const description = button.querySelector("small");
    if (title) title.textContent = label[0];
    else button.textContent = label[0];
    if (description) description.textContent = label[1];
  });
  syncDockLanguageLabels();
  translateStaticWorkspace();
  renderUpgradePlans();
  if (state.metrics) renderReport();
}

function translateStaticWorkspace() {
  const zh = state.lang !== "en";
  const apply = (selector, zhText, enText) => setText(selector, zh ? zhText : enText);
  const optionText = (selector, values) => {
    const select = $(selector);
    if (!select) return;
    [...select.options].forEach((option, index) => { if (values[index]) option.textContent = values[index]; });
  };

  apply(".workspace-sidebar-head strong", "月報工作區", "Monthly report workspace");
  apply(".workspace-sidebar-head p", "三個步驟，從資料到客戶交付。", "Three steps from data to client delivery.");
  apply(".ai-intake-panel .panel-head h2", "AI 匯入助手", "AI import assistant");
  apply(".ai-intake-panel .panel-head p", "直接描述需求或加入資料，AI 會整理案件、辨識數據並產生月報。", "Describe the request or add data. AI will structure the case, identify metrics, and generate the report.");
  apply(".assistant-badge", "AI 線上", "AI online");
  apply(".ai-chat-message:first-child .ai-chat-bubble strong", "您好，我可以幫您建立月報", "Hello, I can build your monthly report");
  apply(".ai-chat-message:first-child .ai-chat-bubble p", "請貼上客戶需求、CSV、Google Sheets 或資料網址。我會自動辨識客戶、月份、KPI 與渠道資料。", "Paste client requirements, CSV, Google Sheets, or a data URL. I will identify the client, month, KPIs, and channel data.");
  apply('[data-ai-prompt*="ROAS"]', "分析廣告成效", "Analyze ad performance");
  apply('[data-ai-prompt*="客戶可以直接閱讀"]', "產生客戶月報", "Generate client report");
  apply("#aiIntakeAnalysisTitle", "資料已分析完成", "Analysis complete");
  apply("#aiIntakeAnalysisCopy", "我已辨識並套用以下內容：", "I identified and applied the following:");
  apply("#aiIntakeNextBtn", "查看報告結果", "View report results");
  apply("#aiAttachLabel", "加入檔案", "Add file");
  apply("#aiIntakeFileName", "尚未選擇檔案", "No file selected");
  apply("#aiUseDemoBriefBtn", "使用範例", "Use example");
  apply("#aiAnalyzeApplyBtn span", "送出並分析", "Send and analyze");
  apply(".ai-advanced-tools summary", "進階手動調整", "Advanced manual adjustments");
  apply('label[for="aiIntakePrompt"]', "輸入需求、資料或網址", "Enter requirements, data, or a URL");

  apply(".overview-status-card h2", "案件狀態", "Case status");
  apply(".overview-status-card .panel-head p", "用代理商能理解的方式，看目前卡在哪裡。", "See exactly what is ready and what still needs attention.");
  const overviewStatusLabels = zh ? ["案件", "資料", "AI", "交付"] : ["Case", "Data", "AI", "Delivery"];
  $$(".overview-status-grid > div > span").forEach((node, index) => {
    if (overviewStatusLabels[index]) node.textContent = overviewStatusLabels[index];
  });
  apply('[data-workspace-group="overview"] > .panel:last-child h2', "最近報告與用量", "Recent reports and usage");
  apply('[data-workspace-group="overview"] > .panel:last-child .panel-head p', "查看最近產出的報告、AI 用量與付款狀態。", "Review recent reports, AI usage, and payment status.");

  const manualButtons = $$('[data-manual-view]');
  const manualCopy = zh
    ? [["案件資料", "修正客戶、月份與報告條件"], ["資料來源", "檢查 CSV、Sheets 與原始數據"], ["隱私設定", "管理同意與稽核紀錄"]]
    : [["Case details", "Adjust client, month, and report settings"], ["Data sources", "Review CSV, Sheets, and source data"], ["Privacy", "Manage consent and audit records"]];
  manualButtons.forEach((button, index) => {
    if (!manualCopy[index]) return;
    const [title, copyText] = manualCopy[index];
    if (button.querySelector("span")) button.querySelector("span").textContent = title;
    if (button.querySelector("small")) button.querySelector("small").textContent = copyText;
  });

  apply('[data-workspace-group="case"] .panel:first-child h2', "案件設定", "Case settings");
  apply('[data-workspace-group="case"] .panel:first-child .panel-head p', "輸入一份月報所需的最少資料。", "Enter only the information required for a monthly report.");
  apply("#saveClientBtn", "建立案件", "Create case");
  apply('[data-workspace-group="case"] .panel:nth-child(2) h2', "客戶檔案", "Client records");
  apply('[data-workspace-group="case"] .panel:nth-child(2) .panel-head p', "目前案件與報告用量。", "Current cases and report usage.");
  optionText("#reportType", zh ? ["廣告月報", "SEO 月報", "社群月報"] : ["Advertising report", "SEO report", "Social report"]);
  optionText("#tone", zh ? ["高層摘要", "顧問式", "直接明確"] : ["Executive", "Consultative", "Direct"]);

  apply('[data-workspace-group="data"] .panel:nth-child(2) h2', "資料來源狀態", "Data source status");
  apply("#saveSourceBtn", "儲存資料來源", "Save data source");
  apply("#testSourceBtn", "測試來源", "Test source");
  apply("#insertCsvTemplateBtn", "貼上 CSV 範本", "Insert CSV template");
  apply("#downloadSampleBtn", "下載範例 CSV", "Download sample CSV");
  apply("#quickAdsBtn", "廣告範例", "Ads example");
  apply("#quickSeoBtn", "SEO 範例", "SEO example");
  apply("#quickSocialBtn", "社群範例", "Social example");

  apply('[data-workspace-group="report"] > .panel:first-child h2', "報告預覽", "Report preview");
  apply('[data-workspace-group="report"] > .panel:first-child .panel-head p', "把產出的月報獨立閱讀，確認摘要、圖表、KPI 與客戶說明稿。", "Review the report, summary, charts, KPIs, and client wording in one place.");
  const reportMetricLabels = zh ? ["報告月份", "報告狀態"] : ["Report month", "Report status"];
  $$(".report-preview-hub .metric-row > div > span").forEach((node, index) => {
    if (reportMetricLabels[index]) node.textContent = reportMetricLabels[index];
  });
  apply("#reportPreviewGenerateBtn", "產生 / 更新月報", "Generate / update report");
  apply("#reportPreviewJumpBtn", "查看完整報告", "View full report");
  apply('[data-workspace-group="report"] > .panel:nth-child(2) h2', "客戶可讀摘要", "Client-ready summary");
  apply('[data-workspace-group="report"] > .panel:nth-child(2) .panel-head p', "用簡短文字先講結論，再讓圖表與表格補充細節。", "Lead with the conclusion, then support it with charts and tables.");
  apply('[data-workspace-group="report"] > .panel:nth-child(3) h2', "交付檢查", "Delivery checklist");
  apply('[data-workspace-group="report"] > .panel:nth-child(3) .panel-head p', "每份月報都要回答客戶最常問的四件事。", "Answer the four questions clients ask most often.");

  apply('[data-workspace-group="ai"] > .panel:nth-child(2) h2', "AI 建議輸出", "AI recommendations");
  apply('[data-workspace-group="ai"] > .panel:nth-child(2) .panel-head p', "摘要、風險、行動與客戶說明稿分開檢查，方便直接交付。", "Review the summary, risks, actions, and client message before delivery.");
  const aiOutputLabels = zh ? ["摘要", "主要風險", "下月行動", "客戶說明稿"] : ["Summary", "Main risks", "Next actions", "Client message"];
  $$(".ai-output-block > span").forEach((node, index) => {
    if (aiOutputLabels[index]) node.textContent = aiOutputLabels[index];
  });
  apply('[data-workspace-group="ai"] > .panel:last-child .panel-head p', "用 AI 產出下一步與客戶回覆草稿。", "Use AI to draft next steps and a client response.");
  apply("#runBackendAiBtn", "執行 AI 分析", "Run AI analysis");
  apply("#runAutopilotBtn", "AI 解析需求", "Analyze requirements");
  optionText("#businessType", zh ? ["在地服務", "電商", "B2B"] : ["Local service", "E-commerce", "B2B"]);

  apply('[data-workspace-group="delivery"] > .panel:nth-child(2) h2', "報告資料庫", "Report library");
  apply('[data-workspace-group="delivery"] > .panel:nth-child(2) .panel-head p', "保存可重複交付的月報。", "Save reports for future review and delivery.");
  apply("#saveAccountBtn", "儲存帳戶", "Save account");
  apply("#createCheckoutBtn", "建立付款連結", "Create checkout link");
  optionText("#planSelect", zh ? ["入門版", "代理商版", "專業版"] : ["Starter", "Agency", "Professional"]);

  apply('[data-workspace-group="settings"] h2', "信任與設定", "Trust and settings");
  apply('[data-workspace-group="settings"] .panel-head p', "管理同意、稽核紀錄與本機資料。", "Manage consent, audit records, and local data.");
  const auditLabels = zh ? ["稽核紀錄", "狀態"] : ["Audit records", "Status"];
  $$('[data-workspace-group="settings"] .metric-row > div > span').forEach((node, index) => {
    if (auditLabels[index]) node.textContent = auditLabels[index];
  });
  apply("#refreshAuditBtn", "更新稽核", "Refresh audit");
  apply("#accountDataTitle", "帳號與資料", "Account and data");
  apply("#accountDataCopy", "下載帳號資料副本，或永久刪除帳號與此帳號建立的專案資料。", "Download a copy of your data or permanently delete the account and its workspace records.");
  apply("#exportAccountDataBtn", "下載我的資料", "Download my data");
  apply("#openDeleteAccountBtn", "刪除帳號", "Delete account");
  apply("#deleteAccountTitle", "永久刪除帳號", "Permanently delete account");
  apply("#deleteAccountCopy", "此操作無法復原。請輸入目前密碼，並在確認欄輸入 DELETE。", "This cannot be undone. Enter your current password and type DELETE in the confirmation field.");
  apply("#deletePasswordLabel", "目前密碼", "Current password");
  apply("#deleteConfirmationLabel", "確認文字", "Confirmation text");
  apply("#confirmDeleteAccountBtn", "永久刪除", "Delete permanently");
  apply("#cancelDeleteAccountBtn", "取消", "Cancel");

  apply("#reportCommandScoreLabel", "報告健康度", "Report health");
  apply("#reportCommandQualityLabel", "資料品質", "Data quality");
  apply("#reportCommandAiLabel", "AI 狀態", "AI status");
  apply("#reportCommandGeneratedLabel", "最後產生", "Last generated");
  apply(".executive-section h3", "執行摘要", "Executive summary");
  apply(".kpi-section h3", "關鍵績效指標總覽", "KPI overview");
  apply(".report-chart-heading h4", "數據趨勢與渠道表現", "Performance trends and channels");
  apply(".findings-section h3", "數據洞察與原因分析", "Findings and insights");
  apply(".action-section h3", "下月優化與行動計畫", "Next-month action plan");
  apply(".finding-card.positive > span", "表現亮點", "Highlights");
  apply(".finding-card.positive > h4", "為何表現良好", "Why performance improved");
  apply(".finding-card.warning > span", "關注項目", "Risks");
  apply(".finding-card.warning > h4", "為何需要改善", "Why performance needs work");
  const actionCards = $$(".action-plan-grid > article");
  const actionCopy = zh
    ? [["預算分配", "把資源放到有效渠道"], ["素材測試", "建立可驗證的創意假設"], ["執行清單", "下月具體行動"]]
    : [["Budget allocation", "Move resources to effective channels"], ["Creative testing", "Build testable creative hypotheses"], ["Execution checklist", "Concrete actions for next month"]];
  actionCards.forEach((card, index) => {
    if (!actionCopy[index]) return;
    card.querySelector("span").textContent = actionCopy[index][0];
    card.querySelector("h4").textContent = actionCopy[index][1];
  });

  $("#clientRequest")?.setAttribute("placeholder", zh ? "例如：想知道本月 CPA、ROAS、Google Ads 與 Meta 表現，並需要下月預算建議。" : "Example: Review CPA, ROAS, Google Ads, and Meta performance, then recommend next month's budget.");
  $("#aiIntakePrompt")?.setAttribute("placeholder", zh ? "貼上需求、CSV、Google Sheets 或資料網址..." : "Paste requirements, CSV, Google Sheets, or a data URL...");
  $("#authPassword")?.setAttribute("placeholder", zh ? "至少 10 個字元" : "At least 10 characters");
  $("#authResetPassword")?.setAttribute("placeholder", zh ? "至少 10 個字元" : "At least 10 characters");
  apply("#forgotPasswordBtn", "忘記密碼？", "Forgot password?");
  apply("#resendVerificationBtn", "重新寄送驗證信", "Resend verification email");
  apply("#authLegalConsentCopy", "建立帳號即表示我同意", "By creating an account, I agree to the");
  apply("#authLegalLink", "服務條款與隱私政策", "Terms and Privacy Policy");
  $("#authLegalLink")?.setAttribute("href", state.lang === "en" ? "/legal?lang=en" : "/legal");
  $("#closeAuthBtn")?.setAttribute("aria-label", zh ? "關閉" : "Close");
  $("#upgradeCloseBtn")?.setAttribute("aria-label", zh ? "關閉" : "Close");
  apply("#closeLegalBtn", "關閉", "Close");
  apply("#resetPasswordBtn", "更新密碼", "Update password");
}

function applyTheme(theme = state.theme) {
  state.theme = theme === "light" ? "light" : "dark";
  localStorage.setItem("agencyReportTheme", state.theme);
  document.documentElement.classList.toggle("theme-light", state.theme === "light");
  document.documentElement.classList.toggle("theme-dark", state.theme !== "light");
  setText("#dockThemeLabel", state.lang === "en" ? (state.theme === "light" ? "Dark background" : "Light background") : (state.theme === "light" ? "切換深色" : "切換淺色"));
  if (state.metrics) drawCharts();
}

function syncDockLanguageLabels() {
  const zh = state.lang !== "en";
  setText("#dockProfileLabel", zh ? "帳戶與隱私" : "Account & privacy");
  setText("#dockUsageLabel", zh ? "剩餘用量" : "Remaining usage");
  setText("#dockUpgradeLabel", zh ? "目前方案" : "Current plan");
  setText("#dockInviteLabel", zh ? "邀請好友" : "Invite");
  setText("#dockLogoutLabel", zh ? "登出" : "Sign out");
  setText("#billingPlanLabel", zh ? "目前方案" : "Current plan");
  setText("#usageTitle", zh ? "AI 月報用量" : "AI report usage");
  setText("#usagePlanLabel", zh ? "方案" : "Plan");
  setText("#usageRemainingLabel", zh ? "剩餘" : "Remaining");
  applyTheme(state.theme);
}

function setAuthState(auth) {
  state.auth = auth;
  if (auth?.token) localStorage.setItem("agencyReportAuthToken", auth.token);
  else if (auth) localStorage.removeItem("agencyReportAuthToken");
  const isAuthed = Boolean(state.auth);
  loadScopedWorkspaceState();
  document.documentElement.classList.toggle("public-landing", !isAuthed);
  $("#overviewHome").hidden = isAuthed;
  $("#caseWorkspace").hidden = !isAuthed;
  $("#report").hidden = !isAuthed;
  $("#logoutBtn").hidden = !isAuthed;
  $("#authGate").hidden = true;
  if (isAuthed) {
    openWorkspace("overview");
    refreshUsage();
    syncReportsFromServer();
    renderWorkspace();
  }
}

function scopedWorkspaceKey(base, userId = state.auth?.user?.id) {
  return `${base}:${userId || "guest"}`;
}

function readScopedWorkspaceList(base) {
  try {
    const value = JSON.parse(localStorage.getItem(scopedWorkspaceKey(base)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadScopedWorkspaceState() {
  state.clients = readScopedWorkspaceList("agencyReportClients");
  state.deliveries = readScopedWorkspaceList("agencyReportDeliveries");
  state.invoices = readScopedWorkspaceList("agencyReportInvoices");
}

function clearCurrentAccountCache(userId = state.auth?.user?.id) {
  ["agencyReportClients", "agencyReportDeliveries", "agencyReportInvoices"].forEach((base) => {
    localStorage.removeItem(`${base}:${userId || "guest"}`);
    localStorage.removeItem(base);
  });
  if (userId) localStorage.removeItem(`agencyReportReports:${userId}`);
}

function reportCacheKey() {
  return state.auth?.user?.id ? `agencyReportReports:${state.auth.user.id}` : "agencyReportReports:guest";
}

function cacheReports() {
  localStorage.setItem(reportCacheKey(), JSON.stringify(state.reports));
}

async function syncReportsFromServer() {
  if (!authToken()) return;
  try {
    const items = await api("/api/reports");
    state.reports = Array.isArray(items) ? items : [];
    cacheReports();
  } catch {
    state.reports = JSON.parse(localStorage.getItem(reportCacheKey()) || "[]");
  }
  renderWorkspace();
}

function showAuthGate() {
  $("#authGate").hidden = false;
  $("#authEmail")?.focus();
}

function hideAuthGate() {
  $("#authGate").hidden = true;
}

async function submitAuth(event) {
  event.preventDefault();
  const payload = {
    name: $("#authName").value.trim(),
    email: $("#authEmail").value.trim(),
    password: $("#authPassword").value,
  };
  try {
    const auth = await api("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
    setStatus("#authStatus", "ok", state.lang === "en" ? "Signed in" : "已登入", auth.user?.email || payload.email);
    setAuthState(auth);
  } catch (error) {
    $("#resendVerificationBtn").hidden = error.code !== "EMAIL_NOT_VERIFIED";
    setStatus("#authStatus", "error", state.lang === "en" ? "Sign in failed" : "登入失敗", error.message);
  }
}

async function registerAuth() {
  if (!$("#authLegalConsent")?.checked) {
    return setStatus(
      "#authStatus",
      "warning",
      state.lang === "en" ? "Terms acceptance required" : "請先同意服務條款",
      state.lang === "en" ? "Read and accept the Terms and Privacy Policy before creating an account." : "建立帳號前請閱讀並勾選服務條款與隱私政策。"
    );
  }
  try {
    const legal = await api("/api/legal", { method: "GET" });
    const payload = {
      name: $("#authName").value.trim() || "AgencyReport AI",
      email: $("#authEmail").value.trim(),
      password: $("#authPassword").value,
      legalAccepted: true,
      legalVersion: legal.version,
    };
    const auth = await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
    $("#resendVerificationBtn").hidden = false;
    setStatus("#authStatus", "ok", state.lang === "en" ? "Check your email" : "請前往信箱完成驗證", auth.emailSent ? (state.lang === "en" ? "The verification link is valid for 24 hours." : "驗證連結將於 24 小時後失效。") : (state.lang === "en" ? "The account was created, but email delivery is not ready. Try resend after email setup." : "帳號已建立，但驗證信尚未成功寄出；完成寄件設定後可重新寄送。"));
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Registration failed" : "建立帳號失敗", error.message);
  }
}

async function resendVerificationEmail() {
  const email = $("#authEmail").value.trim();
  if (!email) return setStatus("#authStatus", "warning", state.lang === "en" ? "Enter your email" : "請先輸入 Email");
  try {
    await api("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
    setStatus("#authStatus", "ok", state.lang === "en" ? "Verification email requested" : "已重新申請驗證信", state.lang === "en" ? "Check your inbox and spam folder." : "請檢查收件匣與垃圾郵件匣。" );
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Unable to resend" : "無法重新寄送", error.message);
  }
}

async function requestPasswordReset() {
  const email = $("#authEmail").value.trim();
  if (!email) return setStatus("#authStatus", "warning", state.lang === "en" ? "Enter your email" : "請先輸入 Email");
  try {
    await api("/api/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) });
    setStatus("#authStatus", "ok", state.lang === "en" ? "Reset email requested" : "已申請密碼重設信", state.lang === "en" ? "If the account exists, a reset link will arrive shortly." : "若帳號存在，重設連結將寄至該信箱。" );
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Reset request failed" : "申請重設失敗", error.message);
  }
}

async function completePasswordReset() {
  const token = $("#authResetPanel").dataset.token || "";
  const password = $("#authResetPassword").value;
  try {
    await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
    $("#authResetPanel").hidden = true;
    setStatus("#authStatus", "ok", state.lang === "en" ? "Password updated" : "密碼已更新", state.lang === "en" ? "Sign in with your new password." : "請使用新密碼登入。" );
    history.replaceState({}, "", location.pathname);
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Password reset failed" : "密碼更新失敗", error.message);
  }
}

async function processAuthActionLinks() {
  const params = new URLSearchParams(location.search);
  const verificationToken = params.get("verify_email");
  const resetToken = params.get("reset_password");
  if (verificationToken) {
    showAuthGate();
    try {
      await api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: verificationToken }) });
      setStatus("#authStatus", "ok", state.lang === "en" ? "Email verified" : "Email 驗證完成", state.lang === "en" ? "You can now sign in." : "現在可以登入工作台。" );
      $("#resendVerificationBtn").hidden = true;
    } catch (error) {
      setStatus("#authStatus", "error", state.lang === "en" ? "Verification failed" : "驗證失敗", error.message);
    }
    history.replaceState({}, "", location.pathname);
  }
  if (resetToken) {
    showAuthGate();
    $("#authResetPanel").hidden = false;
    $("#authResetPanel").dataset.token = resetToken;
    $("#authResetPassword").focus();
    setStatus("#authStatus", "ok", state.lang === "en" ? "Choose a new password" : "請設定新密碼", state.lang === "en" ? "Use at least 10 characters." : "密碼至少需要 10 個字元。" );
  }
}

async function logoutAuth() {
  try { await api("/api/auth/logout", { method: "POST", body: "{}" }); } catch {}
  localStorage.removeItem("agencyReportAuthToken");
  state.auth = null;
  state.reports = [];
  state.clients = [];
  state.deliveries = [];
  state.invoices = [];
  $("#overviewHome").hidden = false;
  $("#caseWorkspace").hidden = true;
  $("#report").hidden = true;
  $("#landingLoginBtn").hidden = false;
  $("#landingStartBtn").hidden = false;
  $("#logoutBtn").hidden = true;
  document.documentElement.classList.add("public-landing");
}

async function exportAccountData() {
  try {
    const exported = await api("/api/account/export", { method: "GET" });
    const blob = new Blob([`${JSON.stringify(exported, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agencyreport-account-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(
      "#accountDataStatus",
      "ok",
      state.lang === "en" ? "Data export ready" : "資料匯出完成",
      state.lang === "en" ? "The JSON file contains this account's profile and workspace records." : "JSON 檔案包含此帳號的個人資料與工作區紀錄。"
    );
  } catch (error) {
    setStatus("#accountDataStatus", "error", state.lang === "en" ? "Export failed" : "匯出失敗", error.message);
  }
}

function toggleDeleteAccountPanel(show) {
  const panel = $("#deleteAccountPanel");
  if (!panel) return;
  panel.hidden = !show;
  if (show) $("#deleteAccountPassword")?.focus();
  else {
    $("#deleteAccountPassword").value = "";
    $("#deleteAccountConfirmation").value = "";
  }
}

async function deleteCurrentAccount() {
  const password = $("#deleteAccountPassword").value;
  const confirmation = $("#deleteAccountConfirmation").value.trim();
  if (!password || confirmation !== "DELETE") {
    return setStatus(
      "#accountDataStatus",
      "warning",
      state.lang === "en" ? "Confirmation required" : "需要再次確認",
      state.lang === "en" ? "Enter your current password and type DELETE exactly." : "請輸入目前密碼，並完整輸入 DELETE。"
    );
  }
  const userId = state.auth?.user?.id;
  try {
    await api("/api/account", { method: "DELETE", body: JSON.stringify({ password, confirmation }) });
    clearCurrentAccountCache(userId);
    localStorage.removeItem("agencyReportAuthToken");
    state.auth = null;
    state.reports = [];
    state.clients = [];
    state.deliveries = [];
    state.invoices = [];
    toggleDeleteAccountPanel(false);
    returnToLandingHome();
    showAuthGate();
    setStatus(
      "#authStatus",
      "ok",
      state.lang === "en" ? "Account deleted" : "帳號已刪除",
      state.lang === "en" ? "Your account and linked workspace data were permanently removed." : "帳號與其工作區關聯資料已永久移除。"
    );
  } catch (error) {
    setStatus("#accountDataStatus", "error", state.lang === "en" ? "Deletion failed" : "刪除失敗", error.message);
  }
}

function setStatus(selector, type, title, body = "") {
  const node = $(selector);
  if (!node) return;
  node.className = `status-panel ${type || ""}`.trim();
  node.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = title;
  node.appendChild(heading);
  if (body) {
    const detail = document.createElement("span");
    detail.textContent = body;
    node.appendChild(detail);
  }
}

function renderSafePointList(selector, items, label) {
  const node = $(selector);
  if (!node) return;
  node.replaceChildren();
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const row = document.createElement("div");
    const badge = document.createElement("span");
    badge.textContent = label || String(index + 1).padStart(2, "0");
    const content = document.createElement("strong");
    content.textContent = String(item || "");
    row.append(badge, content);
    node.appendChild(row);
  });
}

function openWorkspace(view) {
  const allowed = new Set(["overview", "case", "data", "report", "ai", "delivery", "billing", "settings"]);
  const current = allowed.has(view) ? view : "overview";
  $$("[data-workspace-view]").forEach((button) => button.classList.toggle("active", button.dataset.workspaceView === current));
  $$("[data-workspace-group]").forEach((section) => { section.hidden = section.dataset.workspaceGroup !== current; });
  if ($("#report")) $("#report").hidden = current !== "report";
  const info = {
    overview: ["01 / 07", state.lang === "en" ? "AI import assistant" : "AI 匯入助手", state.lang === "en" ? "Drop in files, CSV data, or a URL and let AI prepare the project." : "放入檔案、CSV 或網址，讓 AI 自動整理並帶入專案。"],
    case: ["02 / 07", state.lang === "en" ? "Case details" : "案件資料", state.lang === "en" ? "Only keep the fields needed to generate a monthly report." : "只保留產生月報必要欄位。"],
    data: ["03 / 07", state.lang === "en" ? "Data review" : "資料檢查", state.lang === "en" ? "Paste CSV, connect Sheets, or load demo data and check quality." : "匯入 CSV / Sheets / Demo，並檢查資料品質。"],
    report: ["04 / 07", state.lang === "en" ? "Report results" : "報告結果", state.lang === "en" ? "Read the monthly report as a client-facing deliverable." : "把月報產物獨立成可閱讀的客戶報告。"],
    ai: ["05 / 07", state.lang === "en" ? "AI advice" : "AI 建議", state.lang === "en" ? "Review summary, risks, next actions, and client wording." : "查看摘要、風險、下月行動與客戶說明稿。"],
    delivery: ["06 / 07", state.lang === "en" ? "Deliver report" : "交付報告", state.lang === "en" ? "Prepare email drafts, export files, and track payment." : "準備 Email 草稿、匯出檔案並追蹤付款。"],
    billing: ["07 / 08", state.lang === "en" ? "Usage plan" : "用量方案", state.lang === "en" ? "Manage plan, checkout drafts, invoices, and AI usage." : "管理方案、付款草稿、發票與 AI 用量。"],
    settings: ["07 / 07", state.lang === "en" ? "Privacy settings" : "隱私設定", state.lang === "en" ? "Manage consent and audit notes." : "管理同意與稽核紀錄。"],
  }[current];
  setText("#viewMastheadStep", info[0]);
  setText("#viewMastheadTitle", info[1]);
  setText("#viewMastheadCopy", info[2]);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => {
      const raw = (values[index] || "").trim();
      return [header, Number(raw) || raw];
    }));
  }).filter((row) => row.channel);
}

function calculateMetrics(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.spend += Number(row.spend) || 0;
    acc.impressions += Number(row.impressions) || 0;
    acc.clicks += Number(row.clicks) || 0;
    acc.conversions += Number(row.conversions) || 0;
    acc.revenue += Number(row.revenue) || 0;
    acc.lastRevenue += Number(row.last_revenue) || 0;
    return acc;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, lastRevenue: 0 });
  const channels = rows.map((row) => ({
    ...row,
    roas: (Number(row.revenue) || 0) / Math.max(Number(row.spend) || 0, 1),
    cpa: (Number(row.spend) || 0) / Math.max(Number(row.conversions) || 0, 1),
  })).sort((a, b) => b.roas - a.roas);
  return {
    totals,
    channels,
    roas: totals.revenue / Math.max(totals.spend, 1),
    cpa: totals.spend / Math.max(totals.conversions, 1),
    ctr: totals.clicks / Math.max(totals.impressions, 1),
    conversionRate: totals.conversions / Math.max(totals.clicks, 1),
    revenueGrowth: totals.lastRevenue ? (totals.revenue - totals.lastRevenue) / totals.lastRevenue : 0,
    best: channels[0],
    worst: channels[channels.length - 1],
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW", {
    style: "currency",
    currency: $("#currency")?.value || "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW", { style: "percent", maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function buildRuleDraft(metrics = state.metrics) {
  if (!metrics) return null;
  const zh = state.lang !== "en";
  return {
    summary: zh
      ? `本月整體 ROAS 為 ${metrics.roas.toFixed(2)}x，營收 ${formatMoney(metrics.totals.revenue)}，最佳渠道是 ${metrics.best.channel}。`
      : `Overall ROAS is ${metrics.roas.toFixed(2)}x with ${formatMoney(metrics.totals.revenue)} revenue. Best channel: ${metrics.best.channel}.`,
    risks: [
      zh ? `${metrics.worst.channel} ROAS 較低，需檢查受眾、素材或關鍵字。` : `${metrics.worst.channel} has the weakest ROAS; review audience, creative, or keywords.`,
      zh ? `CPA 目前為 ${formatMoney(metrics.cpa)}，下月需持續控管。` : `CPA is ${formatMoney(metrics.cpa)} and needs monitoring next month.`,
    ],
    actions: [
      zh ? `將 10-15% 預算移往 ${metrics.best.channel}。` : `Move 10-15% budget toward ${metrics.best.channel}.`,
      zh ? `暫停或重建 ${metrics.worst.channel} 的低效投放組合。` : `Pause or rebuild weak campaigns in ${metrics.worst.channel}.`,
      zh ? "更新登陸頁 CTA，讓高意圖流量更容易轉換。" : "Refresh landing page CTAs to convert high-intent traffic.",
    ],
    clientMessage: zh
      ? `本月主要成長來自 ${metrics.best.channel}，下月會優先擴大有效渠道並修正低效來源。`
      : `Growth came mainly from ${metrics.best.channel}. Next month we will scale what works and fix weak sources.`,
  };
}

async function runBackendAi() {
  if (!state.metrics) generateReport();
  if (!state.metrics) return;
  setStatus("#aiReportStatus", "", state.lang === "en" ? "Running AI..." : "AI 分析中...");
  try {
    const payload = {
      clientName: $("#clientName").value,
      agencyName: $("#agencyName").value,
      reportMonth: $("#reportMonth").value,
      reportType: $("#reportType").value,
      clientRequest: $("#clientRequest").value,
      metrics: state.metrics,
      channels: state.metrics.channels,
    };
    const result = await api("/api/report/run", { method: "POST", body: JSON.stringify(payload) });
    state.ai = {
      summary: result.executiveSummary || result.summary || buildRuleDraft().summary,
      risks: result.risks || result.riskAlerts || buildRuleDraft().risks,
      actions: result.recommendations || result.nextActions || buildRuleDraft().actions,
      clientMessage: result.clientMessage || result.clientReplyDraft || buildRuleDraft().clientMessage,
    };
    state.usage = result.usage || state.usage;
    renderAi();
    updateUsageUi();
    setStatus("#aiReportStatus", "ok", state.lang === "en" ? "AI draft ready" : "AI 草稿已完成", state.ai.clientMessage);
  } catch (error) {
    if (isLimitExceededError(error)) {
      openLimitExceededUpgrade(error);
      return;
    }
    state.ai = buildRuleDraft();
    renderAi();
    setStatus("#aiReportStatus", "error", state.lang === "en" ? "AI failed; rule fallback used" : "AI 失敗，已使用規則型備援", error.message);
  }
}

function generateReport() {
  const rows = parseCsv($("#csvInput").value || "");
  if (!rows.length) {
    setStatus("#dataStatus", "error", state.lang === "en" ? "No CSV data" : "尚未匯入 CSV", state.lang === "en" ? "Paste sample data first." : "請先貼上範例資料。");
    return;
  }
  state.rows = rows;
  state.metrics = calculateMetrics(rows);
  state.ai = state.ai || buildRuleDraft(state.metrics);
  renderReport();
  renderAi();
  renderWorkspace();
  $("#report").hidden = false;
  setStatus("#dataStatus", "ok", state.lang === "en" ? "Report generated" : "月報已產生", `${rows.length} channels`);
  setText("#reportCommandGenerated", new Date().toLocaleString(state.lang === "en" ? "en-US" : "zh-TW"));
}

async function generateReportFromButton() {
  generateReport();
  await runBackendAi();
}

async function runWorkspacePrimaryAction(event) {
  const target = event?.currentTarget?.dataset.workspaceTarget || "data";
  if (target === "report") {
    if (!state.metrics) await generateReportFromButton();
    openWorkspace("report");
    if (state.metrics) $("#report")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (target === "ai") {
    openWorkspace("ai");
    if (!state.ai && state.metrics) await runBackendAi();
    return;
  }
  openWorkspace(target);
}

function renderReport() {
  const m = state.metrics;
  if (!m) return;
  setText("#coverAgency", $("#agencyName").value || "AgencyReport AI");
  setText("#coverTitle", `${$("#clientName").value || "Demo Client"} ${$("#reportType").selectedOptions[0]?.textContent || "月報"}`);
  setText("#coverMonth", $("#reportMonth").value || "-");
  setText("#qualityPill", `${Math.round(Math.min(m.roas / 5, 1) * 100)}%`);
  setText("#scoreLabel", `${Math.round(Math.min(m.roas / 5, 1) * 100)}%`);
  setText("#reportCommandQuality", state.lang === "en" ? "Ready" : "已就緒");
  const cpc = m.totals.spend / Math.max(m.totals.clicks, 1);
  const cards = [
    [state.lang === "en" ? "Revenue" : "總營收", formatMoney(m.totals.revenue), state.lang === "en" ? "Business result" : "整體成果"],
    [state.lang === "en" ? "Ad spend" : "廣告花費", formatMoney(m.totals.spend), state.lang === "en" ? "Media investment" : "媒體投入"],
    ["ROAS", `${m.roas.toFixed(2)}x`, state.lang === "en" ? "Return on ad spend" : "廣告投資報酬"],
    ["CPA", formatMoney(m.cpa), state.lang === "en" ? "Cost per conversion" : "單次轉換成本"],
    [state.lang === "en" ? "Impressions" : "總曝光", new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW").format(m.totals.impressions), state.lang === "en" ? "Traffic scale" : "流量規模"],
    [state.lang === "en" ? "Clicks" : "總點擊", new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW").format(m.totals.clicks), state.lang === "en" ? "Traffic response" : "流量反應"],
    ["CTR", formatPercent(m.ctr), state.lang === "en" ? "Click-through rate" : "點擊率"],
    [state.lang === "en" ? "Conversions" : "轉換數", new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW").format(m.totals.conversions), state.lang === "en" ? "Completed outcomes" : "完成目標"],
    ["CVR", formatPercent(m.conversionRate), state.lang === "en" ? "Conversion rate" : "轉換率"],
    ["CPC", formatMoney(cpc), state.lang === "en" ? "Cost per click" : "單次點擊成本"],
  ];
  $("#insights").innerHTML = cards.map(([label, value, note]) => `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  const topRevenue = [...m.channels].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0];
  const lowestCpa = [...m.channels].sort((a, b) => Number(a.cpa || 0) - Number(b.cpa || 0))[0];
  $("#detailTable").innerHTML = `
    <thead><tr><th>Channel</th><th>Spend</th><th>Revenue</th><th>Conversions</th><th>ROAS</th><th>CPA</th><th>Decision</th></tr></thead>
    <tbody>${m.channels.map((row) => {
      const isBestRoas = row.channel === m.best?.channel;
      const isWeakRoas = row.channel === m.worst?.channel;
      const isTopRevenue = row.channel === topRevenue?.channel;
      const isLowestCpa = row.channel === lowestCpa?.channel;
      const decision = isBestRoas
        ? (state.lang === "en" ? "Scale" : "擴大")
        : isWeakRoas
          ? (state.lang === "en" ? "Fix" : "修正")
          : (state.lang === "en" ? "Monitor" : "觀察");
      return `<tr class="${isWeakRoas ? "is-weak" : ""}">
        <td><strong>${escapeLibraryText(row.channel)}</strong>${isBestRoas ? `<span class="table-badge good">${state.lang === "en" ? "Best ROAS" : "最佳 ROAS"}</span>` : ""}</td>
        <td class="num">${formatMoney(row.spend)}</td>
        <td class="num ${isTopRevenue ? "is-best" : ""}">${formatMoney(row.revenue)}</td>
        <td class="num">${row.conversions}</td>
        <td class="num ${isBestRoas ? "is-best" : isWeakRoas ? "is-warn" : ""}">${row.roas.toFixed(2)}x</td>
        <td class="num ${isLowestCpa ? "is-best" : ""}">${formatMoney(row.cpa)}</td>
        <td><span class="table-badge ${isWeakRoas ? "warn" : isBestRoas ? "good" : ""}">${decision}</span></td>
      </tr>`;
    }).join("")}</tbody>`;
  renderChartInsights(m);
  renderProfessionalNarrative(m);
  drawCharts();
}

function renderProfessionalNarrative(m) {
  if (!m) return;
  const zh = state.lang !== "en";
  const draft = state.ai || buildRuleDraft(m);
  const cpc = m.totals.spend / Math.max(m.totals.clicks, 1);
  const executive = $("#executiveSummaryText");
  if (executive) {
    executive.innerHTML = "";
    [
      draft.summary,
      zh
        ? `本月共帶來 ${new Intl.NumberFormat("zh-TW").format(m.totals.conversions)} 次轉換，CTR 為 ${formatPercent(m.ctr)}、CVR 為 ${formatPercent(m.conversionRate)}。最大亮點為 ${m.best?.channel || "-"}，主要挑戰則集中在 ${m.worst?.channel || "-"} 的投放效率。`
        : `The campaign generated ${new Intl.NumberFormat("en-US").format(m.totals.conversions)} conversions with ${formatPercent(m.ctr)} CTR and ${formatPercent(m.conversionRate)} CVR. The strongest result came from ${m.best?.channel || "-"}, while ${m.worst?.channel || "-"} needs the most attention.`,
    ].forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      executive.appendChild(paragraph);
    });
  }

  const highlights = $("#executiveHighlights");
  if (highlights) {
    highlights.innerHTML = "";
    [
      [zh ? "核心成果" : "Core result", `${formatMoney(m.totals.revenue)} / ROAS ${m.roas.toFixed(2)}x`, "good"],
      [zh ? "最大亮點" : "Top highlight", `${m.best?.channel || "-"} ROAS ${m.best ? m.best.roas.toFixed(2) : "0.00"}x`, "good"],
      [zh ? "關注挑戰" : "Key challenge", `${m.worst?.channel || "-"} ROAS ${m.worst ? m.worst.roas.toFixed(2) : "0.00"}x`, "warn"],
    ].forEach(([label, value, tone]) => {
      const card = document.createElement("div");
      card.className = tone;
      const caption = document.createElement("span");
      caption.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      card.append(caption, strong);
      highlights.appendChild(card);
    });
  }

  const renderPoints = (selector, items) => {
    const node = $(selector);
    if (!node) return;
    node.innerHTML = "";
    items.filter(Boolean).forEach((item, index) => {
      const row = document.createElement("div");
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("p");
      copy.textContent = item;
      row.append(number, copy);
      node.appendChild(row);
    });
  };

  renderPoints("#positiveFindings", [
    zh
      ? `${m.best?.channel || "-"} 以 ${m.best ? m.best.roas.toFixed(2) : "0.00"}x ROAS 領先，代表目前預算與受眾組合具放大價值。`
      : `${m.best?.channel || "-"} leads at ${m.best ? m.best.roas.toFixed(2) : "0.00"}x ROAS, indicating room to scale the current budget and audience mix.`,
    m.revenueGrowth >= 0
      ? (zh ? `營收較前期成長 ${formatPercent(m.revenueGrowth)}，主要成效可能來自高效率渠道貢獻，建議以活動與素材紀錄進一步驗證。` : `Revenue grew ${formatPercent(m.revenueGrowth)}. High-efficiency channels are the likely driver; validate this against campaign and creative logs.`)
      : (zh ? `目前 CTR 為 ${formatPercent(m.ctr)}、CPC 為 ${formatMoney(cpc)}，可作為下月素材吸引力與流量成本基準。` : `CTR is ${formatPercent(m.ctr)} with ${formatMoney(cpc)} CPC, providing a baseline for next month's creative and traffic efficiency.`),
  ]);
  renderPoints("#riskList", draft.risks);
  renderPoints("#budgetPlan", [
    zh ? `將 10-15% 預算由 ${m.worst?.channel || "低效渠道"} 移往 ${m.best?.channel || "高效渠道"}，並以一週為觀察週期。` : `Move 10-15% of budget from ${m.worst?.channel || "the weakest channel"} to ${m.best?.channel || "the strongest channel"} and review weekly.`,
    zh ? `設定 ROAS ${Math.max(2, m.roas * 0.8).toFixed(2)}x 與 CPA ${formatMoney(m.cpa)} 為調整警戒線，避免只追求量體。` : `Use ${Math.max(2, m.roas * 0.8).toFixed(2)}x ROAS and ${formatMoney(m.cpa)} CPA as guardrails to protect efficiency.`,
  ]);
  renderPoints("#creativePlan", [
    zh ? "針對最佳渠道延伸 2-3 組同概念素材，分別測試利益點、信任證明與明確 CTA。" : "Extend the winning channel with 2-3 creative variants testing benefit, proof, and a clear CTA.",
    zh ? `為 ${m.worst?.channel || "低效渠道"} 建立新受眾或關鍵字組合，避免只更換圖片而未修正流量品質。` : `Build a new audience or keyword set for ${m.worst?.channel || "the weakest channel"} instead of changing visuals alone.`,
  ]);
  renderPoints("#recommendations", draft.actions);
}

function renderChartInsights(m) {
  const zh = state.lang !== "en";
  const channelCount = m.channels.length;
  const topRevenue = [...m.channels].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0] || m.best;
  const totalRevenue = Math.max(Number(m.totals.revenue) || 0, 1);
  const topShare = topRevenue ? Number(topRevenue.revenue || 0) / totalRevenue : 0;
  const roasDecision = m.roas >= 3
    ? (zh ? "可放大投放" : "Ready to scale")
    : m.roas >= 1.8
      ? (zh ? "先優化再放大" : "Optimize first")
      : (zh ? "需修正預算" : "Fix budget");
  const funnelDecision = m.conversionRate >= 0.035
    ? (zh ? "轉換健康" : "Healthy conversion")
    : m.ctr >= 0.02
      ? (zh ? "優先查落地頁" : "Check landing page")
      : (zh ? "優先查素材" : "Check creatives");
  const stat = (label, value, tone = "", hint = "") => `<div class="${tone}"><span>${escapeLibraryText(label)}</span><strong>${escapeLibraryText(value)}</strong>${hint ? `<em>${escapeLibraryText(hint)}</em>` : ""}</div>`;
  const setStats = (selector, items) => {
    const node = $(selector);
    if (node) node.innerHTML = items.join("");
  };

  setStats("#trendChartStats", [
    stat(zh ? "本月營收" : "Revenue", formatMoney(m.totals.revenue), "good", zh ? "客戶最關心" : "Client-facing"),
    stat(zh ? "廣告花費" : "Spend", formatMoney(m.totals.spend), "", zh ? "需搭配 ROAS" : "Pair with ROAS"),
    stat(zh ? "營收成長" : "Growth", formatPercent(m.revenueGrowth), m.revenueGrowth >= 0 ? "good" : "warn", zh ? "與上期比較" : "Vs previous"),
    stat(zh ? "下一步" : "Next step", m.revenueGrowth >= 0 ? (zh ? "保留主力渠道" : "Keep winners") : (zh ? "檢查下滑渠道" : "Find decline"), m.revenueGrowth >= 0 ? "good" : "warn"),
  ]);
  setStats("#revenueChartStats", [
    stat(zh ? "最高營收渠道" : "Top channel", topRevenue?.channel || "-", "good", zh ? "優先保護" : "Protect first"),
    stat(zh ? "占總營收" : "Share", formatPercent(topShare), topShare >= 0.5 ? "warn" : "good", topShare >= 0.5 ? (zh ? "集中度偏高" : "High dependency") : (zh ? "分布較穩" : "Balanced")),
    stat(zh ? "渠道數" : "Channels", String(channelCount), "", zh ? "本月有數據" : "With data"),
    stat(zh ? "下一步" : "Next step", topShare >= 0.5 ? (zh ? "降低單點風險" : "Reduce risk") : (zh ? "複製成功模式" : "Clone winner"), topShare >= 0.5 ? "warn" : "good"),
  ]);
  setStats("#roasChartStats", [
    stat(zh ? "整體 ROAS" : "Overall ROAS", `${m.roas.toFixed(2)}x`, m.roas >= 3 ? "good" : "warn", roasDecision),
    stat(zh ? "最佳渠道" : "Best", `${m.best?.channel || "-"} ${m.best ? m.best.roas.toFixed(2) : "0.00"}x`, "good", zh ? "可測試加碼" : "Test scale"),
    stat(zh ? "需改善" : "Needs work", `${m.worst?.channel || "-"} ${m.worst ? m.worst.roas.toFixed(2) : "0.00"}x`, "warn", zh ? "先降預算" : "Reduce first"),
    stat(zh ? "下一步" : "Next step", zh ? "預算重分配" : "Reallocate", m.roas >= 3 ? "good" : "warn"),
  ]);
  setStats("#funnelChartStats", [
    stat(zh ? "曝光" : "Impressions", new Intl.NumberFormat(state.lang === "en" ? "en-US" : "zh-TW").format(m.totals.impressions), "", zh ? "流量規模" : "Traffic size"),
    stat(zh ? "點擊率" : "CTR", formatPercent(m.ctr), m.ctr >= 0.02 ? "good" : "warn", zh ? "素材吸引力" : "Creative pull"),
    stat(zh ? "轉換率" : "CVR", formatPercent(m.conversionRate), m.conversionRate >= 0.035 ? "good" : "warn", zh ? "頁面/表單效率" : "Page efficiency"),
    stat(zh ? "判讀" : "Decision", funnelDecision, m.conversionRate >= 0.035 ? "good" : "warn"),
  ]);

  setText("#trendChartNote", zh
    ? `本月營收 ${formatMoney(m.totals.revenue)}，相較前期 ${m.revenueGrowth >= 0 ? "成長" : "下滑"} ${formatPercent(Math.abs(m.revenueGrowth))}，建議同步檢查花費是否跟著效率提升。`
    : `Revenue reached ${formatMoney(m.totals.revenue)}, ${m.revenueGrowth >= 0 ? "up" : "down"} ${formatPercent(Math.abs(m.revenueGrowth))}; compare spend efficiency before scaling.`);
  setText("#revenueChartNote", zh
    ? `${topRevenue?.channel || "-"} 貢獻 ${formatPercent(topShare)} 營收，是本月最需要優先維持品質與預算的渠道。`
    : `${topRevenue?.channel || "-"} contributes ${formatPercent(topShare)} of revenue and should be protected before scaling other channels.`);
  setText("#roasChartNote", zh
    ? `最佳渠道為 ${m.best?.channel || "-"}，最弱渠道為 ${m.worst?.channel || "-"}；下月可把 10-15% 預算從低效來源移往高 ROAS 來源。`
    : `Best channel: ${m.best?.channel || "-"}; weakest: ${m.worst?.channel || "-"}. Move 10-15% budget toward higher ROAS sources next month.`);
  setText("#funnelChartNote", zh
    ? `目前 CTR ${formatPercent(m.ctr)}、轉換率 ${formatPercent(m.conversionRate)}，若點擊足夠但轉換不足，優先檢查落地頁與表單阻力。`
    : `CTR is ${formatPercent(m.ctr)} and CVR is ${formatPercent(m.conversionRate)}. If clicks are healthy but conversions lag, inspect landing page friction first.`);
}

function renderAi() {
  const draft = state.ai || buildRuleDraft();
  if (!draft) return;
  const zh = state.lang !== "en";
  renderSafePointList("#riskList", draft.risks, zh ? "風險" : "Risk");
  renderSafePointList("#recommendations", draft.actions, zh ? "行動" : "Action");
  const workOrder = $("#aiWorkOrder");
  if (workOrder) {
    workOrder.replaceChildren();
    [
      [zh ? "輸入資料" : "Input data", $("#clientRequest").value || (zh ? "尚未填寫客戶需求，會先使用 KPI 與渠道資料產生建議。" : "No client request yet. KPI and channel data will be used first.")],
      [zh ? "AI 任務" : "AI task", zh ? "根據需求、KPI、最佳/最弱渠道，產生摘要、風險、下月行動與客戶說明稿。" : "Use goals, KPI, best/worst channels to produce summary, risks, next actions, and client wording."],
    ].forEach(([label, content]) => {
      const article = document.createElement("article");
      const caption = document.createElement("span");
      const paragraph = document.createElement("p");
      caption.textContent = label;
      paragraph.textContent = content;
      article.append(caption, paragraph);
      workOrder.appendChild(article);
    });
  }
  setText("#aiSummaryOutput", draft.summary);
  const riskOutput = $("#aiRiskOutput");
  if (riskOutput) renderSafePointList("#aiRiskOutput", draft.risks);
  const actionOutput = $("#aiActionOutput");
  if (actionOutput) renderSafePointList("#aiActionOutput", draft.actions);
  setText("#aiClientMessageOutput", draft.clientMessage);
  $("#clientReplyDraft").value = draft.clientMessage;
  setText("#reportCommandAi", state.lang === "en" ? "Ready" : "已完成");
  renderProfessionalNarrative(state.metrics);
  renderWorkspace();
}

function drawCharts() {
  const m = state.metrics;
  if (!m) return;
  drawBar("#roasChart", m.channels.map((row) => [row.channel, row.roas]), "#2dd4bf");
  drawBar("#revenueChart", m.channels.map((row) => [row.channel, Number(row.revenue)]), "#8b5cf6");
  drawBar("#trendChart", [["Last", m.totals.lastRevenue], ["Current", m.totals.revenue], ["Spend", m.totals.spend]], "#38bdf8");
  drawBar("#funnelChart", [["Impr.", m.totals.impressions], ["Clicks", m.totals.clicks], ["Conv.", m.totals.conversions]], "#f59e0b");
}

function drawBar(selector, data, color) {
  const canvas = $(selector);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const isDark = document.documentElement.classList.contains("theme-dark") && !document.documentElement.classList.contains("public-landing");
  const palette = isDark
    ? { bg: "#101720", grid: "rgba(226,232,240,.09)", label: "#cbd5e1", value: "#f8fafc", fade: "rgba(16,23,32,.15)" }
    : { bg: "#ffffff", grid: "rgba(15,23,42,.08)", label: "#526174", value: "#0f172a", fade: "rgba(255,255,255,.2)" };
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  const max = Math.max(...data.map(([, value]) => Number(value) || 0), 1);
  const gap = Math.max(16, Math.min(34, width / 24));
  const chartTop = 28;
  const chartBottom = height - 52;
  const chartHeight = Math.max(80, chartBottom - chartTop);
  const barWidth = Math.max(28, (width - gap * (data.length + 1)) / data.length);
  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.grid;
  ctx.font = "12px system-ui";
  ctx.fillStyle = palette.label;
  for (let i = 0; i <= 3; i += 1) {
    const y = chartTop + (chartHeight / 3) * i;
    ctx.beginPath();
    ctx.moveTo(gap, y);
    ctx.lineTo(width - gap, y);
    ctx.stroke();
  }
  data.forEach(([label, value], index) => {
    const numeric = Number(value) || 0;
    const barHeight = Math.max(8, (numeric / max) * chartHeight);
    const x = gap + index * (barWidth + gap);
    const y = chartBottom - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, chartBottom);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, palette.fade);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = palette.value;
    ctx.font = "700 12px system-ui";
    const valueLabel = numeric >= 1000000 ? `${Math.round(numeric / 1000000)}M` : numeric >= 1000 ? `${Math.round(numeric / 1000)}K` : numeric.toFixed(numeric < 10 ? 1 : 0);
    ctx.fillText(valueLabel, x, Math.max(18, y - 8));
    ctx.fillStyle = palette.label;
    ctx.font = "12px system-ui";
    ctx.fillText(String(label).slice(0, 12), x, height - 18);
  });
}

function renderWorkspace() {
  const m = state.metrics;
  const steps = [
    Boolean($("#clientName").value),
    Boolean($("#csvInput").value.trim()),
    Boolean(state.metrics),
    Boolean(state.ai),
    state.deliveries.length > 0,
    state.invoices.length > 0,
  ];
  const score = Math.round((steps.filter(Boolean).length / steps.length) * 100);
  const zh = state.lang !== "en";
  const nextSteps = [
    { done: steps[0], view: "case", label: "Step 1", title: zh ? "確認案件設定" : "Confirm case setup", copy: zh ? "填入客戶、月份、月報類型與需求，讓系統知道報告目標。" : "Fill client, month, report type, and goals so the report has context.", action: zh ? "前往案件設定" : "Open case setup" },
    { done: steps[1], view: "data", label: "Step 2", title: zh ? "匯入資料" : "Import data", copy: zh ? "貼上 CSV、匯入 Demo 或串接 Sheets，建立 KPI 與渠道資料。" : "Paste CSV, load demo data, or connect Sheets to build KPI data.", action: zh ? "前往資料匯入" : "Open data import" },
    { done: steps[2], view: "report", label: "Step 3", title: zh ? "產生月報" : "Generate report", copy: zh ? "用目前資料產出報告預覽、圖表與表格判讀。" : "Generate report preview, charts, and table diagnostics from current data.", action: zh ? "產生月報" : "Generate report" },
    { done: steps[3], view: "ai", label: "Step 4", title: zh ? "產生 AI 建議" : "Generate AI advice", copy: zh ? "建立摘要、風險、下月行動與客戶說明稿。" : "Create summary, risks, next actions, and client wording.", action: zh ? "前往 AI 建議" : "Open AI advice" },
    { done: steps[4], view: "delivery", label: "Step 5", title: zh ? "建立交付紀錄" : "Create delivery record", copy: zh ? "確認 Email 草稿、匯出方式與交付紀錄。" : "Confirm email draft, exports, and delivery record.", action: zh ? "前往交付付款" : "Open delivery" },
    { done: steps[5], view: "billing", label: "Step 6", title: zh ? "建立付款草稿" : "Create payment draft", copy: zh ? "補上付款狀態，讓月報交付與收款有紀錄。" : "Add payment status so delivery and billing stay connected.", action: zh ? "前往用量方案" : "Open usage plan" },
  ];
  const next = nextSteps.find((item) => !item.done) || { view: "report", label: "Ready", title: zh ? "可以交付月報" : "Ready to deliver", copy: zh ? "案件、資料、AI、交付與付款都已有紀錄。" : "Case, data, AI, delivery, and payment are recorded.", action: zh ? "查看報告預覽" : "View report preview" };
  setText("#launchScore", `${score}%`);
  if ($("#consoleReadinessBar")) $("#consoleReadinessBar").style.width = `${score}%`;
  if ($("#launchChecklist")) $("#launchChecklist").innerHTML = [
    [steps[0], state.lang === "en" ? "Case setup" : "案件設定"],
    [steps[1], state.lang === "en" ? "Data imported" : "資料匯入"],
    [steps[2], state.lang === "en" ? "Report preview" : "報告預覽"],
    [steps[3], state.lang === "en" ? "AI advice" : "AI 建議"],
    [steps[4], state.lang === "en" ? "Delivery record" : "交付紀錄"],
    [steps[5], state.lang === "en" ? "Payment draft" : "付款草稿"],
  ].map(([done, label]) => `<div><span class="${done ? "ok" : ""}">${done ? "OK" : "..."}</span><strong>${label}</strong></div>`).join("");
  setText("#overviewNextBadge", next.label);
  setText("#overviewNextTitle", next.title);
  setText("#overviewNextCopy", next.copy);
  setText("#overviewPrimaryAction", next.action);
  if ($("#overviewPrimaryAction")) $("#overviewPrimaryAction").dataset.workspaceTarget = next.view;
  $("#viewMastheadAction").dataset.workspaceTarget = next.view;
  setText("#viewMastheadPrimary", score >= 100 ? (zh ? "可交付" : "Ready") : (zh ? "準備中" : "In progress"));
  setText("#viewMastheadPrimaryLabel", zh ? "目前狀態" : "Status");
  setText("#viewMastheadNextLabel", zh ? "下一步" : "Next step");
  setText("#viewMastheadAction", next.action);
  $("#homeFeed").innerHTML = [
    [state.lang === "en" ? "Recent report" : "最近報告", state.reports[0]?.month || (m ? $("#reportMonth").value : "-")],
    [state.lang === "en" ? "Revenue" : "營收", m ? formatMoney(m.totals.revenue) : "-"],
    [state.lang === "en" ? "AI usage" : "AI 用量", state.usage ? `${state.usage.used}/${state.usage.limit}` : "0/3"],
    [state.lang === "en" ? "Payment" : "付款", state.invoices.length ? "Draft" : "-"],
  ].map(([a, b]) => `<div><strong>${a}</strong><span>${b}</span></div>`).join("");
  setText("#overviewCaseStatus", steps[0] ? (zh ? "已設定" : "Ready") : (zh ? "未完成" : "Missing"));
  setText("#overviewCaseMeta", $("#clientName").value || (zh ? "尚未確認客戶資料" : "No client yet"));
  setText("#overviewDataStatus", steps[1] ? (zh ? "已匯入" : "Imported") : (zh ? "未匯入" : "Missing"));
  setText("#overviewDataMeta", steps[1] ? `${state.rows?.length || parseCsv($("#csvInput").value || "").length} channels` : (zh ? "CSV / Sheets 尚未建立" : "No CSV or Sheets data"));
  setText("#overviewAiStatus", steps[3] ? (zh ? "已產生" : "Ready") : (zh ? "待產生" : "Pending"));
  setText("#overviewAiMeta", steps[3] ? (zh ? "摘要與建議已可預覽" : "Summary and advice ready") : (zh ? "摘要、風險與建議尚未產生" : "Summary, risks, and advice pending"));
  setText("#overviewDeliveryStatus", steps[4] ? (zh ? "已交付" : "Recorded") : (zh ? "待交付" : "Pending"));
  setText("#overviewDeliveryMeta", steps[4] ? (state.deliveries[0]?.email || "client@example.com") : (zh ? "尚未建立 Email / 匯出紀錄" : "No email/export record"));
  setText("#reportPreviewMonth", $("#reportMonth").value || "-");
  setText("#reportPreviewStatus", m ? (zh ? "可預覽" : "Ready") : (zh ? "尚未產生" : "Not generated"));
  setText("#reportPreviewHint", m ? (zh ? "報告已產生，可以向下查看完整報告內容。" : "Report generated. Scroll down to read the full report.") : (zh ? "先完成案件設定與資料匯入，這裡會顯示可閱讀的報告預覽。" : "Complete case setup and data import to unlock report preview."));
  const reportBrief = $("#reportPreviewBrief");
  const reportChecks = $("#reportDeliveryChecks");
  if (reportBrief) {
    reportBrief.innerHTML = m ? [
      [zh ? "本月結論" : "Monthly conclusion", zh ? `${$("#clientName").value || "Demo Client"} 本月 ROAS ${m.roas.toFixed(2)}x` : `${$("#clientName").value || "Demo Client"} reached ${m.roas.toFixed(2)}x ROAS`, zh ? `營收 ${formatMoney(m.totals.revenue)}，CPA ${formatMoney(m.cpa)}，整體狀態${m.roas >= 3 ? "適合放大有效渠道" : "需要先優化效率"}。` : `Revenue ${formatMoney(m.totals.revenue)}, CPA ${formatMoney(m.cpa)}. ${m.roas >= 3 ? "Ready to scale efficient channels." : "Optimize efficiency before scaling."}`],
      [zh ? "最佳渠道" : "Best channel", m.best?.channel || "-", zh ? `目前 ROAS ${m.best ? m.best.roas.toFixed(2) : "0.00"}x，建議保留並測試加碼。` : `ROAS ${m.best ? m.best.roas.toFixed(2) : "0.00"}x. Keep and test scaling.`],
      [zh ? "需修正渠道" : "Weakest channel", m.worst?.channel || "-", zh ? `目前 ROAS ${m.worst ? m.worst.roas.toFixed(2) : "0.00"}x，下月優先檢查素材、受眾或關鍵字。` : `ROAS ${m.worst ? m.worst.roas.toFixed(2) : "0.00"}x. Review creative, audience, or keywords next.`],
    ].map(([label, title, copy]) => `<div><span>${escapeLibraryText(label)}</span><strong>${escapeLibraryText(title)}</strong><p>${escapeLibraryText(copy)}</p></div>`).join("") : `<div><span>${zh ? "目前狀態" : "Status"}</span><strong>${zh ? "尚未產生月報" : "Report not generated"}</strong><p>${zh ? "完成資料匯入後，這裡會自動整理客戶可以閱讀的摘要。" : "After importing data, this area will become a client-readable brief."}</p></div>`;
  }
  if (reportChecks) {
    const draft = state.ai || buildRuleDraft();
    const checkItems = [
      [steps[2], "01", zh ? "本月結果" : "Monthly result", m ? `${formatMoney(m.totals.revenue)} / ROAS ${m.roas.toFixed(2)}x` : (zh ? "等待資料" : "Waiting for data")],
      [Boolean(m?.best), "02", zh ? "最佳渠道" : "Best channel", m?.best ? `${m.best.channel} ${m.best.roas.toFixed(2)}x` : "-"],
      [Boolean(draft?.risks?.length), "03", zh ? "主要風險" : "Main risk", draft?.risks?.[0] || (zh ? "等待 AI 建議" : "Waiting for AI advice")],
      [Boolean(draft?.actions?.length), "04", zh ? "下月行動" : "Next action", draft?.actions?.[0] || (zh ? "等待 AI 建議" : "Waiting for AI advice")],
    ];
    reportChecks.innerHTML = checkItems.map(([done, no, title, copy]) => `<div class="${done ? "done" : ""}"><span>${done ? "OK" : escapeLibraryText(no)}</span><strong>${escapeLibraryText(title)}</strong><p>${escapeLibraryText(copy)}</p></div>`).join("");
  }
  $("#clientList").innerHTML = state.clients.map((c) => `<div><strong>${escapeLibraryText(c.name)}</strong><span>${escapeLibraryText(c.month)}</span></div>`).join("") || `<div><strong>${escapeLibraryText($("#clientName").value)}</strong><span>${escapeLibraryText($("#reportMonth").value)}</span></div>`;
  $("#clientCount").textContent = String(Math.max(state.clients.length, 1));
  $("#libraryCount").textContent = String(state.reports.length);
  $("#latestReportMonth").textContent = state.reports[0]?.month || "-";
  renderReportLibrary();
}

function escapeLibraryText(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function renderReportLibrary() {
  const list = $("#reportList");
  if (!list) return;
  const zh = state.lang !== "en";
  if (!state.reports.length) {
    list.innerHTML = `<div class="report-library-empty"><strong>${zh ? "尚未儲存月報" : "No saved reports"}</strong><span>${zh ? "產生月報後按下「儲存目前報告」，即可在這裡再次開啟。" : "Generate a report and save it to reopen it here."}</span></div>`;
    return;
  }
  list.innerHTML = state.reports.map((report, index) => {
    const restorable = Boolean(report.snapshot?.metrics || report.snapshot?.csv);
    const client = escapeLibraryText(report.client || (zh ? "未命名客戶" : "Untitled client"));
    const month = escapeLibraryText(report.month || "-");
    const updatedAt = report.updatedAt || report.createdAt;
    const savedTime = updatedAt ? new Date(updatedAt).toLocaleString(zh ? "zh-TW" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : "-";
    return `<article class="report-library-item" data-report-id="${escapeLibraryText(report.id || String(index))}">
      <div class="report-library-file-icon" aria-hidden="true">R</div>
      <div class="report-library-info">
        <div class="report-library-title"><strong>${client} ${month}</strong><span class="${restorable ? "is-ready" : "is-legacy"}">${restorable ? (zh ? "可開啟" : "Ready") : (zh ? "舊版索引" : "Legacy index")}</span></div>
        <p>${escapeLibraryText(report.reportTypeLabel || (zh ? "代理商月報" : "Agency monthly report"))}</p>
        <small>${zh ? "最後儲存" : "Last saved"} ${escapeLibraryText(savedTime)}</small>
      </div>
      <div class="report-library-actions">
        <button class="ghost" type="button" data-report-action="open" data-report-index="${index}" ${restorable ? "" : "disabled"}>${zh ? "開啟" : "Open"}</button>
        <button class="ghost report-library-pdf" type="button" data-report-action="pdf" data-report-index="${index}" ${restorable ? "" : "disabled"}>PDF</button>
        <button class="ghost icon-only" type="button" data-report-action="delete" data-report-index="${index}" aria-label="${zh ? "刪除月報" : "Delete report"}" title="${zh ? "刪除月報" : "Delete report"}">×</button>
      </div>
    </article>`;
  }).join("");
}

function planDisplayName(plan) {
  const zh = state.lang !== "en";
  const names = zh
    ? { free: "免費版", starter: "入門版", agency: "代理商版", professional: "專業版" }
    : { free: "Free", starter: "Starter", agency: "Agency", professional: "Professional" };
  return names[plan] || names.free;
}

async function refreshUsage() {
  if (!authToken()) return;
  try {
    state.usage = await api("/api/usage");
  } catch {
    state.usage = state.usage || { plan: "free", used: 0, limit: 3, remaining: 3, period: "local" };
  }
  updateUsageUi();
}

function currentUsage() {
  return state.usage || { plan: "free", used: 0, limit: 3, remaining: 3 };
}

function updateUsageUi() {
  const usage = currentUsage();
  const used = Number(usage.used || 0);
  const limit = Number(usage.limit || 3);
  const remaining = Math.max(0, Number(usage.remaining ?? limit - used));
  const percent = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const planName = planDisplayName(usage.plan);
  setText("#usageUsed", String(used));
  setText("#usageLimit", String(limit));
  setText("#usageRemaining", String(remaining));
  setText("#usagePlan", planName);
  setText("#billingPlan", planName);
  setText("#reportUsage", `${used} / ${limit}`);
  setText("#dockUsagePercent", `${percent}%`);
  setText("#dockCurrentPlanValue", planName);
  if ($("#usageBar")) $("#usageBar").style.width = `${percent}%`;
  setStatus("#usageStatus", percent >= 100 ? "error" : percent >= 80 ? "warn" : "ok", percent >= 100 ? (state.lang === "en" ? "AI quota reached" : "AI 用量已達上限") : (state.lang === "en" ? "AI usage available" : "AI 用量可用"), state.lang === "en" ? `${remaining} reports remaining.` : `本月剩餘 ${remaining} 份月報。`);
}

function renderUpgradePlans() {
  const cycle = $(".upgrade-tabs button.active")?.dataset.upgradeCycle || "monthly";
  const zh = state.lang !== "en";
  setText("#upgradeModalTitle", zh ? "升級方案" : "Upgrade Plan");
  $$("[data-upgrade-cycle]").forEach((button) => {
    button.textContent = button.dataset.upgradeCycle === "annual" ? (zh ? "年繳" : "Annual") : (zh ? "月繳" : "Monthly");
  });
  const plans = {
    starter: [zh ? "入門版" : "Starter", ["10 AI reports", "CSV / Sheets", "AI recommendations", "PDF / HTML export"]],
    agency: [zh ? "代理商版" : "Agency", ["50 AI reports", "Multi-client workspace", "Branded reports", "Payment records"]],
    professional: [zh ? "專業版" : "Professional", ["150 AI reports", "Client portal", "Email drafts", "White label"]],
  };
  $("#upgradePlans").innerHTML = Object.entries(plans).map(([key, [name, features]]) => {
    const plan = planLimits[key];
    const currency = $("#currency")?.value || "TWD";
    const monthly = currency === "USD" ? plan.monthlyUsd : plan.monthlyTwd;
    const amount = cycle === "annual" ? Math.round(monthly * 12 * 0.85) : monthly;
    const price = new Intl.NumberFormat(zh ? "zh-TW" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
    return `<article class="upgrade-plan ${key === "agency" ? "featured" : ""}">
      <h3>${name}</h3>
      <div class="upgrade-price">${price}<small>${cycle === "annual" ? "/yr" : (zh ? "/月" : "/mo")}</small></div>
      <ul class="upgrade-feature-list">${features.map((f) => `<li><span></span>${f}</li>`).join("")}</ul>
      <button type="button" data-upgrade-plan="${key}">${zh ? "選擇方案" : "Choose plan"}</button>
    </article>`;
  }).join("");
  setText("#upgradeStatus", zh ? "選擇方案後建立付款草稿。" : "Choose a plan to create a checkout draft.");
}

function openUpgradeModal() {
  renderUpgradePlans();
  $("#upgradeModal").hidden = false;
}

function closeUpgradeModal() {
  $("#upgradeModal").hidden = true;
}

function isLimitExceededError(error) {
  return error?.status === 403 && (error.code === "LIMIT_EXCEEDED" || error.message === "LIMIT_EXCEEDED");
}

function openLimitExceededUpgrade(error) {
  const usage = error?.details || currentUsage();
  state.usage = usage;
  openUpgradeModal();
  const zh = state.lang !== "en";
  setText("#upgradeModalTitle", zh ? "AI 用量已達上限" : "AI quota reached");
  $("#upgradeStatus").innerHTML = `<strong>${zh ? `你的 ${planDisplayName(usage.plan)} 本月已使用 ${usage.used}/${usage.limit} 份 AI 月報。` : `Your ${planDisplayName(usage.plan)} plan used ${usage.used}/${usage.limit} AI reports this month.`}</strong><span>${zh ? "升級後即可繼續產生客戶可交付報告。" : "Upgrade to keep generating client-ready reports."}</span>`;
  updateUsageUi();
}

async function chooseUpgradePlan(plan) {
  $("#planSelect").value = plan;
  const payload = {
    plan,
    currency: $("#currency").value || "TWD",
    accountName: $("#accountName").value || $("#agencyName").value,
    accountEmail: $("#accountEmail").value || state.auth?.user?.email,
  };
  try {
    const intent = await api("/api/billing/checkout", { method: "POST", body: JSON.stringify(payload) });
    state.invoices.unshift(intent);
    localStorage.setItem(scopedWorkspaceKey("agencyReportInvoices"), JSON.stringify(state.invoices));
    setStatus("#upgradeStatus", "ok", state.lang === "en" ? "Checkout draft created" : "付款草稿已建立", intent.checkoutUrl || intent.quoteUrl || "");
    setStatus("#billingStatus", "ok", state.lang === "en" ? "Checkout draft created" : "付款草稿已建立", planDisplayName(plan));
    renderWorkspace();
  } catch (error) {
    setStatus("#upgradeStatus", "error", state.lang === "en" ? "Checkout failed" : "建立付款失敗", error.message);
  }
}

function saveCaseProfile() {
  const client = { name: $("#clientName").value, month: $("#reportMonth").value, createdAt: new Date().toISOString() };
  state.clients.unshift(client);
  localStorage.setItem(scopedWorkspaceKey("agencyReportClients"), JSON.stringify(state.clients));
  setStatus("#clientHubStatus", "ok", state.lang === "en" ? "Case created" : "案件已建立", client.name);
  renderWorkspace();
}

async function saveCurrentReport() {
  if (!state.metrics) {
    setStatus("#shareLinkPanel", "warning", state.lang === "en" ? "Generate a report first" : "請先產生月報", state.lang === "en" ? "Only complete reports can be saved." : "完成產報後才能儲存可再次開啟的月報。");
    return;
  }
  const now = new Date().toISOString();
  const client = $("#clientName").value.trim() || (state.lang === "en" ? "Untitled client" : "未命名客戶");
  const month = $("#reportMonth").value;
  const existingIndex = state.reports.findIndex((item) => item.client === client && item.month === month);
  const existing = existingIndex >= 0 ? state.reports[existingIndex] : null;
  const report = {
    id: existing?.id || (globalThis.crypto?.randomUUID?.() || `report-${Date.now()}`),
    client,
    month,
    reportTypeLabel: $("#reportType").selectedOptions[0]?.textContent || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    snapshot: {
      agencyName: $("#agencyName").value,
      clientName: client,
      reportMonth: month,
      reportType: $("#reportType").value,
      currency: $("#currency").value,
      tone: $("#tone").value,
      clientRequest: $("#clientRequest").value,
      csv: $("#csvInput").value,
      rows: state.rows,
      metrics: state.metrics,
      ai: state.ai,
    },
  };
  if (existingIndex >= 0) state.reports.splice(existingIndex, 1);
  state.reports.unshift(report);
  cacheReports();
  renderWorkspace();
  try {
    const saved = await api("/api/reports", { method: "POST", body: JSON.stringify(report) });
    state.reports[0] = saved;
    cacheReports();
    renderWorkspace();
    setStatus("#shareLinkPanel", "ok", state.lang === "en" ? "Report saved" : "月報已儲存", `${client} / ${month}`);
  } catch (error) {
    setStatus("#shareLinkPanel", "warning", state.lang === "en" ? "Saved on this device only" : "目前僅儲存在此裝置", error.message);
  }
}

function restoreSavedReport(report, navigate = true) {
  const snapshot = report?.snapshot;
  if (!snapshot) return false;
  const fieldValues = {
    agencyName: snapshot.agencyName,
    clientName: snapshot.clientName || report.client,
    reportMonth: snapshot.reportMonth || report.month,
    reportType: snapshot.reportType,
    currency: snapshot.currency,
    tone: snapshot.tone,
    clientRequest: snapshot.clientRequest,
    csvInput: snapshot.csv,
  };
  Object.entries(fieldValues).forEach(([id, value]) => {
    const field = $(`#${id}`);
    if (field && value != null) field.value = value;
  });
  state.rows = snapshot.rows?.length ? snapshot.rows : parseCsv(snapshot.csv || "");
  state.metrics = snapshot.metrics || (state.rows.length ? calculateMetrics(state.rows) : null);
  state.ai = snapshot.ai || (state.metrics ? buildRuleDraft(state.metrics) : null);
  if (!state.metrics) return false;
  renderReport();
  renderAi();
  renderWorkspace();
  $("#report").hidden = false;
  if (navigate) {
    openWorkspace("report");
    requestAnimationFrame(() => $("#report")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  return true;
}

async function handleReportLibraryAction(event) {
  const button = event.target.closest("[data-report-action]");
  if (!button) return;
  const index = Number(button.dataset.reportIndex);
  const report = state.reports[index];
  if (!report) return;
  if (button.dataset.reportAction === "delete") {
    const confirmed = globalThis.confirm(state.lang === "en" ? `Delete ${report.client} ${report.month}?` : `確定刪除「${report.client} ${report.month}」嗎？`);
    if (!confirmed) return;
    try {
      await api(`/api/reports?id=${encodeURIComponent(report.id)}`, { method: "DELETE" });
    } catch (error) {
      setStatus("#shareLinkPanel", "error", state.lang === "en" ? "Delete failed" : "刪除失敗", error.message);
      return;
    }
    state.reports.splice(index, 1);
    cacheReports();
    renderWorkspace();
    return;
  }
  if (!restoreSavedReport(report, button.dataset.reportAction === "open")) return;
  if (button.dataset.reportAction === "pdf") setTimeout(printReportPdf, 120);
}

function deliverReport() {
  const delivery = { email: $("#deliveryEmail").value, month: $("#reportMonth").value, createdAt: new Date().toISOString() };
  state.deliveries.unshift(delivery);
  localStorage.setItem(scopedWorkspaceKey("agencyReportDeliveries"), JSON.stringify(state.deliveries));
  $("#deliveryCenter").innerHTML = state.deliveries.map((item) => `<div><strong>${escapeLibraryText(item.email || "client@example.com")}</strong><span>${escapeLibraryText(item.month)}</span></div>`).join("");
  renderWorkspace();
}

function loadSample(sample = "ads") {
  $("#csvInput").value = samples[sample] || samples.ads;
  $("#reportType").value = sample;
  generateReport();
}

function downloadSampleCsv() {
  const blob = new Blob([$("#csvInput").value || samples.ads], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agencyreport-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function reportExportName(extension) {
  const client = ($("#clientName")?.value || "client").trim();
  const month = $("#reportMonth")?.value || new Date().toISOString().slice(0, 7);
  const safeClient = client.replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, "-");
  return safeClient + "-" + month + "-report." + extension;
}

function collectExportStyles() {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function exportReportHtml() {
  if (!state.metrics) {
    setStatus("#shareLinkPanel", "warning", state.lang === "en" ? "Generate a report first" : "請先產生月報", state.lang === "en" ? "The HTML export needs report data." : "HTML 匯出需要先有報告資料。");
    return;
  }
  const source = $("#report");
  if (!source) return;
  const report = source.cloneNode(true);
  report.hidden = false;
  report.removeAttribute("hidden");
  const titleText = ($("#clientName")?.value || "AgencyReport AI").replace(/[<>&]/g, "");
  const html = "<!doctype html><html lang=\"" + document.documentElement.lang + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + titleText + " 月報</title><style>" + collectExportStyles() + "body{padding:24px}.report-shell{display:block!important;margin:0 auto!important}</style></head><body class=\"theme-light\">" + report.outerHTML + "</body></html>";
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = reportExportName("html");
  link.click();
  URL.revokeObjectURL(url);
  setStatus("#shareLinkPanel", "ok", state.lang === "en" ? "HTML downloaded" : "HTML 已下載", link.download);
}

function printReportPdf() {
  if (!state.metrics) {
    setStatus("#shareLinkPanel", "warning", state.lang === "en" ? "Generate a report first" : "請先產生月報", state.lang === "en" ? "The PDF export needs report data." : "PDF 匯出需要先有報告資料。");
    return;
  }
  const report = $("#report");
  if (!report) return;
  const wasHidden = report.hidden;
  report.hidden = false;
  document.body.classList.add("printing-report");
  const cleanup = () => {
    document.body.classList.remove("printing-report");
    report.hidden = wasHidden;
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  setTimeout(cleanup, 1500);
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function extractCsvFromText(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex((line) => /channel\s*,\s*spend\s*,\s*impressions/i.test(line));
  if (headerIndex >= 0) return lines.slice(headerIndex).filter((line) => line.includes(",")).join("\n");
  const csvLines = lines.filter((line) => line.includes(",") && line.split(",").length >= 4);
  if (csvLines.length >= 2) return csvLines.join("\n");
  return "";
}

function inferReportType(text) {
  const source = text.toLowerCase();
  if (source.includes("seo") || source.includes("organic") || source.includes("search console")) return "seo";
  if (source.includes("social") || source.includes("instagram") || source.includes("facebook") || source.includes("threads")) return "social";
  return "ads";
}

function inferClientName(text, fileName = "") {
  const explicit = firstMatch(text, [
    /(?:客戶|公司|品牌|client|company|brand)\s*[:：]\s*([^\n,，。]+)/i,
    /客戶是\s*([^\n,，。]+)/,
    /公司是\s*([^\n,，。]+)/,
  ]);
  if (explicit) return explicit.replace(/["']/g, "").trim();
  if (fileName) return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return "";
}

function appendAiIntakeMessage(role, text, fileName = "") {
  const thread = $("#aiIntakeThread");
  if (!thread) return;
  const message = document.createElement("div");
  message.className = "ai-chat-message " + role;
  const avatar = document.createElement("span");
  avatar.className = "ai-chat-avatar";
  avatar.textContent = role === "user" ? (state.lang === "en" ? "You" : "你") : "AI";
  const bubble = document.createElement("div");
  bubble.className = "ai-chat-bubble";
  const body = document.createElement("p");
  const cleanText = String(text || "").trim();
  body.textContent = cleanText.length > 520 ? cleanText.slice(0, 520) + "..." : cleanText;
  bubble.appendChild(body);
  if (fileName) {
    const attachment = document.createElement("small");
    attachment.className = "ai-chat-attachment";
    attachment.textContent = "附件：" + fileName;
    bubble.appendChild(attachment);
  }
  message.append(avatar, bubble);
  thread.appendChild(message);
  thread.scrollTop = thread.scrollHeight;
}

function setAiIntakeNextAction(view, label) {
  const button = $("#aiIntakeNextBtn");
  if (!button) return;
  button.hidden = false;
  button.dataset.workspaceTarget = view;
  button.textContent = label;
}

function setAiIntakeReply(title, copy) {
  setText("#aiIntakeAnalysisTitle", title);
  setText("#aiIntakeAnalysisCopy", copy);
  const status = $("#aiIntakeStatus");
  if (status) {
    status.className = "status-panel ai-chat-status";
    status.innerHTML = "";
  }
  const thread = $("#aiIntakeThread");
  if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
}

function summarizeIntakeApplied(items) {
  const zh = state.lang !== "en";
  const node = $("#aiIntakeResult");
  if (!node) return;
  node.innerHTML = items.map(([label, value]) => `
    <div>
      <span>${label}</span>
      <strong>${value || (zh ? "未偵測" : "Not detected")}</strong>
    </div>
  `).join("");
  const message = $("#aiIntakeAnalysisMessage");
  if (message) message.hidden = false;
  const thread = $("#aiIntakeThread");
  if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
}

function fillAiDemoBrief() {
  const brief = state.lang === "en" ? `Client: Morning Light Dental Clinic
Report month: 2026-06
Report type: Advertising report
Request: Review this month's CPA, ROAS, Google Search, and Meta Ads performance, then recommend next month's budget.

${samples.ads}` : `客戶是晨光牙醫診所
報告月份：2026-06
報告類型：廣告月報
需求：想知道本月 CPA、ROAS、Google Search 與 Meta Ads 表現，並需要下月預算建議。

${samples.ads}`;
  $("#aiIntakePrompt").value = brief;
  $("#aiIntakePrompt").focus();
  setStatus("#aiIntakeStatus", "ok", state.lang === "en" ? "Demo loaded" : "範例已帶入", state.lang === "en" ? "Click analyze to apply it." : "按下分析即可套用至專案。");
}

async function applyAiIntake() {
  const zh = state.lang !== "en";
  const file = $("#aiIntakeFile")?.files?.[0];
  const typedText = $("#aiIntakePrompt")?.value || "";
  const fileText = file ? await file.text() : "";
  const intakeText = [typedText, fileText].filter(Boolean).join("\n\n");
  if (!intakeText.trim()) {
    setStatus("#aiIntakeStatus", "error", zh ? "尚未提供資料" : "No input yet", zh ? "請貼上文字、網址，或上傳 CSV/TXT 檔案。" : "Paste text, a URL, or upload a CSV/TXT file.");
    return;
  }

  appendAiIntakeMessage("user", typedText || (zh ? "請分析這份附件並建立月報。" : "Analyze this attachment and create a report."), file?.name || "");
  const analyzeButton = $("#aiAnalyzeApplyBtn");
  if (analyzeButton) analyzeButton.disabled = true;
  setStatus("#aiIntakeStatus", "", zh ? "AI 正在分析資料" : "AI is analyzing", zh ? "正在辨識案件、月份、資料來源與 KPI..." : "Detecting case, month, source, and KPI data...");

  const url = firstMatch(intakeText, [/(https?:\/\/[^\s"'<>]+)/i]);
  const month = firstMatch(intakeText, [/(\d{4}[-/]\d{2})/]);
  const email = firstMatch(intakeText, [/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i]);
  const csv = extractCsvFromText(intakeText);
  const reportType = inferReportType(intakeText);
  const clientName = inferClientName(intakeText, file?.name);
  const requestText = intakeText
    .replace(csv, "")
    .replace(url || "", "")
    .trim()
    .slice(0, 900);

  if (clientName) $("#clientName").value = clientName;
  if (month) $("#reportMonth").value = month.replace("/", "-");
  if ($("#reportType")) $("#reportType").value = reportType;
  if (requestText) $("#clientRequest").value = requestText;
  if (email) {
    $("#deliveryEmail").value = email;
    $("#accountEmail").value = email;
  }
  if (url) {
    $("#sheetUrl").value = url;
    $("#sourceType").value = url.includes("docs.google.com") || url.includes("spreadsheets") ? "sheets" : "csv";
  }
  if (csv) $("#csvInput").value = csv;

  summarizeIntakeApplied([
    [zh ? "客戶" : "Client", $("#clientName").value],
    [zh ? "月份" : "Month", $("#reportMonth").value],
    [zh ? "資料來源" : "Source", url || (csv ? "CSV / file" : "")],
    [zh ? "報告類型" : "Report type", $("#reportType").selectedOptions[0]?.textContent || reportType],
  ]);

  saveCaseProfile();
  if (csv || $("#csvInput").value.trim()) {
    try {
      await generateReportFromButton();
    } catch (error) {
      setStatus("#aiIntakeStatus", "error", zh ? "AI 分析失敗" : "AI analysis failed", error.message);
      return;
    } finally {
      if (analyzeButton) analyzeButton.disabled = false;
    }
    setAiIntakeNextAction("report", zh ? "查看報告結果" : "View report results");
    setAiIntakeReply(
      zh ? "完成了，月報已準備好" : "Done, your report is ready",
      zh ? "我已將資料帶入案件、完成 KPI 分析並產生月報。您可以先確認下方辨識結果，再查看完整報告。" : "I applied the case data, analyzed the KPI, and generated the report. Review the detected details below, then open the full report.",
    );
    return;
  }

  setAiIntakeNextAction("data", zh ? "繼續資料檢查" : "Continue data review");
  setAiIntakeReply(
    zh ? "資料來源已整理完成" : "The data source is ready",
    zh ? "我已帶入資料來源網址，但尚未偵測到可分析的 CSV。請繼續檢查來源，或在對話中加入 CSV/TXT 檔案。" : "I applied the source URL, but no analyzable CSV was detected. Continue reviewing the source or attach a CSV/TXT file in this chat.",
  );
  if (analyzeButton) analyzeButton.disabled = false;
}

function syncConsentAudit() {
  const inputs = ["#consentData", "#consentAi", "#consentDelivery"].map((selector) => $(selector)).filter(Boolean);
  const checked = inputs.filter((input) => input.checked).length;
  const complete = checked === inputs.length && inputs.length > 0;
  setText("#auditCount", String(checked));
  setText("#auditStatus", complete ? "OK" : checked ? "Partial" : "-");
  if (!checked) {
    setStatus("#trustStatus", "", state.lang === "en" ? "No consent selected" : "尚未勾選同意");
    return;
  }
  setStatus(
    "#trustStatus",
    complete ? "ok" : "warn",
    state.lang === "en" ? "Consent updated" : "同意狀態已更新",
    state.lang === "en" ? `${checked}/${inputs.length} items selected.` : `已勾選 ${checked}/${inputs.length} 項。`
  );
}

function returnToLandingHome(event) {
  event?.preventDefault();
  document.documentElement.classList.add("public-landing");
  document.documentElement.classList.remove("auth-locked", "portal-mode");
  $("#overviewHome").hidden = false;
  $("#caseWorkspace").hidden = true;
  $("#report").hidden = true;
  $("#authGate").hidden = true;
  $("#landingLoginBtn").hidden = Boolean(state.auth);
  $("#landingStartBtn").hidden = Boolean(state.auth);
  $("#logoutBtn").hidden = !state.auth;
  $("#overviewHome")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupEvents() {
  $("[data-home-link]")?.addEventListener("click", returnToLandingHome);
  $("#landingLoginBtn")?.addEventListener("click", showAuthGate);
  $("#landingStartBtn")?.addEventListener("click", showAuthGate);
  $("#openCaseDetailBtn")?.addEventListener("click", showAuthGate);
  $(".landing-bottom-start")?.addEventListener("click", showAuthGate);
  $("#homeLoadDemoBtn")?.addEventListener("click", () => { showAuthGate(); });
  $("#closeAuthBtn")?.addEventListener("click", hideAuthGate);
  $("#authForm")?.addEventListener("submit", submitAuth);
  $("#registerBtn")?.addEventListener("click", registerAuth);
  $("#forgotPasswordBtn")?.addEventListener("click", requestPasswordReset);
  $("#resendVerificationBtn")?.addEventListener("click", resendVerificationEmail);
  $("#resetPasswordBtn")?.addEventListener("click", completePasswordReset);
  $("#logoutBtn")?.addEventListener("click", logoutAuth);
  $$("[data-lang]").forEach((button) => button.addEventListener("click", () => applyLanguage(button.dataset.lang)));
  $$("[data-workspace-view]").forEach((button) => button.addEventListener("click", () => openWorkspace(button.dataset.workspaceView)));
  $("#viewMastheadAction")?.addEventListener("click", runWorkspacePrimaryAction);
  $("#overviewPrimaryAction")?.addEventListener("click", runWorkspacePrimaryAction);
  $("#aiAnalyzeApplyBtn")?.addEventListener("click", applyAiIntake);
  $("#aiUseDemoBriefBtn")?.addEventListener("click", fillAiDemoBrief);
  $("#aiIntakeNextBtn")?.addEventListener("click", (event) => openWorkspace(event.currentTarget.dataset.workspaceTarget || "report"));
  $$("[data-ai-prompt]").forEach((button) => button.addEventListener("click", () => {
    $("#aiIntakePrompt").value = button.dataset.aiPrompt || "";
    $("#aiIntakePrompt").focus();
  }));
  $("#aiIntakeFile")?.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    setText("#aiIntakeFileName", file?.name || (state.lang === "en" ? "No file selected" : "尚未選擇檔案"));
  });
  $("#aiIntakePrompt")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      $("#aiAnalyzeApplyBtn")?.click();
    }
  });
  $$("[data-manual-view]").forEach((button) => button.addEventListener("click", () => openWorkspace(button.dataset.manualView)));
  $("#reportPreviewGenerateBtn")?.addEventListener("click", generateReportFromButton);
  $("#reportPreviewJumpBtn")?.addEventListener("click", () => $("#report")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  $("#completeDemoBtn")?.addEventListener("click", () => loadSample("ads"));
  $("#insertCsvTemplateBtn")?.addEventListener("click", () => { $("#csvInput").value = samples.ads; });
  $("#downloadSampleBtn")?.addEventListener("click", downloadSampleCsv);
  $("#quickAdsBtn")?.addEventListener("click", () => loadSample("ads"));
  $("#quickSeoBtn")?.addEventListener("click", () => loadSample("seo"));
  $("#quickSocialBtn")?.addEventListener("click", () => loadSample("social"));
  $("#generateBtn")?.addEventListener("click", generateReportFromButton);
  $("#runBackendAiBtn")?.addEventListener("click", runBackendAi);
  $("#saveClientBtn")?.addEventListener("click", saveCaseProfile);
  $("#saveReportBtn")?.addEventListener("click", saveCurrentReport);
  $("#reportList")?.addEventListener("click", handleReportLibraryAction);
  $("#deliverReportBtn")?.addEventListener("click", deliverReport);
  $("#exportHtmlBtn")?.addEventListener("click", exportReportHtml);
  $("#printBtn")?.addEventListener("click", printReportPdf);
  $("#saveAccountBtn")?.addEventListener("click", () => setStatus("#billingStatus", "ok", state.lang === "en" ? "Account saved" : "帳戶已儲存", $("#accountEmail").value));
  $("#createCheckoutBtn")?.addEventListener("click", () => chooseUpgradePlan($("#planSelect").value));
  $$("[id^='consent']").forEach((input) => input.addEventListener("change", syncConsentAudit));
  $("#refreshAuditBtn")?.addEventListener("click", syncConsentAudit);
  $("#exportAccountDataBtn")?.addEventListener("click", exportAccountData);
  $("#openDeleteAccountBtn")?.addEventListener("click", () => toggleDeleteAccountPanel(true));
  $("#cancelDeleteAccountBtn")?.addEventListener("click", () => toggleDeleteAccountPanel(false));
  $("#confirmDeleteAccountBtn")?.addEventListener("click", deleteCurrentAccount);
  $("#runAutopilotBtn")?.addEventListener("click", () => {
    const draft = buildRuleDraft();
    $("#autopilotOutput").innerHTML = draft ? draft.actions.map((item) => `<div><strong>${item}</strong></div>`).join("") : "";
  });
  $("#accountDockToggle")?.addEventListener("click", (event) => {
    event.stopPropagation();
    $("#accountDockMenu").hidden = !$("#accountDockMenu").hidden;
  });
  document.addEventListener("click", () => { if ($("#accountDockMenu")) $("#accountDockMenu").hidden = true; });
  $("#accountDockMenu")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const action = event.target.closest("[data-dock-action]")?.dataset.dockAction;
    if (action === "theme") applyTheme(state.theme === "light" ? "dark" : "light");
    if (action === "billing") openUpgradeModal();
    if (action === "usage") openWorkspace("billing");
    if (action === "profile") openWorkspace("settings");
    if (action === "logout") logoutAuth();
  });
  $("#upgradeCloseBtn")?.addEventListener("click", closeUpgradeModal);
  $("#upgradeModal")?.addEventListener("click", (event) => {
    if (event.target.id === "upgradeModal") closeUpgradeModal();
    const cycle = event.target.closest("[data-upgrade-cycle]");
    if (cycle) {
      $$("[data-upgrade-cycle]").forEach((button) => button.classList.toggle("active", button === cycle));
      renderUpgradePlans();
    }
    const plan = event.target.closest("[data-upgrade-plan]");
    if (plan) chooseUpgradePlan(plan.dataset.upgradePlan);
  });
  $("#csvFile")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    $("#csvInput").value = await file.text();
    generateReport();
  });
}

async function restoreSession() {
  try {
    const user = await api("/api/auth/me", { method: "GET" });
    setAuthState({ user });
    state.usage = user.usage || state.usage;
    updateUsageUi();
  } catch {
    localStorage.removeItem("agencyReportAuthToken");
    setAuthState(null);
  }
}

function init() {
  $("#csvInput").value = samples.ads;
  $("#report").hidden = true;
  setupEvents();
  applyTheme(state.theme);
  applyLanguage(state.lang);
  renderWorkspace();
  restoreSession().then(processAuthActionLinks);
}

Object.assign(window, {
  generateReportFromButton,
  loadSample,
  openLimitExceededUpgrade,
  openUpgradeModal,
  openWorkspace,
  runBackendAi,
  showAuthGate,
  syncDockLanguageLabels,
});

init();

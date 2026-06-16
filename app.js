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
  reports: JSON.parse(localStorage.getItem("agencyReportReports") || "[]"),
  clients: JSON.parse(localStorage.getItem("agencyReportClients") || "[]"),
  deliveries: JSON.parse(localStorage.getItem("agencyReportDeliveries") || "[]"),
  invoices: JSON.parse(localStorage.getItem("agencyReportInvoices") || "[]"),
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
    deliveryEmail: "交付 Email",
    savedReports: "已存報告",
    latestReport: "最新月份",
    saveReport: "儲存目前報告",
    billingTitle: "方案與收款",
    billingCopy: "管理方案、付款草稿、發票與 AI 用量。",
    accountName: "帳戶名稱",
    selectedPlan: "選擇方案",
    checkoutStatus: "付款狀態",
    createInvoice: "建立發票",
    clientCount: "客戶數",
    reportUsage: "報告用量",
    consentData: "客戶同意資料用於月報分析",
    consentAi: "客戶同意使用 AI 產生建議",
    consentDelivery: "客戶同意 Email / PDF / HTML 交付",
    saveConsent: "儲存同意",
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
    deliveryEmail: "Delivery Email",
    savedReports: "Saved reports",
    latestReport: "Latest month",
    saveReport: "Save current report",
    billingTitle: "Plans & payments",
    billingCopy: "Manage plans, checkout drafts, invoices, and AI usage.",
    accountName: "Account name",
    selectedPlan: "Selected plan",
    checkoutStatus: "Checkout status",
    createInvoice: "Create invoice",
    clientCount: "Clients",
    reportUsage: "Report usage",
    consentData: "Client approved data processing for report analysis",
    consentAi: "Client approved AI-generated recommendations",
    consentDelivery: "Client approved Email / PDF / HTML delivery",
    saveConsent: "Save consent",
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
  return body.item ?? body;
}

function applyLanguage(lang = state.lang) {
  state.lang = lang === "en" ? "en" : "zh";
  localStorage.setItem("agencyReportLang", state.lang);
  document.documentElement.lang = state.lang === "en" ? "en" : "zh-Hant";
  $$("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === state.lang));
  $$("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (copy[state.lang][key]) node.textContent = copy[state.lang][key];
  });
  const heroTitle = $("#heroTitle");
  if (heroTitle) {
    heroTitle.innerHTML = state.lang === "en"
      ? "Stop writing reports.<br />Send them instead."
      : '<span class="title-line"><span class="title-word title-word-a">別再</span><span class="title-word title-word-b">寫報告了，</span></span><span class="title-line"><span class="title-word title-word-c">直接</span><span class="title-word title-word-d">發送報告吧。</span></span>';
  }
  const labels = state.lang === "en"
    ? ["Overview", "Case", "Data", "AI", "Delivery", "Billing", "Settings"]
    : ["總覽", "案件", "資料", "AI", "交付", "帳務", "設定"];
  $$("[data-workspace-view]").forEach((button, index) => {
    if (labels[index]) button.textContent = labels[index];
  });
  syncDockLanguageLabels();
  renderUpgradePlans();
}

function applyTheme(theme = state.theme) {
  state.theme = theme === "light" ? "light" : "dark";
  localStorage.setItem("agencyReportTheme", state.theme);
  document.documentElement.classList.toggle("theme-light", state.theme === "light");
  document.documentElement.classList.toggle("theme-dark", state.theme !== "light");
  setText("#dockThemeLabel", state.lang === "en" ? (state.theme === "light" ? "Dark background" : "Light background") : (state.theme === "light" ? "切換深色" : "切換淺色"));
}

function syncDockLanguageLabels() {
  const zh = state.lang !== "en";
  setText("#dockProfileLabel", zh ? "個人檔案" : "Profile");
  setText("#dockUsageLabel", zh ? "剩餘用量" : "Remaining usage");
  setText("#dockUpgradeLabel", zh ? "升級 Pro" : "Upgrade Pro");
  setText("#dockResetLabel", zh ? "可用重設" : "Available reset");
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
  const isAuthed = Boolean(state.auth);
  document.documentElement.classList.toggle("public-landing", !isAuthed);
  $("#overviewHome").hidden = isAuthed;
  $("#caseWorkspace").hidden = !isAuthed;
  $("#report").hidden = !isAuthed;
  $("#logoutBtn").hidden = !isAuthed;
  $("#authGate").hidden = true;
  if (isAuthed) {
    openWorkspace("overview");
    refreshUsage();
    renderWorkspace();
  }
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
    setStatus("#authStatus", "error", state.lang === "en" ? "Sign in failed" : "登入失敗", error.message);
  }
}

async function registerAuth() {
  const payload = {
    name: $("#authName").value.trim() || "AgencyReport AI",
    email: $("#authEmail").value.trim(),
    password: $("#authPassword").value,
  };
  try {
    const auth = await api("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
    setStatus("#authStatus", "ok", state.lang === "en" ? "Account created" : "帳號已建立", auth.user?.email || payload.email);
    setAuthState(auth);
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Registration failed" : "建立帳號失敗", error.message);
  }
}

async function logoutAuth() {
  try { await api("/api/auth/logout", { method: "POST", body: "{}" }); } catch {}
  localStorage.removeItem("agencyReportAuthToken");
  state.auth = null;
  $("#overviewHome").hidden = false;
  $("#caseWorkspace").hidden = true;
  $("#report").hidden = true;
  $("#logoutBtn").hidden = true;
  document.documentElement.classList.add("public-landing");
}

function setStatus(selector, type, title, body = "") {
  const node = $(selector);
  if (!node) return;
  node.className = `status-panel ${type || ""}`.trim();
  node.innerHTML = body ? `<strong>${title}</strong><span>${body}</span>` : `<strong>${title}</strong>`;
}

function openWorkspace(view) {
  const allowed = new Set(["overview", "case", "data", "ai", "delivery", "billing", "settings"]);
  const current = allowed.has(view) ? view : "overview";
  $$("[data-workspace-view]").forEach((button) => button.classList.toggle("active", button.dataset.workspaceView === current));
  $$("[data-workspace-group]").forEach((section) => { section.hidden = section.dataset.workspaceGroup !== current; });
  const info = {
    overview: ["01 / 07", state.lang === "en" ? "Overview command center" : "總覽指揮中心", state.lang === "en" ? "Check case readiness, recent activity, and next action." : "檢查案件健康度、最近活動與下一步。"],
    case: ["02 / 07", state.lang === "en" ? "Client and case" : "客戶與案件", state.lang === "en" ? "Keep client goals and report context clean." : "整理客戶目標與月報上下文。"],
    data: ["03 / 07", state.lang === "en" ? "Data import" : "資料匯入", state.lang === "en" ? "Paste CSV or connect Sheets to build KPI." : "貼上 CSV 或串接 Sheets 產生 KPI。"],
    ai: ["04 / 07", "AI", state.lang === "en" ? "Generate summary, risks, actions, and client wording." : "產生摘要、風險、行動建議與客戶說明。"],
    delivery: ["05 / 07", state.lang === "en" ? "Delivery" : "交付", state.lang === "en" ? "Review, share, email, and record delivery." : "審核、分享、Email 並留下交付紀錄。"],
    billing: ["06 / 07", state.lang === "en" ? "Billing" : "帳務", state.lang === "en" ? "Manage checkout drafts and usage." : "管理付款草稿與 AI 用量。"],
    settings: ["07 / 07", state.lang === "en" ? "Trust settings" : "信任與設定", state.lang === "en" ? "Manage consent and audit notes." : "管理同意與稽核紀錄。"],
  }[current];
  setText("#workspaceFocusStep", info[0]);
  setText("#viewMastheadStep", info[0]);
  setText("#workspaceFocusTitle", info[1]);
  setText("#viewMastheadTitle", info[1]);
  setText("#workspaceFocusCopy", info[2]);
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

function renderReport() {
  const m = state.metrics;
  if (!m) return;
  setText("#coverAgency", $("#agencyName").value || "AgencyReport AI");
  setText("#coverTitle", `${$("#clientName").value || "Demo Client"} ${$("#reportType").selectedOptions[0]?.textContent || "月報"}`);
  setText("#coverMonth", $("#reportMonth").value || "-");
  setText("#qualityPill", `${Math.round(Math.min(m.roas / 5, 1) * 100)}%`);
  setText("#scoreLabel", `${Math.round(Math.min(m.roas / 5, 1) * 100)}%`);
  setText("#reportCommandQuality", state.lang === "en" ? "Ready" : "已就緒");
  const cards = [
    ["ROAS", `${m.roas.toFixed(2)}x`],
    ["CPA", formatMoney(m.cpa)],
    [state.lang === "en" ? "Revenue" : "營收", formatMoney(m.totals.revenue)],
    [state.lang === "en" ? "Growth" : "成長", formatPercent(m.revenueGrowth)],
  ];
  $("#insights").innerHTML = cards.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
  $("#detailTable").innerHTML = `<thead><tr><th>Channel</th><th>Spend</th><th>Revenue</th><th>Conversions</th><th>ROAS</th><th>CPA</th></tr></thead><tbody>${m.channels.map((row) => `<tr><td>${row.channel}</td><td>${formatMoney(row.spend)}</td><td>${formatMoney(row.revenue)}</td><td>${row.conversions}</td><td>${row.roas.toFixed(2)}x</td><td>${formatMoney(row.cpa)}</td></tr>`).join("")}</tbody>`;
  drawCharts();
}

function renderAi() {
  const draft = state.ai || buildRuleDraft();
  if (!draft) return;
  $("#riskList").innerHTML = draft.risks.map((item) => `<div><strong>${item}</strong></div>`).join("");
  $("#recommendations").innerHTML = draft.actions.map((item) => `<div><strong>${item}</strong></div>`).join("");
  $("#aiWorkOrder").innerHTML = `
    <article><span>Summary</span><p>${draft.summary}</p></article>
    <article><span>Client message</span><p>${draft.clientMessage}</p></article>
  `;
  $("#clientReplyDraft").value = draft.clientMessage;
  setText("#reportCommandAi", state.lang === "en" ? "Ready" : "已完成");
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
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.03)";
  ctx.fillRect(0, 0, width, height);
  const max = Math.max(...data.map(([, value]) => Number(value) || 0), 1);
  const gap = 18;
  const barWidth = Math.max(22, (width - gap * (data.length + 1)) / data.length);
  ctx.font = "14px system-ui";
  data.forEach(([label, value], index) => {
    const barHeight = Math.max(8, (Number(value) / max) * (height - 78));
    const x = gap + index * (barWidth + gap);
    const y = height - barHeight - 36;
    const gradient = ctx.createLinearGradient(0, y, 0, height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255,255,255,.18)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.fillText(String(label).slice(0, 12), x, height - 14);
  });
}

function renderWorkspace() {
  const m = state.metrics;
  const steps = [
    Boolean($("#clientName").value),
    Boolean($("#csvInput").value.trim()),
    Boolean(state.ai),
    state.deliveries.length > 0,
    state.invoices.length > 0,
  ];
  const score = Math.round((steps.filter(Boolean).length / steps.length) * 100);
  setText("#launchScore", `${score}%`);
  $("#consoleReadinessBar").style.width = `${score}%`;
  $("#launchChecklist").innerHTML = [
    [steps[0], state.lang === "en" ? "Client context" : "客戶資料"],
    [steps[1], state.lang === "en" ? "CSV data" : "CSV 資料"],
    [steps[2], state.lang === "en" ? "AI analysis" : "AI 分析"],
    [steps[3], state.lang === "en" ? "Delivery record" : "交付紀錄"],
    [steps[4], state.lang === "en" ? "Payment draft" : "付款草稿"],
  ].map(([done, label]) => `<div><span class="${done ? "ok" : ""}">${done ? "OK" : "..."}</span><strong>${label}</strong></div>`).join("");
  $("#homeFeed").innerHTML = [
    [state.lang === "en" ? "Client" : "客戶", $("#clientName").value || "Demo Client"],
    [state.lang === "en" ? "Report" : "報告", $("#reportMonth").value || "-"],
    [state.lang === "en" ? "Revenue" : "營收", m ? formatMoney(m.totals.revenue) : "-"],
    [state.lang === "en" ? "AI usage" : "AI 用量", state.usage ? `${state.usage.used}/${state.usage.limit}` : "0/3"],
  ].map(([a, b]) => `<div><strong>${a}</strong><span>${b}</span></div>`).join("");
  $("#clientList").innerHTML = state.clients.map((c) => `<div><strong>${c.name}</strong><span>${c.month}</span></div>`).join("") || `<div><strong>${$("#clientName").value}</strong><span>${$("#reportMonth").value}</span></div>`;
  $("#clientCount").textContent = String(Math.max(state.clients.length, 1));
  $("#libraryCount").textContent = String(state.reports.length);
  $("#latestReportMonth").textContent = state.reports[0]?.month || "-";
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
  setText("#dockResetValue", state.lang === "en" ? `${remaining} left` : `剩 ${remaining} 次`);
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
    localStorage.setItem("agencyReportInvoices", JSON.stringify(state.invoices));
    setStatus("#upgradeStatus", "ok", state.lang === "en" ? "Checkout draft created" : "付款草稿已建立", intent.checkoutUrl || intent.quoteUrl || "");
    setStatus("#billingStatus", "ok", state.lang === "en" ? "Checkout draft created" : "付款草稿已建立", planDisplayName(plan));
    renderWorkspace();
  } catch (error) {
    setStatus("#upgradeStatus", "error", state.lang === "en" ? "Checkout failed" : "建立付款失敗", error.message);
  }
}

function saveClient() {
  const client = { name: $("#clientName").value, month: $("#reportMonth").value, createdAt: new Date().toISOString() };
  state.clients.unshift(client);
  localStorage.setItem("agencyReportClients", JSON.stringify(state.clients));
  setStatus("#clientHubStatus", "ok", state.lang === "en" ? "Client saved" : "客戶已儲存", client.name);
  renderWorkspace();
}

function saveCurrentReport() {
  const report = { client: $("#clientName").value, month: $("#reportMonth").value, createdAt: new Date().toISOString() };
  state.reports.unshift(report);
  localStorage.setItem("agencyReportReports", JSON.stringify(state.reports));
  renderWorkspace();
}

function deliverReport() {
  const delivery = { email: $("#deliveryEmail").value, month: $("#reportMonth").value, createdAt: new Date().toISOString() };
  state.deliveries.unshift(delivery);
  localStorage.setItem("agencyReportDeliveries", JSON.stringify(state.deliveries));
  $("#deliveryCenter").innerHTML = state.deliveries.map((item) => `<div><strong>${item.email || "client@example.com"}</strong><span>${item.month}</span></div>`).join("");
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

function clearLocalData() {
  ["agencyReportReports", "agencyReportClients", "agencyReportDeliveries", "agencyReportInvoices"].forEach((key) => localStorage.removeItem(key));
  state.reports = [];
  state.clients = [];
  state.deliveries = [];
  state.invoices = [];
  renderWorkspace();
}

function setupEvents() {
  $("#landingLoginBtn")?.addEventListener("click", showAuthGate);
  $("#landingStartBtn")?.addEventListener("click", showAuthGate);
  $("#openCaseDetailBtn")?.addEventListener("click", showAuthGate);
  $(".landing-bottom-start")?.addEventListener("click", showAuthGate);
  $("#homeLoadDemoBtn")?.addEventListener("click", () => { showAuthGate(); });
  $("#closeAuthBtn")?.addEventListener("click", hideAuthGate);
  $("#authForm")?.addEventListener("submit", submitAuth);
  $("#registerBtn")?.addEventListener("click", registerAuth);
  $("#logoutBtn")?.addEventListener("click", logoutAuth);
  $$("[data-lang]").forEach((button) => button.addEventListener("click", () => applyLanguage(button.dataset.lang)));
  $$("[data-workspace-view]").forEach((button) => button.addEventListener("click", () => openWorkspace(button.dataset.workspaceView)));
  $("#viewMastheadAction")?.addEventListener("click", generateReportFromButton);
  $("#workspaceFocusAction")?.addEventListener("click", generateReportFromButton);
  $("#completeDemoBtn")?.addEventListener("click", () => loadSample("ads"));
  $("#insertCsvTemplateBtn")?.addEventListener("click", () => { $("#csvInput").value = samples.ads; });
  $("#downloadSampleBtn")?.addEventListener("click", downloadSampleCsv);
  $("#quickAdsBtn")?.addEventListener("click", () => loadSample("ads"));
  $("#quickSeoBtn")?.addEventListener("click", () => loadSample("seo"));
  $("#quickSocialBtn")?.addEventListener("click", () => loadSample("social"));
  $("#generateBtn")?.addEventListener("click", generateReportFromButton);
  $("#runBackendAiBtn")?.addEventListener("click", runBackendAi);
  $("#saveClientBtn")?.addEventListener("click", saveClient);
  $("#syncClientsBtn")?.addEventListener("click", saveClient);
  $("#saveReportBtn")?.addEventListener("click", saveCurrentReport);
  $("#deliverReportBtn")?.addEventListener("click", deliverReport);
  $("#approveDraftBtn")?.addEventListener("click", () => setStatus("#shareLinkPanel", "ok", state.lang === "en" ? "Draft approved" : "草稿已審核"));
  $("#createShareLinkBtn")?.addEventListener("click", () => setStatus("#shareLinkPanel", "ok", "Share Link", `${location.origin}/report/demo`));
  $("#queueEmailBtn")?.addEventListener("click", () => setStatus("#emailJobPanel", "ok", state.lang === "en" ? "Email draft created" : "Email 草稿已建立"));
  $("#saveAccountBtn")?.addEventListener("click", () => setStatus("#billingStatus", "ok", state.lang === "en" ? "Account saved" : "帳戶已儲存", $("#accountEmail").value));
  $("#createCheckoutBtn")?.addEventListener("click", () => chooseUpgradePlan($("#planSelect").value));
  $("#createInvoiceBtn")?.addEventListener("click", () => chooseUpgradePlan($("#planSelect").value));
  $("#saveConsentBtn")?.addEventListener("click", () => setStatus("#trustStatus", "ok", state.lang === "en" ? "Consent saved" : "同意已儲存"));
  $("#refreshAuditBtn")?.addEventListener("click", () => { setText("#auditCount", "1"); setText("#auditStatus", "OK"); });
  $("#clearLocalBtn")?.addEventListener("click", clearLocalData);
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
    if (action === "profile") openWorkspace("case");
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
  $("#leadForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("#leadStatus", "ok", state.lang === "en" ? "Lead saved" : "名單已儲存", $("#leadEmail").value);
  });
}

async function restoreSession() {
  if (!authToken()) {
    setAuthState(null);
    return;
  }
  try {
    const user = await api("/api/auth/me", { method: "GET" });
    setAuthState({ token: authToken(), user });
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
  restoreSession();
}

Object.assign(window, {
  generateReportFromButton,
  openLimitExceededUpgrade,
  openUpgradeModal,
  runBackendAi,
  showAuthGate,
  syncDockLanguageLabels,
});

init();

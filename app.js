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
  payment: null,
  connectorConnections: [],
  connectorAvailability: {},
  ga4Properties: [],
  ga4Source: null,
  googleAdsCustomers: [],
  googleAdsSource: null,
  metaAdAccounts: [],
  metaAdsSource: null,
  connectorSources: [],
  connectorSyncJobs: [],
  connectorAudits: [],
  connectorReconciliation: null,
  appPage: "home",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const pendingCheckoutKey = "agencyReportPendingCheckoutPlan";

function trackMarketingEvent(name, parameters = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, parameters);
  }
}

const copy = {
  zh: {
    brandProduct: "AgencyReport AI",
    appTitle: "AI 行銷報告平台",
    seoHeroHeading: "AI 行銷月報與廣告報表自動化平台",
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
    heroEyebrow: "AI 行銷月報與廣告報表自動化",
    heroCopy: "匯入 Google Ads、Meta、GA4、CSV 或 Google Sheets，讓 AI 整理 KPI、洞察與可交付的行銷月報。",
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
    sampleClient: "示範牙科品牌 A / 2026-06",
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
    salesFooterTitle: "AgencyReport AI",
    salesFooterCopy: "讓代理商更快完成可交付的月報。",
    footerFeatures: "功能",
    footerWorkflow: "流程",
    footerPricing: "定價",
    footerSolutions: "適用對象",
    footerResources: "資源中心",
    footerContact: "開始使用",
    salesFooterCopyright: "© 2026 Virtual Trend Works. All rights reserved.",
    solutionsKicker: "Solutions",
    solutionsTitle: "不只代理商，任何需要把行銷成果說清楚的人都能使用",
    solutionsCopy: "保留專業交付流程，也讓接案者與品牌團隊快速從資料走到決策。",
    solutionAgencyTitle: "行銷代理商",
    solutionAgencyCopy: "把多客戶的投放資料、洞察與交付紀錄變成可複製的月報服務。",
    solutionFreelancerTitle: "接案者與行銷顧問",
    solutionFreelancerCopy: "不必先建 BI 看板，也能把客戶提供的 CSV 或 Sheets 變成專業說明稿。",
    solutionInHouseTitle: "品牌行銷團隊",
    solutionInHouseCopy: "把廣告、網站與內容成果整理成主管與跨部門能快速理解的月度決策報告。",
    solutionLink: "查看適用流程",
    resourceGuideLink: "閱讀完整指南",
    feedbackLauncher: "意見回饋",
    feedbackTitle: "回報問題或提出建議",
    feedbackCopy: "告訴我們哪裡卡住、想要什麼功能，或付款/串接遇到什麼狀況。",
    feedbackType: "回饋類型",
    feedbackBug: "功能問題",
    feedbackIdea: "功能建議",
    feedbackConnector: "資料串接",
    feedbackBilling: "付款方案",
    feedbackGeneral: "其他",
    feedbackMessage: "回饋內容",
    feedbackPlaceholder: "請描述你遇到的問題、目前頁面、希望的結果，或任何建議。",
    feedbackEmailUs: "直接寄信",
    feedbackSubmit: "送出回饋",
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
    brandProduct: "AgencyReport AI",
    appTitle: "AI Marketing Reporting Platform",
    seoHeroHeading: "AI marketing reporting and advertising report automation platform",
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
    heroEyebrow: "AI marketing reporting and automation",
    heroCopy: "Bring in Google Ads, Meta, GA4, CSV, or Google Sheets data. AI turns it into KPIs, insights, and a client-ready monthly report.",
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
    sampleClient: "Demo Dental Brand A / 2026-06",
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
    salesFooterTitle: "AgencyReport AI",
    salesFooterCopy: "Client-ready monthly reporting for modern agencies.",
    footerFeatures: "Features",
    footerWorkflow: "Workflow",
    footerPricing: "Pricing",
    footerSolutions: "Solutions",
    footerResources: "Resources",
    footerContact: "Get started",
    salesFooterCopyright: "© 2026 Virtual Trend Works. All rights reserved.",
    solutionsKicker: "Solutions",
    solutionsTitle: "Built for every team that needs to explain marketing results clearly",
    solutionsCopy: "Keep the agency-grade delivery workflow while making the path from source data to decisions simple for freelancers and brand teams.",
    solutionAgencyTitle: "Marketing agencies",
    solutionAgencyCopy: "Turn multi-client campaign data, insights, and delivery records into a repeatable reporting service.",
    solutionFreelancerTitle: "Freelancers and consultants",
    solutionFreelancerCopy: "Turn client CSV or Google Sheets data into a clear professional report without building a BI dashboard first.",
    solutionInHouseTitle: "In-house marketing teams",
    solutionInHouseCopy: "Turn advertising, website, and content performance into a monthly decision report leaders can understand quickly.",
    solutionLink: "See the workflow",
    resourceGuideLink: "Read the full guide",
    feedbackLauncher: "Feedback",
    feedbackTitle: "Report an issue or suggest an improvement",
    feedbackCopy: "Tell us where you got stuck, which feature you need, or what happened with billing or integrations.",
    feedbackType: "Feedback type",
    feedbackBug: "Product issue",
    feedbackIdea: "Feature idea",
    feedbackConnector: "Data integration",
    feedbackBilling: "Billing plan",
    feedbackGeneral: "Other",
    feedbackMessage: "Message",
    feedbackPlaceholder: "Describe the issue, current page, expected result, or any suggestion.",
    feedbackEmailUs: "Email us",
    feedbackSubmit: "Send feedback",
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

Object.assign(copy.zh, {
  brandProduct: "AgencyReport AI",
  appTitle: "AI 行銷報告平台",
  seoHeroHeading: "AI 行銷月報與廣告報表自動化平台",
  navFeatures: "功能",
  navWorkflow: "流程",
  navSamples: "範例",
  navPricing: "定價",
  navContact: "聯絡",
  login: "登入",
  logout: "登出",
  startFree: "免費產生第一份月報",
  viewSample: "查看範例月報",
  heroEyebrow: "給代理商、接案者與品牌團隊的 AI 行銷月報工具",
  heroCopy: "上傳 Google Ads、Meta、GA4、CSV 或 Google Sheets，AgencyReport AI 會整理 KPI、圖表、洞察、下月行動與可交付 PDF。",
  heroAiTitle: "AI 下月行動建議",
  heroAiCopy: "自動找出最佳渠道、最弱渠道與預算調整方向，直接變成客戶看得懂的說明稿。",
  trustTrial: "免費試做第一份月報",
  trustImport: "CSV / Sheets / 文字需求皆可",
  trustAi: "AI 摘要、風險與行動建議",
  proofOneLabel: "節省時間",
  proofOneValue: "6 小時",
  proofOneCopy: "每位客戶每月少掉整理、截圖與撰稿時間。",
  proofTwoLabel: "交付格式",
  proofTwoValue: "PDF / HTML",
  proofTwoCopy: "產出可審稿、可下載、可再次調用的月報。",
  proofThreeLabel: "AI 內容",
  proofThreeValue: "4 種",
  proofThreeCopy: "摘要、風險、下月行動與客戶說明稿一次完成。",
  featureOneTitle: "丟資料就能開始",
  featureOneCopy: "不用先設定複雜欄位，貼上客戶需求、CSV 或 Sheets 連結即可讓 AI 整理案件。",
  featureTwoTitle: "AI 產生洞察",
  featureTwoCopy: "自動產生執行摘要、KPI 解讀、風險提醒、下月優化與客戶說明稿。",
  featureThreeTitle: "專業月報版型",
  featureThreeCopy: "把廣告、SEO、社群數據整理成代理商可交付的品牌化月報。",
  featureFourTitle: "交付與收款",
  featureFourCopy: "支援 PDF / HTML 匯出、付款紀錄與交付流程，讓月報變成可重複銷售服務。",
  workflowKicker: "流程",
  workflowTitle: "四個步驟，把月報變成可重複交付的系統",
  workflowCopy: "從資料收集到 AI 產出，再到品牌化交付，每一步都為小型代理商設計。",
  stepOneLabel: "輸入",
  stepOneTitle: "丟入資料",
  stepOneCopy: "客戶需求、報告月份、CSV、Google Sheets 或網站資料。",
  stepTwoLabel: "理解",
  stepTwoTitle: "AI 整理脈絡",
  stepTwoCopy: "辨識產業、KPI、最佳渠道、最弱渠道與需要補充的內容。",
  stepThreeLabel: "產出",
  stepThreeTitle: "生成月報",
  stepThreeCopy: "產生摘要、KPI 總覽、原因分析、風險與下月行動計畫。",
  stepFourLabel: "交付",
  stepFourTitle: "匯出與追蹤",
  stepFourCopy: "匯出 PDF / HTML，建立交付紀錄，之後可再次調用月報。",
  sampleTitle: "先看三種代理商常見月報範例",
  sampleCopy: "電商、診所、課程品牌都能用同一套流程，把數據轉成客戶看得懂的結論與行動。",
  sampleClient: "示範牙科品牌 A / 2026-06",
  sampleHeadline: "搜尋廣告 ROAS 成長，Meta CPA 需要控管",
  sampleKpiRevenueLabel: "營收",
  sampleKpiRoasLabel: "ROAS",
  sampleKpiBestLabel: "最佳渠道",
  sampleInsightOne: "本月營收與轉換數提升，最佳渠道為 Google Search，建議延伸高意圖關鍵字。",
  sampleInsightTwo: "下月優先降低 Meta 低效受眾預算，並測試新的落地頁 CTA。",
  sampleDeliverablesLabel: "報告包含",
  sampleDeliverableOne: "執行摘要",
  sampleDeliverableTwo: "KPI 總覽",
  sampleDeliverableThree: "數據洞察",
  sampleDeliverableFour: "下月行動計畫",
  pricingTitle: "先免費驗證，再升級成代理商交付系統",
  pricingCopy: "從單人工作室到小型代理商，依照月報量、客戶數與自動化程度升級。",
  starterPlanName: "入門版",
  agencyPlanName: "代理商版",
  professionalPlanName: "專業版",
  starterPrice: "NT$790/月",
  agencyPrice: "NT$2,490/月",
  whiteLabelPrice: "NT$5,990/月",
  starterCopy: "每月 10 份 AI 月報、CSV/Sheets 匯入、AI 建議、PDF/HTML 匯出。",
  agencyCopy: "每月 50 份 AI 月報、多客戶、品牌化報告、付款與交付紀錄。",
  whiteLabelCopy: "150 份 AI 月報、客戶入口、Email 草稿、白標與進階 AI 分析。",
  finalTitle: "今天就產生第一份可以交付客戶的 AI 月報",
  finalCopy: "先用範例資料體驗流程，再把自己的客戶資料丟給 AI 整理成正式月報。",
  salesFooterTitle: "AgencyReport AI",
  salesFooterCopy: "讓代理商更快完成可交付的月報。",
  footerFeatures: "功能",
  footerWorkflow: "流程",
  footerPricing: "定價",
  footerSolutions: "適用對象",
  footerResources: "資源中心",
  footerContact: "開始使用",
  salesFooterCopyright: "© 2026 Virtual Trend Works. All rights reserved.",
  resourceGuideLink: "閱讀完整指南",
  audienceTitle: "最適合這些正在做月報的人",
  audienceCopy: "不是大型 BI 平台，而是幫代理商把每月重複交付變快、變漂亮、變容易續約。",
  audienceOneTitle: "小型行銷代理商",
  audienceOneCopy: "固定替 5-50 位客戶做廣告、SEO 或社群月報，需要降低整理時間。",
  audienceTwoTitle: "接案廣告投手",
  audienceTwoCopy: "每月要把 Google Ads、Meta、GA4 數據說清楚，讓客戶理解成果與下一步。",
  audienceThreeTitle: "網站與內容工作室",
  audienceThreeCopy: "想把月報包裝成可加購服務，提升客戶維護與續約價值。",
  templateTitle: "免費月報範本與導流素材",
  templateCopy: "用三種常見產業範本讓新客戶快速理解產出結果，也能作為社群與 SEO 導流頁。",
  templateEcomTitle: "電商廣告月報",
  templateEcomCopy: "ROAS、CPA、營收、渠道占比與預算轉移建議。",
  templateClinicTitle: "診所集客月報",
  templateClinicCopy: "搜尋意圖、預約轉換、在地曝光與下月關鍵字策略。",
  templateCourseTitle: "課程品牌月報",
  templateCourseCopy: "名單成本、內容互動、轉換漏斗與素材測試方向。",
  faqTitle: "上線導流前，訪客最常問的問題",
  faqOneTitle: "我一定要串接 Google Ads / Meta / GA4 嗎？",
  faqOneCopy: "不用。初期可以直接貼 CSV、Sheets 或客戶需求，AI 會先產生可交付月報；正式串接可作為進階功能。",
  faqTwoTitle: "AI 會取代代理商判斷嗎？",
  faqTwoCopy: "不會。AI 負責整理、解讀與起草，代理商仍能審稿、調整語氣與決定策略。",
  faqThreeTitle: "適合拿來賣給客戶嗎？",
  faqThreeCopy: "適合。產品重點是把月報包裝成穩定、可重複交付的服務，並提供 PDF / HTML 交付。",
});

Object.assign(copy.en, {
  startFree: "Generate your first report free",
  viewSample: "View sample report",
  heroEyebrow: "AI marketing reports for agencies, freelancers, and brand teams",
  heroCopy: "Upload Google Ads, Meta, GA4, CSV, or Google Sheets data. AgencyReport AI turns it into KPI, charts, insights, next actions, and a deliverable PDF.",
  trustTrial: "First report free",
  trustImport: "CSV / Sheets / brief supported",
  trustAi: "AI summary, risks, and actions",
  proofOneLabel: "Time saved",
  proofOneValue: "6 hours",
  proofOneCopy: "Reduce monthly formatting, screenshots, and writing time per client.",
  proofTwoLabel: "Delivery format",
  proofTwoValue: "PDF / HTML",
  proofTwoCopy: "Create reviewable, downloadable reports that can be reopened later.",
  proofThreeLabel: "AI content",
  proofThreeValue: "4 types",
  proofThreeCopy: "Summary, risks, next actions, and client-ready wording in one flow.",
  workflowTitle: "Four steps turn monthly reports into a repeatable delivery system",
  sampleTitle: "Start with three agency report examples",
  sampleCopy: "E-commerce, clinics, and course brands can use the same workflow to turn raw data into client-readable decisions.",
  sampleKpiRevenueLabel: "Revenue",
  sampleKpiRoasLabel: "ROAS",
  sampleKpiBestLabel: "Best channel",
  sampleDeliverablesLabel: "Includes",
  sampleDeliverableOne: "Executive summary",
  sampleDeliverableTwo: "KPI overview",
  sampleDeliverableThree: "Data insights",
  sampleDeliverableFour: "Next-month action plan",
  pricingTitle: "Validate free, then upgrade into an agency delivery system",
  pricingCopy: "Scale by report volume, clients, and automation depth.",
  finalTitle: "Generate a client-ready AI report today",
  finalCopy: "Try the sample data first, then let AI organize your own client data into a formal monthly report.",
  audienceTitle: "Built for teams that already deliver monthly reports",
  audienceCopy: "This is not a heavy BI platform. It helps agencies make recurring reporting faster, clearer, and easier to sell.",
  audienceOneTitle: "Small marketing agencies",
  audienceOneCopy: "For teams reporting ads, SEO, or social performance to 5-50 clients each month.",
  audienceTwoTitle: "Freelance media buyers",
  audienceTwoCopy: "Explain Google Ads, Meta, and GA4 results clearly so clients understand performance and next steps.",
  audienceThreeTitle: "Web and content studios",
  audienceThreeCopy: "Package reporting as an add-on service that improves retention and recurring revenue.",
  templateTitle: "Free report templates for acquisition",
  templateCopy: "Use industry examples to show prospects what the output looks like before they sign up.",
  templateEcomTitle: "E-commerce ads report",
  templateEcomCopy: "ROAS, CPA, revenue, channel mix, and budget shift recommendations.",
  templateClinicTitle: "Clinic acquisition report",
  templateClinicCopy: "Search intent, booking conversion, local visibility, and next-month keyword strategy.",
  templateCourseTitle: "Course brand report",
  templateCourseCopy: "Lead cost, content engagement, funnel conversion, and creative testing direction.",
  faqTitle: "Questions prospects ask before trying it",
  faqOneTitle: "Do I need Google Ads, Meta, or GA4 integrations?",
  faqOneCopy: "No. You can start with CSV, Sheets, or a client brief. Native integrations can be added as an advanced workflow.",
  faqTwoTitle: "Does AI replace agency strategy?",
  faqTwoCopy: "No. AI organizes and drafts the report; agencies still review, adjust the tone, and make strategic decisions.",
  faqThreeTitle: "Can I sell this as a client service?",
  faqThreeCopy: "Yes. The product is designed to turn reporting into a repeatable, client-ready PDF / HTML deliverable.",
});

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
    const error = new Error(body.error || body.message || body.code || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = body.code;
    error.details = body.item;
    error.providerStatus = body.providerStatus;
    error.providerMessage = body.providerMessage;
    error.providerReason = body.providerReason;
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
  $$("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (copy[state.lang][key]) node.placeholder = copy[state.lang][key];
  });
  const clientName = $("#clientName");
  if (clientName) {
    if (state.lang === "en" && clientName.value === "示範牙科品牌 A") clientName.value = "Demo Dental Brand A";
    if (state.lang !== "en" && clientName.value === "Demo Dental Brand A") clientName.value = "示範牙科品牌 A";
  }
  const heroTitle = $("#heroTitle");
  if (heroTitle) {
    heroTitle.innerHTML = state.lang === "en"
      ? "Stop writing reports.<br />Send them instead."
      : '<span class="title-line"><span class="title-word title-word-a">別再</span><span class="title-word title-word-b">寫報告了，</span></span><span class="title-line"><span class="title-word title-word-c">直接</span><span class="title-word title-word-d">發送報告吧。</span></span>';
  }
  if (heroTitle) {
    heroTitle.innerHTML = state.lang === "en"
      ? 'Turn marketing data into<br /><span class="title-accent">client-ready reports.</span>'
      : '<span class="title-line">把行銷數據變成</span><span class="title-line title-accent">客戶看得懂的 AI 月報。</span>';
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
  updatePaymentAvailability();
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
  apply("#accountDataCopy", "管理登入安全、資料備份與帳號刪除。", "Manage login security, data backups, and account deletion.");
  apply("#accountPasswordTitle", "帳戶安全", "Account security");
  apply("#accountPasswordCopy", "更新登入密碼。新密碼至少需要 10 個字元。", "Update your sign-in password. The new password needs at least 10 characters.");
  apply("#currentPasswordLabel", "目前密碼", "Current password");
  apply("#newPasswordLabel", "新密碼", "New password");
  apply("#confirmNewPasswordLabel", "確認新密碼", "Confirm new password");
  apply("#changePasswordBtn", "更新密碼", "Update password");
  apply("#accountExportTitle", "資料備份", "Data backup");
  apply("#accountExportCopy", "下載帳號、專案、月報與交付紀錄的 JSON 副本。", "Download a JSON copy of account, project, report, and delivery records.");
  apply("#exportAccountDataBtn", "下載我的資料", "Download my data");
  apply("#openDeleteAccountBtn", "刪除帳號", "Delete account");
  apply("#deleteAccountTitle", "永久刪除帳號", "Permanently delete account");
  apply("#deleteAccountCopy", "此操作無法復原。請輸入目前密碼，並在確認欄輸入 DELETE。", "This cannot be undone. Enter your current password and type DELETE in the confirmation field.");
  apply("#deletePasswordLabel", "目前密碼", "Current password");
  apply("#deleteConfirmationLabel", "確認文字", "Confirmation text");
  apply("#connectorSettingsTitle", "資料串接", "Data connections");
  apply("#connectorSettingsCopy", "授權廣告與分析平台，讓系統自動同步月報資料。", "Authorize advertising and analytics platforms for automatic report synchronization.");
  apply("#ga4PropertyLabel", "GA4 Property", "GA4 Property");
  apply("#loadGa4PropertiesBtn", "載入 Properties", "Load properties");
  apply("#selectGa4PropertyBtn", "使用此 Property", "Use this property");
  apply("#syncGa4Btn", "立即同步", "Sync now");
  apply("#googleAdsCustomerLabel", "Google Ads 廣告帳戶", "Google Ads account");
  apply("#loadGoogleAdsCustomersBtn", "載入廣告帳戶", "Load ad accounts");
  apply("#selectGoogleAdsCustomerBtn", "使用此帳戶", "Use this account");
  apply("#syncGoogleAdsBtn", "立即同步", "Sync now");
  apply("#metaAdAccountLabel", "Meta Ads 廣告帳戶", "Meta Ads account");
  apply("#loadMetaAdAccountsBtn", "載入廣告帳戶", "Load ad accounts");
  apply("#selectMetaAdAccountBtn", "使用此帳戶", "Use this account");
  apply("#syncMetaAdsBtn", "立即同步", "Sync now");
  apply("#connectorSyncTitle", "自動同步狀態", "Automatic sync status");
  apply("#connectorSyncCopy", "查看每個資料源的最近執行結果、下次排程與錯誤。", "Review the latest result, next schedule, and errors for every data source.");
  apply("#refreshConnectorStatusBtn", "更新狀態", "Refresh status");
  apply("#connectorReconcileTitle", "資料對帳", "Data reconciliation");
  apply("#connectorAuditTitle", "串接稽核紀錄", "Connector audit trail");
  renderConnectorSettings();
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
  apply("#homeTabBtn", "首頁", "Home");
  apply("#workspaceTabBtn", "工作區", "Workspace");
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
  else if (!auth) localStorage.removeItem("agencyReportAuthToken");
  const isAuthed = Boolean(state.auth);
  loadScopedWorkspaceState();
  $("#landingLoginBtn").hidden = isAuthed;
  $("#landingStartBtn").hidden = isAuthed;
  $("#logoutBtn").hidden = !isAuthed;
  $("#authGate").hidden = true;
  if (isAuthed) {
    refreshUsage();
    syncReportsFromServer();
    loadConnectorConnections();
    renderWorkspace();
  }
  showAppPage(state.appPage || "home");
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
  if (!state.auth && !authToken()) return;
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

function rememberPendingCheckout(plan) {
  if (plan) sessionStorage.setItem(pendingCheckoutKey, plan);
}

function checkoutUrlFromIntent(intent) {
  const url = intent?.checkoutUrl || intent?.quoteUrl;
  return url ? new URL(url, location.origin).href : "";
}

function continueToCheckout(intent, checkoutWindow = null) {
  const checkoutUrl = checkoutUrlFromIntent(intent);
  if (!checkoutUrl) return false;
  if (checkoutWindow && !checkoutWindow.closed) {
    checkoutWindow.location.href = checkoutUrl;
    checkoutWindow.focus?.();
  } else {
    const openedWindow = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    if (!openedWindow) window.location.assign(checkoutUrl);
  }
  return true;
}

function checkoutPlaceholderHtml(plan) {
  const zh = state.lang !== "en";
  const planName = planDisplayName(plan);
  return `<!doctype html>
<html lang="${zh ? "zh-Hant" : "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${zh ? "正在開啟付款頁" : "Opening checkout"} | AgencyReport AI</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; color: #eef7f5; background: radial-gradient(circle at 18% 12%, rgba(139,245,223,.24), transparent 28%), linear-gradient(135deg, #07110f, #14201f 48%, #0f172a); }
    main { width: min(520px, calc(100vw - 40px)); padding: 34px; border: 1px solid rgba(139,245,223,.26); border-radius: 22px; background: rgba(15, 23, 42, .82); box-shadow: 0 28px 80px rgba(0,0,0,.34); }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: #061946; font-weight: 950; background: linear-gradient(135deg, #8bf5df, #3bd8ff); }
    .eyebrow { margin: 0; color: #8bf5df; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 0 0 10px; font-size: clamp(28px, 6vw, 42px); line-height: 1.08; }
    p { margin: 0; color: #aebfbc; line-height: 1.7; }
    .plan { margin: 22px 0; padding: 16px; border: 1px solid rgba(139,245,223,.2); border-radius: 16px; background: rgba(139,245,223,.08); }
    .plan span { display: block; color: #8bf5df; font-size: 12px; font-weight: 900; }
    .plan strong { display: block; margin-top: 5px; font-size: 24px; }
    .loader { width: 54px; height: 54px; margin: 26px 0 10px; border: 4px solid rgba(139,245,223,.22); border-top-color: #3bd8ff; border-radius: 999px; animation: spin .8s linear infinite; }
    small { color: #7f918e; }
    a, button { display: inline-flex; margin-top: 22px; min-height: 42px; align-items: center; justify-content: center; padding: 0 18px; border: 0; border-radius: 12px; color: #061946; background: linear-gradient(135deg, #8bf5df, #3bd8ff); font-weight: 900; text-decoration: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <main>
    <div class="brand"><span class="mark">AR</span><div><p class="eyebrow">AgencyReport AI</p><strong>Virtual Trend Works</strong></div></div>
    <h1>${zh ? "正在建立安全付款頁" : "Preparing secure checkout"}</h1>
    <p>${zh ? "我們正在建立綠界付款單並準備跳轉，通常只需要幾秒鐘。請不要關閉這個分頁。" : "We are creating your ECPay checkout session. This usually takes a few seconds. Please keep this tab open."}</p>
    <div class="plan"><span>${zh ? "選擇方案" : "Selected plan"}</span><strong>${planName}</strong></div>
    <div class="loader" aria-hidden="true"></div>
    <small>${zh ? "如果停留太久，請回到原頁面重新點選方案。" : "If this takes too long, return to the original page and choose the plan again."}</small>
  </main>
</body>
</html>`;
}

function checkoutErrorHtml(error) {
  const zh = state.lang !== "en";
  return `<!doctype html><html lang="${zh ? "zh-Hant" : "en"}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${zh ? "付款頁建立失敗" : "Checkout failed"}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;background:#f6f8f7;color:#10201f}main{width:min(520px,calc(100vw - 40px));padding:30px;border:1px solid #d9e3df;border-radius:18px;background:white;box-shadow:0 22px 70px rgba(15,23,42,.14)}h1{margin:0 0 10px}p{color:#60706d;line-height:1.7}button{min-height:42px;padding:0 18px;border:0;border-radius:12px;background:#10201f;color:white;font-weight:900}</style></head><body><main><h1>${zh ? "付款頁建立失敗" : "Checkout could not be created"}</h1><p>${String(error?.message || error || "").replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[char]))}</p><button onclick="window.close()">${zh ? "關閉分頁" : "Close tab"}</button></main></body></html>`;
}

function writeCheckoutWindow(checkoutWindow, html) {
  if (!checkoutWindow || checkoutWindow.closed) return;
  checkoutWindow.document.open();
  checkoutWindow.document.write(html);
  checkoutWindow.document.close();
}

function openCheckoutPlaceholder(plan) {
  const loadingUrl = URL.createObjectURL(new Blob([checkoutPlaceholderHtml(plan)], { type: "text/html;charset=utf-8" }));
  const checkoutWindow = window.open(loadingUrl, "_blank");
  if (checkoutWindow) {
    checkoutWindow.opener = null;
    checkoutWindow.focus?.();
    window.setTimeout(() => URL.revokeObjectURL(loadingUrl), 30000);
  } else {
    URL.revokeObjectURL(loadingUrl);
  }
  return checkoutWindow;
}

function showAppPage(page = "home") {
  const nextPage = page === "workspace" ? "workspace" : "home";
  if (nextPage === "workspace" && !state.auth) {
    showAuthGate();
    setStatus(
      "#authStatus",
      "warning",
      state.lang === "en" ? "Sign in to open workspace" : "請先登入工作區",
      state.lang === "en" ? "The homepage stays available; the workspace is for signed-in accounts." : "首頁仍可瀏覽，工作區需要登入後使用。"
    );
    return;
  }
  state.appPage = nextPage;
  const isHome = nextPage === "home";
  document.documentElement.classList.toggle("public-landing", isHome);
  $("#overviewHome").hidden = !isHome;
  $("#caseWorkspace").hidden = isHome;
  $("#report").hidden = isHome || !state.metrics;
  $("#authGate").hidden = true;
  $$("[data-app-page]").forEach((button) => button.classList.toggle("active", button.dataset.appPage === nextPage));
  if (!isHome) {
    openWorkspace("overview");
    renderWorkspace();
  }
}

async function resumePendingCheckout() {
  if (!state.auth) return;
  const plan = sessionStorage.getItem(pendingCheckoutKey);
  if (!plan) return;
  sessionStorage.removeItem(pendingCheckoutKey);
  await chooseUpgradePlan(plan, { resumed: true });
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
    resumePendingCheckout();
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
      language: state.lang,
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
    await api("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email, language: state.lang }) });
    setStatus("#authStatus", "ok", state.lang === "en" ? "Verification email requested" : "已重新申請驗證信", state.lang === "en" ? "Check your inbox and spam folder." : "請檢查收件匣與垃圾郵件匣。" );
  } catch (error) {
    setStatus("#authStatus", "error", state.lang === "en" ? "Unable to resend" : "無法重新寄送", error.message);
  }
}

async function requestPasswordReset() {
  const email = $("#authEmail").value.trim();
  if (!email) return setStatus("#authStatus", "warning", state.lang === "en" ? "Enter your email" : "請先輸入 Email");
  try {
    await api("/api/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email, language: state.lang }) });
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
  const connector = params.get("connector");
  const connectorStatus = params.get("status");
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
  if (connector && connectorStatus === "connected" && state.auth) {
    await loadConnectorConnections();
    showAppPage("workspace");
    openWorkspace("settings");
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Connection authorized" : "資料串接授權完成", connectorLabels[connector]?.[state.lang === "en" ? "en" : "zh"] || connector);
    history.replaceState({}, "", location.pathname);
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
  $("#landingLoginBtn").hidden = false;
  $("#landingStartBtn").hidden = false;
  $("#logoutBtn").hidden = true;
  showAppPage("home");
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

async function changeAccountPassword() {
  const currentPassword = $("#currentPasswordInput")?.value || "";
  const newPassword = $("#newPasswordInput")?.value || "";
  const confirmPassword = $("#confirmNewPasswordInput")?.value || "";
  if (!currentPassword || !newPassword || !confirmPassword) {
    return setStatus(
      "#accountDataStatus",
      "warning",
      state.lang === "en" ? "Password fields required" : "請完整填寫密碼",
      state.lang === "en" ? "Enter your current password and confirm the new password." : "請輸入目前密碼，並再次確認新密碼。"
    );
  }
  if (newPassword.length < 10) {
    return setStatus(
      "#accountDataStatus",
      "warning",
      state.lang === "en" ? "Password too short" : "密碼太短",
      state.lang === "en" ? "Use at least 10 characters for the new password." : "新密碼至少需要 10 個字元。"
    );
  }
  if (newPassword !== confirmPassword) {
    return setStatus(
      "#accountDataStatus",
      "warning",
      state.lang === "en" ? "Passwords do not match" : "新密碼不一致",
      state.lang === "en" ? "Confirm the new password again." : "請重新確認新密碼。"
    );
  }
  try {
    await api("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
    ["#currentPasswordInput", "#newPasswordInput", "#confirmNewPasswordInput"].forEach((selector) => {
      const input = $(selector);
      if (input) input.value = "";
    });
    setStatus(
      "#accountDataStatus",
      "ok",
      state.lang === "en" ? "Password updated" : "密碼已更新",
      state.lang === "en" ? "Other active sessions were revoked for account safety." : "為了帳戶安全，其他已登入工作階段已撤銷。"
    );
  } catch (error) {
    setStatus("#accountDataStatus", "error", state.lang === "en" ? "Unable to update password" : "無法更新密碼", error.message);
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
  $("#insights").innerHTML = cards.map(([label, value, note]) => `<article><span>${escapeLibraryText(label)}</span><strong>${escapeLibraryText(value)}</strong><small>${escapeLibraryText(note)}</small></article>`).join("");
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
  ].map(([a, b]) => `<div><strong>${escapeLibraryText(a)}</strong><span>${escapeLibraryText(b)}</span></div>`).join("");
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
  if (!state.auth && !authToken()) return;
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
  const checkoutEnabled = state.payment?.checkoutEnabled !== false;
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
      <button type="button" data-upgrade-plan="${key}" ${checkoutEnabled ? "" : "disabled"}>${checkoutEnabled ? (zh ? "選擇方案" : "Choose plan") : (zh ? "收款審核中" : "Checkout pending")}</button>
    </article>`;
  }).join("");
  setText("#upgradeStatus", checkoutEnabled
    ? (zh ? "選擇方案後前往安全付款頁。" : "Choose a plan to continue to secure checkout.")
    : (zh ? "綠界正式收款審核中，目前不會建立付款單。" : "ECPay production review is in progress. No payment will be created."));
}

function updatePaymentAvailability() {
  const enabled = state.payment?.checkoutEnabled !== false;
  const button = $("#createCheckoutBtn");
  if (button) {
    button.disabled = !enabled;
    button.textContent = enabled
      ? (state.lang === "en" ? "Continue to payment" : "前往付款")
      : (state.lang === "en" ? "Checkout pending" : "收款審核中");
  }
  setText("#checkoutStatus", enabled
    ? (state.lang === "en" ? "Available" : "可付款")
    : (state.lang === "en" ? "Under review" : "審核中"));
  renderUpgradePlans();
}

async function refreshPaymentAvailability() {
  try {
    const health = await api("/api/health");
    state.payment = health.payment || { checkoutEnabled: false };
    state.connectorAvailability = health.connectors || {};
  } catch {
    state.payment = { checkoutEnabled: false };
    state.connectorAvailability = {};
  }
  updatePaymentAvailability();
  renderConnectorSettings();
}

function openUpgradeModal() {
  renderUpgradePlans();
  $("#upgradeModal").hidden = false;
}

function closeUpgradeModal() {
  $("#upgradeModal").hidden = true;
}

function openFeedbackModal() {
  const email = state.auth?.user?.email || $("#authEmail")?.value || $("#accountEmail")?.value || "";
  if ($("#feedbackEmail") && !$("#feedbackEmail").value) $("#feedbackEmail").value = email;
  $("#feedbackModal").hidden = false;
  setStatus("#feedbackStatus", "", "", "");
  setTimeout(() => $("#feedbackMessage")?.focus(), 0);
}

function closeFeedbackModal() {
  $("#feedbackModal").hidden = true;
}

function openFeedbackEmail() {
  const subject = encodeURIComponent("AgencyReport AI feedback");
  const body = encodeURIComponent(`${$("#feedbackMessage")?.value || ""}\n\nPage: ${location.href}`);
  location.href = `mailto:chenbobe12@gmail.com?subject=${subject}&body=${body}`;
}

async function submitFeedback(event) {
  event.preventDefault();
  const zh = state.lang !== "en";
  const message = $("#feedbackMessage")?.value.trim() || "";
  if (message.length < 8) {
    setStatus("#feedbackStatus", "warning", zh ? "請多補充一些內容" : "Add a little more detail", zh ? "至少描述你遇到的狀況或想要的功能。" : "Describe the issue or feature you need.");
    return;
  }
  const button = $("#feedbackSubmitBtn");
  if (button) button.disabled = true;
  setStatus("#feedbackStatus", "", zh ? "正在送出回饋" : "Sending feedback", zh ? "我們會把這筆意見保存到後台紀錄。" : "This will be stored in the feedback log.");
  try {
    await api("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        type: $("#feedbackType")?.value || "general",
        email: $("#feedbackEmail")?.value.trim() || state.auth?.user?.email || "",
        name: state.auth?.user?.name || $("#authName")?.value || "",
        message,
        page: location.href,
        language: state.lang,
      }),
    });
    $("#feedbackMessage").value = "";
    setStatus("#feedbackStatus", "ok", zh ? "已收到，謝謝你的回饋" : "Received, thank you", zh ? "這筆意見已存入後台，會用來排下一批優化。" : "Your note was saved and will help prioritize the next improvements.");
  } catch (error) {
    setStatus("#feedbackStatus", "error", zh ? "送出失敗" : "Unable to send", `${error.message} · ${zh ? "也可以按「直接寄信」聯絡我們。" : "You can also use Email us."}`);
  } finally {
    if (button) button.disabled = false;
  }
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

async function chooseUpgradePlan(plan, options = {}) {
  const zh = state.lang !== "en";
  if (state.payment?.checkoutEnabled === false) {
    setStatus("#upgradeStatus", "warn", zh ? "正式收款審核中" : "Checkout is under review", zh ? "目前不會建立付款單或扣款。" : "No payment has been created.");
    return;
  }
  if (!state.auth && !authToken()) {
    rememberPendingCheckout(plan);
    closeUpgradeModal();
    showAuthGate();
    setStatus(
      "#authStatus",
      "warning",
      zh ? "請先登入或建立帳號" : "Sign in to continue",
      zh ? "登入後會自動帶你前往綠界安全付款頁。" : "After signing in, we will continue to secure ECPay checkout."
    );
    return;
  }
  const planSelect = $("#planSelect");
  if (planSelect) planSelect.value = plan;
  const payload = {
    plan,
    currency: $("#currency")?.value || "TWD",
    accountName: $("#accountName")?.value || $("#agencyName")?.value || state.auth?.user?.name || "AgencyReport AI",
    accountEmail: $("#accountEmail")?.value || state.auth?.user?.email,
  };
  const checkoutWindow = options.resumed ? null : openCheckoutPlaceholder(plan);
  setStatus("#upgradeStatus", "", zh ? "正在建立綠界付款頁" : "Preparing ECPay checkout", zh ? "付款頁會在新分頁開啟，請稍候幾秒。" : "Checkout opens in a new tab. Please wait a few seconds.");
  try {
    const intent = await api("/api/billing/checkout", { method: "POST", body: JSON.stringify(payload) });
    state.invoices.unshift(intent);
    localStorage.setItem(scopedWorkspaceKey("agencyReportInvoices"), JSON.stringify(state.invoices));
    const checkoutUrl = checkoutUrlFromIntent(intent);
    setStatus("#upgradeStatus", "ok", zh ? "正在前往綠界付款" : "Opening secure checkout", checkoutUrl || planDisplayName(plan));
    setStatus("#billingStatus", "ok", zh ? "正在前往付款" : "Opening checkout", planDisplayName(plan));
    renderWorkspace();
    if (continueToCheckout(intent, checkoutWindow)) return;
    if (checkoutWindow && !checkoutWindow.closed) writeCheckoutWindow(checkoutWindow, checkoutErrorHtml(zh ? "付款連結尚未產生，請回到原頁重新點選方案。" : "Checkout link was not returned. Please go back and choose the plan again."));
    setStatus("#upgradeStatus", "warning", zh ? "付款連結尚未產生" : "Checkout link is missing", zh ? "付款紀錄已建立，但尚未收到付款網址。" : "The billing record was created, but no checkout URL was returned.");
  } catch (error) {
    if (checkoutWindow && !checkoutWindow.closed) writeCheckoutWindow(checkoutWindow, checkoutErrorHtml(error));
    if (error.status === 401) {
      rememberPendingCheckout(plan);
      closeUpgradeModal();
      showAuthGate();
      setStatus("#authStatus", "warning", zh ? "請先登入或建立帳號" : "Sign in to continue", zh ? "登入後會自動接續前往付款。" : "After signing in, checkout will continue automatically.");
      return;
    }
    if (options.resumed) rememberPendingCheckout(plan);
    setStatus("#upgradeStatus", "error", zh ? "建立付款失敗" : "Checkout failed", error.message);
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
  const titleText = escapeLibraryText($("#clientName")?.value || "AgencyReport AI");
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
      <span>${escapeLibraryText(label)}</span>
      <strong>${escapeLibraryText(value || (zh ? "未偵測" : "Not detected"))}</strong>
    </div>
  `).join("");
  const message = $("#aiIntakeAnalysisMessage");
  if (message) message.hidden = false;
  const thread = $("#aiIntakeThread");
  if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
}

function fillAiDemoBrief() {
  const brief = state.lang === "en" ? `Client: Demo Dental Brand A
Report month: 2026-06
Report type: Advertising report
Request: Review this month's CPA, ROAS, Google Search, and Meta Ads performance, then recommend next month's budget.

${samples.ads}` : `客戶是示範牙科品牌 A
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

  if (url) {
    try {
      const imported = await testAndImportDataSource({ generate: true });
      if (imported?.csv) {
        setAiIntakeNextAction("report", zh ? "查看報告結果" : "View report results");
        setAiIntakeReply(zh ? "Google Sheets 已匯入並完成月報" : "Google Sheets imported and report generated", zh ? `已安全匯入 ${imported.rowCount} 筆資料，完成 KPI、圖表與 AI 建議。` : `Securely imported ${imported.rowCount} rows and generated KPI, charts, and AI advice.`);
        if (analyzeButton) analyzeButton.disabled = false;
        return;
      }
    } catch (error) {
      setStatus("#aiIntakeStatus", "error", zh ? "資料網址無法匯入" : "Unable to import the data URL", error.message);
      if (analyzeButton) analyzeButton.disabled = false;
      return;
    }
  }

  setAiIntakeNextAction("data", zh ? "繼續資料檢查" : "Continue data review");
  setAiIntakeReply(
    zh ? "資料來源已整理完成" : "The data source is ready",
    zh ? "我已帶入資料來源網址，但尚未偵測到可分析的 CSV。請繼續檢查來源，或在對話中加入 CSV/TXT 檔案。" : "I applied the source URL, but no analyzable CSV was detected. Continue reviewing the source or attach a CSV/TXT file in this chat.",
  );
  if (analyzeButton) analyzeButton.disabled = false;
}

function dataSourcePayload() {
  return {
    type: $("#sourceType")?.value === "sheets" ? "google_sheets" : "manual_csv",
    url: $("#sheetUrl")?.value.trim() || "",
    csv: $("#csvInput")?.value || "",
    owner: $("#sourceOwner")?.value.trim() || "",
    clientName: $("#clientName")?.value.trim() || "",
  };
}

function renderDataSourceResult(result, saved = false) {
  const list = $("#sourceList");
  if (!list) return;
  const item = document.createElement("div");
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  title.textContent = result.provider === "google_sheets" ? "Google Sheets" : "CSV";
  detail.textContent = saved
    ? (state.lang === "en" ? "Source saved to this workspace" : "資料來源已儲存至工作區")
    : `${result.rowCount || 0} ${state.lang === "en" ? "rows ready" : "筆資料可用"}`;
  item.append(title, detail);
  list.replaceChildren(item);
}

async function saveDataSource() {
  const payload = dataSourcePayload();
  if (payload.type === "google_sheets" && !payload.url) throw new Error(state.lang === "en" ? "Enter a Google Sheets URL" : "請輸入 Google Sheets URL");
  const source = await api("/api/data-sources", { method: "POST", body: JSON.stringify(payload) });
  renderDataSourceResult(source, true);
  setStatus("#sourceStatus", "ok", state.lang === "en" ? "Data source saved" : "資料來源已儲存", payload.type === "google_sheets" ? payload.url : (state.lang === "en" ? "Manual CSV" : "手動 CSV"));
  return source;
}

async function testAndImportDataSource({ generate = true } = {}) {
  const payload = dataSourcePayload();
  setStatus("#sourceStatus", "", state.lang === "en" ? "Testing data source..." : "正在測試資料來源...");
  const result = await api("/api/data-sources/test", { method: "POST", body: JSON.stringify(payload) });
  if (result.csv) $("#csvInput").value = result.csv;
  renderDataSourceResult(result);
  setStatus("#sourceStatus", "ok", state.lang === "en" ? "Data source ready" : "資料來源可用", `${result.rowCount || 0} ${state.lang === "en" ? "rows imported" : "筆資料已匯入"}`);
  if (generate && $("#csvInput")?.value.trim()) await generateReportFromButton();
  return result;
}

const connectorLabels = {
  ga4: { zh: "Google Analytics 4", en: "Google Analytics 4", detailZh: "網站流量、使用者、事件與營收", detailEn: "Traffic, users, key events, and revenue" },
  google_ads: { zh: "Google Ads", en: "Google Ads", detailZh: "花費、曝光、點擊、轉換與廣告營收", detailEn: "Spend, impressions, clicks, conversions, and revenue" },
  meta_ads: { zh: "Meta Ads", en: "Meta Ads", detailZh: "Facebook／Instagram 廣告成效", detailEn: "Facebook and Instagram advertising performance" },
};

function renderConnectorSettings() {
  const list = $("#connectorList");
  if (!list) return;
  const zh = state.lang !== "en";
  const availabilityKey = { ga4: "ga4", google_ads: "googleAds", meta_ads: "metaAds" };
  list.innerHTML = Object.entries(connectorLabels).map(([provider, label]) => {
    const connection = state.connectorConnections.find((item) => item.provider === provider);
    const connected = connection?.status === "connected";
    const authorizationReady = state.connectorAvailability[availabilityKey[provider]]?.authorizationReady === true;
    const canConnect = connected || authorizationReady;
    return `<div class="connector-row" data-connector-provider="${provider}">
      <div class="connector-row-copy">
        <strong>${escapeLibraryText(zh ? label.zh : label.en)}</strong>
        <span>${escapeLibraryText(zh ? label.detailZh : label.detailEn)}</span>
        <small>${connected && connection.connectedAt ? `${zh ? "已連接" : "Connected"} ${escapeLibraryText(new Date(connection.connectedAt).toLocaleDateString(zh ? "zh-TW" : "en-US"))}` : authorizationReady ? (zh ? "可開始授權" : "Ready to authorize") : (zh ? "平台設定中" : "Platform setup in progress")}</small>
      </div>
      <div class="connector-row-actions">
        <span class="connector-state ${connected ? "" : "disconnected"}">${connected ? (zh ? "已連接" : "Connected") : (zh ? "未連接" : "Disconnected")}</span>
        ${connected && ["ga4", "google_ads", "meta_ads"].includes(provider) ? `<button class="ghost" type="button" data-connector-action="manage" data-provider="${provider}">${zh ? "管理" : "Manage"}</button>` : ""}
        <button class="${connected ? "ghost" : "primary"}" type="button" data-connector-action="${connected ? "disconnect" : "connect"}" data-provider="${provider}" ${canConnect ? "" : "disabled"}>${connected ? (zh ? "中斷連線" : "Disconnect") : authorizationReady ? (zh ? "連接" : "Connect") : (zh ? "設定中" : "Setting up")}</button>
      </div>
    </div>`;
  }).join("");
  const ga4Connected = state.connectorConnections.some((item) => item.provider === "ga4" && item.status === "connected");
  if (!ga4Connected) $("#ga4PropertyPanel").hidden = true;
  if ($("#syncGa4Btn")) $("#syncGa4Btn").disabled = !state.ga4Source;
  const googleAdsConnected = state.connectorConnections.some((item) => item.provider === "google_ads" && item.status === "connected");
  if (!googleAdsConnected) $("#googleAdsCustomerPanel").hidden = true;
  if ($("#syncGoogleAdsBtn")) $("#syncGoogleAdsBtn").disabled = !state.googleAdsSource;
  const metaAdsConnected = state.connectorConnections.some((item) => item.provider === "meta_ads" && item.status === "connected");
  if (!metaAdsConnected) $("#metaAdAccountPanel").hidden = true;
  if ($("#syncMetaAdsBtn")) $("#syncMetaAdsBtn").disabled = !state.metaAdsSource;
  renderConnectorSyncStatus();
}

function connectorStatusLabel(status, zh) {
  const labels = {
    connected: ["已連接", "Connected"], synced: ["同步完成", "Synced"], syncing: ["同步中", "Syncing"],
    error: ["需要重試", "Retry needed"], needs_reauth: ["需要重新授權", "Reconnect required"], disconnected: ["已中斷", "Disconnected"],
  };
  return (labels[status] || [status || "-", status || "-"])[zh ? 0 : 1];
}

function renderConnectorSyncStatus() {
  const list = $("#connectorSyncList");
  if (!list) return;
  const zh = state.lang !== "en";
  if (!state.connectorSources.length) {
    list.innerHTML = `<p class="empty-state">${zh ? "連接並選擇資料來源後，會在這裡顯示自動同步紀錄。" : "Connect and select a data source to see automatic sync activity here."}</p>`;
  } else list.innerHTML = state.connectorSources.map((source) => {
    const latestJob = state.connectorSyncJobs.find((item) => item.sourceId === source.id);
    const last = source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString(zh ? "zh-TW" : "en-US") : (zh ? "尚未同步" : "Not synced yet");
    const next = source.nextSyncAt ? new Date(source.nextSyncAt).toLocaleString(zh ? "zh-TW" : "en-US") : "-";
    const error = source.lastErrorCode || latestJob?.errorCode || "";
    return `<article class="connector-sync-item">
      <div class="connector-sync-main">
        <span class="connector-state ${["error", "needs_reauth", "disconnected"].includes(source.status) ? "disconnected" : ""}">${escapeLibraryText(connectorStatusLabel(source.status, zh))}</span>
        <strong>${escapeLibraryText(source.displayName || connectorLabels[source.provider]?.[zh ? "zh" : "en"] || source.provider)}</strong>
        <small>${escapeLibraryText(connectorLabels[source.provider]?.[zh ? "zh" : "en"] || source.provider)} · ${Number(source.rowCount || 0)} ${zh ? "筆" : "rows"}</small>
      </div>
      <dl><div><dt>${zh ? "最後同步" : "Last sync"}</dt><dd>${escapeLibraryText(last)}</dd></div><div><dt>${zh ? "下次排程" : "Next run"}</dt><dd>${escapeLibraryText(next)}</dd></div>${error ? `<div><dt>${zh ? "錯誤" : "Error"}</dt><dd>${escapeLibraryText(error)}</dd></div>` : ""}</dl>
      <button class="ghost" type="button" data-sync-source-id="${escapeLibraryText(source.id)}" ${source.status === "syncing" || source.status === "needs_reauth" ? "disabled" : ""}>${zh ? "重試同步" : "Sync now"}</button>
    </article>`;
  }).join("");
  renderConnectorReconciliation();
  renderConnectorAuditTrail();
}

function renderConnectorReconciliation() {
  const target = $("#connectorReconcileSummary");
  if (!target) return;
  const zh = state.lang !== "en";
  const item = state.connectorReconciliation;
  if (!item?.reportMonth) {
    target.innerHTML = `<p class="empty-state">${zh ? "同步資料後會顯示跨平台對帳結果。" : "Cross-platform reconciliation appears after data is synchronized."}</p>`;
    return;
  }
  const warningLabels = {
    NO_DATA: ["本月沒有資料", "No data for this month"],
    CONVERSION_ATTRIBUTION_DIFFERENCE: ["GA4 與廣告平台的轉換歸因差異超過 20%", "GA4 and ad-platform conversions differ by over 20%"],
    REVENUE_ATTRIBUTION_DIFFERENCE: ["GA4 與廣告平台的營收歸因差異超過 20%", "GA4 and ad-platform revenue differ by over 20%"],
  };
  const warnings = (item.warnings || []).map((code) => warningLabels[code]?.[zh ? 0 : 1] || code.replaceAll("_", " "));
  const total = item.canonicalTotals || {};
  const format = (value, digits = 0) => Number(value || 0).toLocaleString(zh ? "zh-TW" : "en-US", { maximumFractionDigits: digits });
  target.innerHTML = `<div class="connector-reconcile-overview">
    <div><span>${zh ? "月份" : "Month"}</span><strong>${escapeLibraryText(item.reportMonth)}</strong></div>
    <div><span>ROAS</span><strong>${format(total.roas, 2)}x</strong></div>
    <div><span>${zh ? "廣告花費" : "Ad spend"}</span><strong>${format(total.spend, 2)}</strong></div>
    <div><span>${zh ? "轉換" : "Conversions"}</span><strong>${format(total.conversions, 2)}</strong></div>
  </div>
  <div class="connector-provider-coverage">${(item.providers || []).map((provider) => `<span class="${provider.rowCount ? "ready" : ""}">${escapeLibraryText(connectorLabels[provider.provider]?.[zh ? "zh" : "en"] || provider.provider)} · ${provider.rowCount} ${zh ? "筆" : "rows"} · ${provider.coveredDays} ${zh ? "天" : "days"}</span>`).join("")}</div>
  ${warnings.length ? `<ul class="connector-reconcile-warnings">${warnings.map((warning) => `<li>${escapeLibraryText(warning)}</li>`).join("")}</ul>` : `<p class="connector-reconcile-ok">${zh ? "資料覆蓋與歸因差異目前沒有需要處理的警示。" : "No data coverage or attribution warnings require attention."}</p>`}`;
}

function renderConnectorAuditTrail() {
  const target = $("#connectorAuditList");
  if (!target) return;
  const zh = state.lang !== "en";
  const actionLabels = {
    "connector:oauth_started": ["開始授權", "Authorization started"],
    "connector:oauth_connected": ["授權完成", "Authorization connected"],
    "connector:disconnected": ["中斷連線", "Disconnected"],
    "connector:sync_completed": ["同步完成", "Sync completed"],
    "connector:auto_report_created": ["自動月報已建立", "Automatic report created"],
    "connector:auto_report_updated": ["自動月報已更新", "Automatic report updated"],
    "connector:auto_report_quota_exceeded": ["AI 月報額度不足", "AI report quota exceeded"],
  };
  if (!state.connectorAudits.length) {
    target.innerHTML = `<p class="empty-state">${zh ? "尚無串接活動。" : "No connector activity yet."}</p>`;
    return;
  }
  target.innerHTML = state.connectorAudits.slice(0, 8).map((event) => `<div class="connector-audit-item"><span>${escapeLibraryText(actionLabels[event.action]?.[zh ? 0 : 1] || event.action)}</span><small>${event.provider ? `${escapeLibraryText(connectorLabels[event.provider]?.[zh ? "zh" : "en"] || event.provider)} · ` : ""}${event.createdAt ? escapeLibraryText(new Date(event.createdAt).toLocaleString(zh ? "zh-TW" : "en-US")) : ""}</small></div>`).join("");
}

async function loadConnectorConnections() {
  if (!state.auth && !authToken()) return;
  try {
    const [connections, sources, syncStatus, reconciliation] = await Promise.all([api("/api/connectors/connections"), api("/api/data-sources"), api("/api/connectors/sync-status"), api(`/api/connectors/reconciliation?month=${encodeURIComponent($("#reportMonth")?.value || "")}`)]);
    state.connectorConnections = Array.isArray(connections) ? connections : [];
    state.ga4Source = (Array.isArray(sources) ? sources : []).find((item) => item.type === "ga4") || null;
    state.googleAdsSource = (Array.isArray(sources) ? sources : []).find((item) => item.type === "google_ads") || null;
    state.metaAdsSource = (Array.isArray(sources) ? sources : []).find((item) => item.type === "meta_ads") || null;
    state.connectorSources = Array.isArray(syncStatus?.sources) ? syncStatus.sources : [];
    state.connectorSyncJobs = Array.isArray(syncStatus?.jobs) ? syncStatus.jobs : [];
    state.connectorAudits = Array.isArray(syncStatus?.audits) ? syncStatus.audits : [];
    state.connectorReconciliation = reconciliation || null;
    renderConnectorSettings();
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to load connections" : "無法載入串接狀態", error.message);
  }
}

async function startConnectorOAuth(provider) {
  try {
    setStatus("#connectorStatus", "", state.lang === "en" ? "Preparing secure authorization..." : "正在準備安全授權...");
    const item = await api("/api/connectors/oauth/start", { method: "POST", body: JSON.stringify({ provider }) });
    location.assign(item.authorizationUrl);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Authorization is not available" : "目前無法開始授權", error.code === "CONNECTOR_OAUTH_NOT_CONFIGURED" || error.code === "CONNECTOR_ENCRYPTION_KEY_REQUIRED"
      ? (state.lang === "en" ? "The platform administrator must finish connector credentials first." : "平台尚未完成此資料源的管理員憑證設定。")
      : error.message);
  }
}

async function disconnectConnectorUi(provider) {
  try {
    await api(`/api/connectors/connections?provider=${encodeURIComponent(provider)}`, { method: "DELETE" });
    if (provider === "ga4") {
      state.ga4Source = null;
      state.ga4Properties = [];
      $("#ga4PropertyPanel").hidden = true;
    }
    if (provider === "google_ads") {
      state.googleAdsSource = null;
      state.googleAdsCustomers = [];
      $("#googleAdsCustomerPanel").hidden = true;
    }
    if (provider === "meta_ads") {
      state.metaAdsSource = null;
      state.metaAdAccounts = [];
      $("#metaAdAccountPanel").hidden = true;
    }
    await loadConnectorConnections();
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Connection removed" : "已中斷連線", connectorLabels[provider]?.[state.lang === "en" ? "en" : "zh"] || provider);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to disconnect" : "無法中斷連線", error.message);
  }
}

async function loadGa4Properties() {
  $("#ga4PropertyPanel").hidden = false;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Loading GA4 properties..." : "正在載入 GA4 Properties...");
  try {
    state.ga4Properties = await api("/api/connectors/ga4/properties");
    const select = $("#ga4PropertySelect");
    select.replaceChildren();
    state.ga4Properties.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${item.propertyName} (${item.propertyId})`;
      select.append(option);
    });
    if (!state.ga4Properties.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = state.lang === "en" ? "No accessible properties" : "沒有可存取的 Property";
      select.append(option);
    }
    setStatus("#connectorStatus", state.ga4Properties.length ? "ok" : "warn", state.lang === "en" ? `${state.ga4Properties.length} properties loaded` : `已載入 ${state.ga4Properties.length} 個 Property`);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to load GA4 properties" : "無法載入 GA4 Properties", error.message);
  }
}

async function selectGa4PropertyUi() {
  const selected = state.ga4Properties[Number($("#ga4PropertySelect").value)];
  if (!selected) return setStatus("#connectorStatus", "warn", state.lang === "en" ? "Choose a GA4 property" : "請先選擇 GA4 Property");
  try {
    state.ga4Source = await api("/api/connectors/ga4/select", { method: "POST", body: JSON.stringify(selected) });
    $("#syncGa4Btn").disabled = false;
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "GA4 property selected" : "已選擇 GA4 Property", selected.propertyName);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to select property" : "無法選擇 Property", error.message);
  }
}

async function loadGoogleAdsCustomers() {
  $("#googleAdsCustomerPanel").hidden = false;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Loading Google Ads accounts..." : "正在載入 Google Ads 廣告帳戶...");
  try {
    state.googleAdsCustomers = await api("/api/connectors/google-ads/customers");
    const select = $("#googleAdsCustomerSelect");
    select.replaceChildren();
    state.googleAdsCustomers.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.disabled = item.manager;
      option.textContent = `${item.name} (${item.customerId})${item.manager ? " [MCC]" : ""}`;
      select.append(option);
    });
    const firstReportable = state.googleAdsCustomers.findIndex((item) => !item.manager);
    if (firstReportable >= 0) select.value = String(firstReportable);
    if (!state.googleAdsCustomers.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = state.lang === "en" ? "No accessible ad accounts" : "沒有可存取的廣告帳戶";
      select.append(option);
    }
    setStatus("#connectorStatus", state.googleAdsCustomers.length ? "ok" : "warn", state.lang === "en" ? `${state.googleAdsCustomers.length} accounts loaded` : `已載入 ${state.googleAdsCustomers.length} 個帳戶`);
  } catch (error) {
    const diagnostic = [error.code, error.providerStatus, error.providerReason, error.providerMessage]
      .filter(Boolean)
      .join(" · ");
    const permissionHelp = error.code === "CONNECTOR_PERMISSION_DENIED"
      ? (state.lang === "en"
        ? "Check that Google Ads API is enabled, the developer token can access production accounts, and this Google user has Ads account access."
        : "請確認已啟用 Google Ads API、Developer Token 可存取正式帳戶，且此 Google 使用者擁有廣告帳戶權限。")
      : "";
    setStatus(
      "#connectorStatus",
      "error",
      state.lang === "en" ? "Unable to load Google Ads accounts" : "無法載入 Google Ads 廣告帳戶",
      [permissionHelp, diagnostic || error.message].filter(Boolean).join(" ")
    );
  }
}

async function selectGoogleAdsCustomerUi() {
  const selected = state.googleAdsCustomers[Number($("#googleAdsCustomerSelect").value)];
  if (!selected || selected.manager) return setStatus("#connectorStatus", "warn", state.lang === "en" ? "Choose a client ad account" : "請選擇非 MCC 的投放帳戶");
  try {
    state.googleAdsSource = await api("/api/connectors/google-ads/select", { method: "POST", body: JSON.stringify(selected) });
    $("#syncGoogleAdsBtn").disabled = false;
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Google Ads account selected" : "已選擇 Google Ads 帳戶", selected.name);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to select Google Ads account" : "無法選擇 Google Ads 帳戶", error.message);
  }
}

async function loadMetaAdAccounts() {
  $("#metaAdAccountPanel").hidden = false;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Loading Meta ad accounts..." : "正在載入 Meta Ads 廣告帳戶...");
  try {
    state.metaAdAccounts = await api("/api/connectors/meta-ads/accounts");
    const select = $("#metaAdAccountSelect");
    select.replaceChildren();
    state.metaAdAccounts.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${item.name} (${item.accountId})${item.businessName ? ` - ${item.businessName}` : ""}`;
      select.append(option);
    });
    if (!state.metaAdAccounts.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = state.lang === "en" ? "No accessible ad accounts" : "沒有可存取的廣告帳戶";
      select.append(option);
    }
    setStatus("#connectorStatus", state.metaAdAccounts.length ? "ok" : "warn", state.lang === "en" ? `${state.metaAdAccounts.length} accounts loaded` : `已載入 ${state.metaAdAccounts.length} 個帳戶`);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to load Meta ad accounts" : "無法載入 Meta Ads 廣告帳戶", error.message);
  }
}

async function selectMetaAdAccountUi() {
  const selected = state.metaAdAccounts[Number($("#metaAdAccountSelect").value)];
  if (!selected) return setStatus("#connectorStatus", "warn", state.lang === "en" ? "Choose a Meta ad account" : "請選擇 Meta Ads 廣告帳戶");
  try {
    state.metaAdsSource = await api("/api/connectors/meta-ads/select", { method: "POST", body: JSON.stringify(selected) });
    $("#syncMetaAdsBtn").disabled = false;
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Meta ad account selected" : "已選擇 Meta Ads 帳戶", selected.name);
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Unable to select Meta ad account" : "無法選擇 Meta Ads 帳戶", error.message);
  }
}

function reportMonthRange() {
  const month = $("#reportMonth")?.value || new Date().toISOString().slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { startDate: `${month}-01`, endDate: `${month}-${String(lastDay).padStart(2, "0")}` };
}

async function syncGa4Ui() {
  if (!state.ga4Source) return;
  const button = $("#syncGa4Btn");
  button.disabled = true;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Synchronizing GA4 data..." : "正在同步 GA4 資料...");
  try {
    const item = await api("/api/connectors/ga4/sync", { method: "POST", body: JSON.stringify({ sourceId: state.ga4Source.id, ...reportMonthRange() }) });
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "GA4 synchronization complete" : "GA4 同步完成", state.lang === "en" ? `${item.job.rowCount} normalized rows, ${item.job.attempts} attempt(s).` : `${item.job.rowCount} 筆標準資料，嘗試 ${item.job.attempts} 次。`);
    await loadConnectorConnections();
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "GA4 synchronization failed" : "GA4 同步失敗", error.message);
  } finally {
    button.disabled = !state.ga4Source;
  }
}

async function syncGoogleAdsUi() {
  if (!state.googleAdsSource) return;
  const button = $("#syncGoogleAdsBtn");
  button.disabled = true;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Synchronizing Google Ads data..." : "正在同步 Google Ads 資料...");
  try {
    const item = await api("/api/connectors/google-ads/sync", { method: "POST", body: JSON.stringify({ sourceId: state.googleAdsSource.id, ...reportMonthRange() }) });
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Google Ads synchronization complete" : "Google Ads 同步完成", state.lang === "en" ? `${item.job.rowCount} normalized rows, ${item.job.attempts} attempt(s).` : `${item.job.rowCount} 筆標準資料，嘗試 ${item.job.attempts} 次。`);
    await loadConnectorConnections();
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Google Ads synchronization failed" : "Google Ads 同步失敗", error.message);
  } finally {
    button.disabled = !state.googleAdsSource;
  }
}

async function syncMetaAdsUi() {
  if (!state.metaAdsSource) return;
  const button = $("#syncMetaAdsBtn");
  button.disabled = true;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Synchronizing Meta Ads data..." : "正在同步 Meta Ads 資料...");
  try {
    const item = await api("/api/connectors/meta-ads/sync", { method: "POST", body: JSON.stringify({ sourceId: state.metaAdsSource.id, ...reportMonthRange() }) });
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Meta Ads synchronization complete" : "Meta Ads 同步完成", state.lang === "en" ? `${item.job.rowCount} normalized rows, ${item.job.attempts} attempt(s).` : `${item.job.rowCount} 筆標準資料，嘗試 ${item.job.attempts} 次。`);
    await loadConnectorConnections();
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Meta Ads synchronization failed" : "Meta Ads 同步失敗", error.message);
  } finally {
    button.disabled = !state.metaAdsSource;
  }
}

async function syncConnectorSourceUi(sourceId) {
  const button = $(`[data-sync-source-id="${CSS.escape(sourceId)}"]`);
  if (button) button.disabled = true;
  setStatus("#connectorStatus", "", state.lang === "en" ? "Synchronizing data source..." : "正在同步資料來源...");
  try {
    const item = await api("/api/connectors/sync", { method: "POST", body: JSON.stringify({ sourceId, ...reportMonthRange() }) });
    setStatus("#connectorStatus", "ok", state.lang === "en" ? "Synchronization complete" : "同步完成", state.lang === "en" ? `${item.job.rowCount} normalized rows.` : `${item.job.rowCount} 筆標準資料。`);
    await loadConnectorConnections();
  } catch (error) {
    setStatus("#connectorStatus", "error", state.lang === "en" ? "Synchronization failed" : "同步失敗", error.message);
    await loadConnectorConnections();
  }
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
  document.documentElement.classList.remove("auth-locked", "portal-mode");
  $("#landingLoginBtn").hidden = Boolean(state.auth);
  $("#landingStartBtn").hidden = Boolean(state.auth);
  $("#logoutBtn").hidden = !state.auth;
  showAppPage("home");
  $("#overviewHome")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function enterWorkspace() {
  if (!state.auth) {
    showAuthGate();
    setStatus(
      "#authStatus",
      "warning",
      state.lang === "en" ? "Sign in to start" : "請先登入或建立帳號",
      state.lang === "en" ? "After signing in, you can use the workspace." : "登入後即可進入工作區使用 AI 月報。"
    );
    return;
  }
  showAppPage("workspace");
}

function setupEvents() {
  $("[data-home-link]")?.addEventListener("click", returnToLandingHome);
  $$("#homeTabBtn, [data-app-page='home']").forEach((button) => button.addEventListener("click", returnToLandingHome));
  $$("#workspaceTabBtn, [data-app-page='workspace']").forEach((button) => button.addEventListener("click", enterWorkspace));
  $("#landingLoginBtn")?.addEventListener("click", showAuthGate);
  $("#landingStartBtn")?.addEventListener("click", enterWorkspace);
  $("#openCaseDetailBtn")?.addEventListener("click", () => {
    trackMarketingEvent("generate_lead", { source: "hero_start_free" });
    enterWorkspace();
  });
  $(".landing-bottom-start")?.addEventListener("click", enterWorkspace);
  $("#homeLoadDemoBtn")?.addEventListener("click", () => {
    trackMarketingEvent("view_item", { item_name: "sample_report", source: "hero_sample" });
    enterWorkspace();
  });
  $$(".landing-resource-link").forEach((link) => link.addEventListener("click", () => {
    trackMarketingEvent("select_content", {
      content_type: "resource_guide",
      item_id: link.getAttribute("href") || "resource",
      source: "landing_template_section",
    });
  }));
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
  $("#saveSourceBtn")?.addEventListener("click", () => saveDataSource().catch((error) => setStatus("#sourceStatus", "error", state.lang === "en" ? "Unable to save source" : "資料來源儲存失敗", error.message)));
  $("#testSourceBtn")?.addEventListener("click", () => testAndImportDataSource().catch((error) => setStatus("#sourceStatus", "error", state.lang === "en" ? "Source test failed" : "來源測試失敗", error.message)));
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
  $("#changePasswordBtn")?.addEventListener("click", changeAccountPassword);
  $("#exportAccountDataBtn")?.addEventListener("click", exportAccountData);
  $("#openDeleteAccountBtn")?.addEventListener("click", () => toggleDeleteAccountPanel(true));
  $("#cancelDeleteAccountBtn")?.addEventListener("click", () => toggleDeleteAccountPanel(false));
  $("#confirmDeleteAccountBtn")?.addEventListener("click", deleteCurrentAccount);
  $("#connectorList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-connector-action]");
    if (!button) return;
    const provider = button.dataset.provider;
    if (button.dataset.connectorAction === "connect") startConnectorOAuth(provider);
    if (button.dataset.connectorAction === "disconnect") disconnectConnectorUi(provider);
    if (button.dataset.connectorAction === "manage" && provider === "ga4") loadGa4Properties();
    if (button.dataset.connectorAction === "manage" && provider === "google_ads") loadGoogleAdsCustomers();
    if (button.dataset.connectorAction === "manage" && provider === "meta_ads") loadMetaAdAccounts();
  });
  $("#loadGa4PropertiesBtn")?.addEventListener("click", loadGa4Properties);
  $("#selectGa4PropertyBtn")?.addEventListener("click", selectGa4PropertyUi);
  $("#syncGa4Btn")?.addEventListener("click", syncGa4Ui);
  $("#loadGoogleAdsCustomersBtn")?.addEventListener("click", loadGoogleAdsCustomers);
  $("#selectGoogleAdsCustomerBtn")?.addEventListener("click", selectGoogleAdsCustomerUi);
  $("#syncGoogleAdsBtn")?.addEventListener("click", syncGoogleAdsUi);
  $("#loadMetaAdAccountsBtn")?.addEventListener("click", loadMetaAdAccounts);
  $("#selectMetaAdAccountBtn")?.addEventListener("click", selectMetaAdAccountUi);
  $("#syncMetaAdsBtn")?.addEventListener("click", syncMetaAdsUi);
  $("#refreshConnectorStatusBtn")?.addEventListener("click", loadConnectorConnections);
  $("#connectorSyncList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sync-source-id]");
    if (button) syncConnectorSourceUi(button.dataset.syncSourceId);
  });
  $("#runAutopilotBtn")?.addEventListener("click", () => {
    const draft = buildRuleDraft();
    $("#autopilotOutput").innerHTML = draft ? draft.actions.map((item) => `<div><strong>${escapeLibraryText(item)}</strong></div>`).join("") : "";
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
  $("#feedbackLauncher")?.addEventListener("click", openFeedbackModal);
  $("#feedbackCloseBtn")?.addEventListener("click", closeFeedbackModal);
  $("#feedbackMailBtn")?.addEventListener("click", openFeedbackEmail);
  $("#feedbackForm")?.addEventListener("submit", submitFeedback);
  $("#feedbackModal")?.addEventListener("click", (event) => {
    if (event.target.id === "feedbackModal") closeFeedbackModal();
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
  refreshPaymentAvailability();
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

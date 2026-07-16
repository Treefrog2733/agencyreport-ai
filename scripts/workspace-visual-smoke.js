#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefix = `${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_SHIM,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => {
    if (!candidate.includes("\\") && !candidate.includes("/")) return true;
    return fs.existsSync(candidate);
  });
}

async function waitForJson(url, timeoutMs = 15000) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result || {});
  });
  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          socket.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((sendResolve, sendReject) => {
            pending.set(messageId, { resolve: sendResolve, reject: sendReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")));
  });
}

async function main() {
  const targetUrl = argValue("--url", "http://127.0.0.1:4280/");
  const outDir = path.resolve(argValue("--out", "artifacts/workspace-visual-smoke"));
  const port = Number(argValue("--debug-port", "9333"));
  const viewportWidth = Number(argValue("--width", "1440"));
  const viewportHeight = Number(argValue("--height", "1100"));
  const language = argValue("--lang", "zh") === "en" ? "en" : "zh";
  const chrome = chromePath();
  if (!chrome) throw new Error("Chrome or Edge was not found.");

  let landingResponse;
  try {
    landingResponse = await fetch(targetUrl, { signal: AbortSignal.timeout(15000) });
  } catch (error) {
    throw new Error(`Workspace is not reachable at ${targetUrl}. Start the app first or pass --url. ${error.message}`);
  }
  if (!landingResponse.ok) {
    throw new Error(`Workspace returned HTTP ${landingResponse.status} at ${targetUrl}. Start the app first or pass --url.`);
  }
  const landingHtml = await landingResponse.text();
  if (!/AgencyReport AI/i.test(landingHtml)) {
    throw new Error(`Workspace response at ${targetUrl} is not an AgencyReport AI page. Start the intended app first or pass --url.`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const profile = path.join(outDir, "profile");
  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--headless=new",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-features=Translate,MediaRouter,OptimizationHints",
    "about:blank",
  ];
  const child = spawn(chrome, chromeArgs, { windowsHide: true });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const browserClient = await connect(version.webSocketDebuggerUrl);
    const { targetId } = await browserClient.send("Target.createTarget", { url: "about:blank" });
    const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find((target) => target.id === targetId) || targets.find((target) => target.type === "page");
    if (!pageTarget?.webSocketDebuggerUrl) throw new Error("Could not find page websocket target.");
    const client = await connect(pageTarget.webSocketDebuggerUrl);
    const send = (method, params = {}) => client.send(method, params);

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewportWidth,
      height: viewportHeight,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: targetUrl });
    await new Promise((resolve) => setTimeout(resolve, 1800));
    await send("Runtime.evaluate", {
      expression: `
        localStorage.removeItem("agencyReportAuthToken");
        localStorage.setItem("agencyReportTheme", "dark");
        localStorage.setItem("agencyReportLang", "${language}");
        location.reload();
      `,
      awaitPromise: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const landingCapture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const landingFile = path.join(outDir, "landing.png");
    fs.writeFileSync(landingFile, Buffer.from(landingCapture.data, "base64"));
    const landingStateResult = await send("Runtime.evaluate", {
      expression: `(() => ({
        visible: !document.querySelector("#overviewHome")?.hidden,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        cjkLines: "${language}" === "en" ? [...new Set((document.querySelector("#overviewHome")?.innerText || "")
          .split(/\\n+/).map((line) => line.trim()).filter((line) => /[\u3400-\u9fff]/.test(line)))] : []
      }))()`,
      returnByValue: true,
    });
    await send("Runtime.evaluate", {
      expression: `window.openUpgradeModal?.()`,
      awaitPromise: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const landingUpgradeCapture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const landingUpgradeFile = path.join(outDir, "landing-upgrade.png");
    fs.writeFileSync(landingUpgradeFile, Buffer.from(landingUpgradeCapture.data, "base64"));
    const landingUpgradeStateResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const color = (selector) => getComputedStyle(document.querySelector(selector)).color;
        const dialog = document.querySelector(".upgrade-dialog");
        return {
          visible: document.querySelector("#upgradeModal")?.hidden === false,
          dialogColor: color(".upgrade-dialog"),
          titleColor: color(".upgrade-head h2"),
          planColor: color(".upgrade-plan h3"),
          priceColor: color(".upgrade-price"),
          featureColor: color(".upgrade-feature-list li"),
          statusColor: color(".upgrade-status"),
          horizontalOverflow: Math.max(0, dialog.scrollWidth - dialog.clientWidth)
        };
      })()`,
      returnByValue: true,
    });
    await send("Runtime.evaluate", {
      expression: `document.querySelector("#upgradeModal").hidden = true`,
      awaitPromise: true,
    });
    await send("Runtime.evaluate", {
      expression: `
        document.documentElement.classList.remove("public-landing");
        document.querySelector("#overviewHome").hidden = true;
        document.querySelector("#caseWorkspace").hidden = false;
        document.querySelector("#report").hidden = false;
        window.loadSample?.("ads");
      `,
      awaitPromise: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const xssTestResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const csv = document.querySelector("#csvInput");
        const client = document.querySelector("#clientName");
        const originalClient = client?.value || "";
        window.__agencyXssProbe = 0;
        if (client) client.value = '<img data-xss-client src=x onerror="window.__agencyXssProbe=1">';
        if (csv) csv.value = 'channel,spend,impressions,clicks,conversions,revenue,last_spend,last_clicks,last_conversions,last_revenue\\n<img data-xss-channel src=x onerror="window.__agencyXssProbe=1">,100,1000,100,10,500,90,90,9,450';
        window.generateReport?.();
        const result = {
          executed: window.__agencyXssProbe,
          injectedNodes: document.querySelectorAll("[data-xss-client],[data-xss-channel]").length,
          literalChannelVisible: (document.querySelector("#detailTable")?.textContent || "").includes("<img data-xss-channel")
        };
        if (client) client.value = originalClient;
        window.loadSample?.("ads");
        return result;
      })()`,
      returnByValue: true,
    });
    const xssTest = xssTestResult.result?.value || {};

    const libraryTestResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const expectedClient = document.querySelector("#clientName")?.value || "";
        window.saveCurrentReport?.();
        const saved = JSON.parse(localStorage.getItem("agencyReportReports:guest") || "[]");
        const clientField = document.querySelector("#clientName");
        if (clientField) clientField.value = "Temporary smoke value";
        document.querySelector('[data-report-action="open"]')?.click();
        return {
          items: document.querySelectorAll(".report-library-item").length,
          readyItems: document.querySelectorAll(".report-library-title .is-ready").length,
          hasSnapshot: Boolean(saved[0]?.snapshot?.metrics && saved[0]?.snapshot?.csv),
          restoredClient: clientField?.value === expectedClient
        };
      })()`,
      returnByValue: true,
    });
    const libraryTest = libraryTestResult.result?.value || {};

    const views = ["overview", "case", "report", "ai", "delivery", "billing", "settings"];
    const summary = {
      landing: { file: landingFile, state: landingStateResult.result?.value },
      landingUpgrade: { file: landingUpgradeFile, state: landingUpgradeStateResult.result?.value },
    };
    for (const view of views) {
      await send("Runtime.evaluate", { expression: `window.openWorkspace?.("${view}"); window.scrollTo(0, 0)`, awaitPromise: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      const file = path.join(outDir, `${view}.png`);
      fs.writeFileSync(file, Buffer.from(capture.data, "base64"));
      const state = await send("Runtime.evaluate", {
        expression: `(() => ({
          visible: [...document.querySelectorAll("[data-workspace-group]")].filter((el) => !el.hidden).map((el) => el.dataset.workspaceGroup),
          navItems: document.querySelectorAll("[data-workspace-view]").length,
          chartCards: document.querySelectorAll(".chart-stat-grid").length,
          tableRows: document.querySelectorAll("#detailTable tbody tr").length,
          reportBrief: Boolean(document.querySelector("#reportPreviewBrief")?.textContent.trim()),
          aiSummary: Boolean(document.querySelector("#aiSummaryOutput")?.textContent.trim()),
          accountDataControls: ["#exportAccountDataBtn", "#openDeleteAccountBtn", "#deleteAccountPanel"]
            .every((selector) => Boolean(document.querySelector(selector))),
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          cjkLines: "${language}" === "en" ? [...new Set([...document.querySelectorAll('[data-workspace-group]:not([hidden]), #report:not([hidden]), .workspace-sidebar, .workspace-masthead')]
            .flatMap((root) => (root.innerText || '').split(/\\n+/))
            .map((line) => line.trim())
            .filter((line) => /[\u3400-\u9fff]/.test(line)))]
            .slice(0, 30) : [],
          bodyClass: document.documentElement.className
        }))()`,
        returnByValue: true,
      });
      summary[view] = { file, state: state.result?.value };
      if (view === "report") summary[view].xssTest = xssTest;
      if (view === "delivery") summary[view].libraryTest = libraryTest;
      if (view === "settings") {
        await send("Runtime.evaluate", {
          expression: `document.querySelector("#openDeleteAccountBtn")?.click()`,
          awaitPromise: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
        const deleteCapture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const deleteFile = path.join(outDir, "settings-delete.png");
        fs.writeFileSync(deleteFile, Buffer.from(deleteCapture.data, "base64"));
        const deleteState = await send("Runtime.evaluate", {
          expression: `(() => ({
            panelVisible: document.querySelector("#deleteAccountPanel")?.hidden === false,
            passwordField: Boolean(document.querySelector("#deleteAccountPassword")),
            confirmationField: Boolean(document.querySelector("#deleteAccountConfirmation")),
            horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
          }))()`,
          returnByValue: true,
        });
        summary[view].deletePanel = { file: deleteFile, state: deleteState.result?.value };
      }
    }
    await send("Runtime.evaluate", {
      expression: `
        window.openWorkspace?.("report");
        document.querySelector("#trendChart")?.scrollIntoView({ block: "start" });
      `,
      awaitPromise: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const chartsCapture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    const chartsFile = path.join(outDir, "charts.png");
    fs.writeFileSync(chartsFile, Buffer.from(chartsCapture.data, "base64"));
    const chartsState = await send("Runtime.evaluate", {
      expression: `(() => ({
        chartCards: document.querySelectorAll(".chart-stat-grid").length,
        chartNotes: [...document.querySelectorAll(".chart-note")].filter((el) => el.textContent.trim()).length,
        tableRows: document.querySelectorAll("#detailTable tbody tr").length,
        highlightedRows: document.querySelectorAll("#detailTable tbody tr.is-weak").length,
        bestCells: document.querySelectorAll("td.is-best").length,
        canvasCount: document.querySelectorAll("canvas").length,
        reportSections: document.querySelectorAll(".report-section-block").length,
        professionalKpis: document.querySelectorAll("#insights article").length,
        findingPoints: document.querySelectorAll("#positiveFindings > div, #riskList > div").length,
        actionPoints: document.querySelectorAll("#budgetPlan > div, #creativePlan > div, #recommendations > div").length
      }))()`,
      returnByValue: true,
    });
    await send("Runtime.evaluate", {
      expression: `
        document.querySelector("#report").hidden = false;
        document.body.classList.add("printing-report");
      `,
      awaitPromise: true,
    });
    const pdf = await send("Page.printToPDF", {
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    fs.writeFileSync(path.join(outDir, "report.pdf"), Buffer.from(pdf.data, "base64"));
    await send("Runtime.evaluate", {
      expression: `document.body.classList.remove("printing-report")`,
      awaitPromise: true,
    });
    summary.charts = { file: chartsFile, state: chartsState.result?.value };
    fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
    client.close();
    browserClient.close();

    const failures = Object.entries(summary).filter(([view, item]) => {
      if (fs.statSync(item.file).size < 1000) return true;
      if (view === "charts") {
        return item.state?.chartCards < 4
          || item.state?.tableRows < 1
          || item.state?.reportSections < 5
          || item.state?.professionalKpis < 10
          || item.state?.findingPoints < 4
          || item.state?.actionPoints < 7;
      }
      if (view === "landing") {
        return !item.state?.visible
          || item.state?.horizontalOverflow > 1
          || (language === "en" && item.state?.cjkLines?.length > 0);
      }
      if (view === "landingUpgrade") {
        const invisibleColors = new Set(["rgb(255, 255, 255)", "rgba(255, 255, 255, 0)"]);
        return !item.state?.visible
          || invisibleColors.has(item.state?.titleColor)
          || invisibleColors.has(item.state?.planColor)
          || invisibleColors.has(item.state?.priceColor)
          || invisibleColors.has(item.state?.featureColor)
          || invisibleColors.has(item.state?.statusColor)
          || item.state?.horizontalOverflow > 1;
      }
      if (view === "delivery") {
        return item.libraryTest?.items < 1
          || item.libraryTest?.readyItems < 1
          || !item.libraryTest?.hasSnapshot
          || !item.libraryTest?.restoredClient;
      }
      if (view === "report" && (item.xssTest?.executed !== 0 || item.xssTest?.injectedNodes !== 0 || !item.xssTest?.literalChannelVisible)) return true;
      if (view === "settings") {
        return !item.state?.accountDataControls
          || !item.deletePanel?.state?.panelVisible
          || !item.deletePanel?.state?.passwordField
          || !item.deletePanel?.state?.confirmationField
          || item.deletePanel?.state?.horizontalOverflow > 1;
      }
      return !item.state?.visible?.includes(view)
        || item.state?.horizontalOverflow > 1
        || (language === "en" && item.state?.cjkLines?.length > 0);
    });
    console.log("AgencyReport AI workspace visual smoke");
    console.log(`Target: ${targetUrl}`);
    Object.entries(summary).forEach(([view, item]) => {
      console.log(`${failures.some(([failed]) => failed === view) ? "FAIL" : "OK"} ${view} -> ${item.file}`);
    });
    if (failures.length) process.exitCode = 1;
  } finally {
    child.kill();
    fs.writeFileSync(path.join(outDir, "chrome-stderr.log"), stderr);
  }
}

main().catch((error) => {
  console.error(`Workspace visual smoke failed: ${error.message}`);
  process.exitCode = 1;
});

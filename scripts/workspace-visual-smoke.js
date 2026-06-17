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
  return [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean).find((candidate) => fs.existsSync(candidate));
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
  const chrome = chromePath();
  if (!chrome) throw new Error("Chrome or Edge was not found.");

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
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: targetUrl });
    await new Promise((resolve) => setTimeout(resolve, 1800));
    await send("Runtime.evaluate", {
      expression: `
        localStorage.removeItem("agencyReportAuthToken");
        localStorage.setItem("agencyReportTheme", "dark");
        location.reload();
      `,
      awaitPromise: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 2200));
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

    const views = ["overview", "report", "ai", "delivery", "billing"];
    const summary = {};
    for (const view of views) {
      await send("Runtime.evaluate", { expression: `window.openWorkspace?.("${view}")`, awaitPromise: true });
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
          bodyClass: document.documentElement.className
        }))()`,
        returnByValue: true,
      });
      summary[view] = { file, state: state.result?.value };
    }
    await send("Runtime.evaluate", {
      expression: `document.querySelector("#trendChart")?.scrollIntoView({ block: "start" })`,
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
        canvasCount: document.querySelectorAll("canvas").length
      }))()`,
      returnByValue: true,
    });
    summary.charts = { file: chartsFile, state: chartsState.result?.value };
    fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
    client.close();
    browserClient.close();

    const failures = Object.entries(summary).filter(([view, item]) => {
      if (fs.statSync(item.file).size < 1000) return true;
      if (view === "charts") return item.state?.chartCards < 4 || item.state?.tableRows < 1;
      return !item.state?.visible?.includes(view);
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

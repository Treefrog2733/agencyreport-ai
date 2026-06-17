#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const defaultChromeArgs = [
  "--headless=new",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--disable-features=Translate,MediaRouter,OptimizationHints",
];

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefix = `${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function chromeCandidates() {
  return [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_SHIM,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
}

function resolveChrome() {
  const explicit = argValue("--chrome");
  if (explicit) return explicit;
  return chromeCandidates().find((candidate) => {
    if (!candidate.includes("\\") && !candidate.includes("/")) return true;
    return fs.existsSync(candidate);
  });
}

function runChrome(chromePath, args, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const child = spawn(chromePath, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGKILL");
      resolve({ ok: false, code: null, stdout, stderr, timedOut: true });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ok: false, code: null, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ok: code === 0, code, stdout, stderr });
    });
  });
}

async function main() {
  const url = argValue("--url", process.env.APP_URL || "http://127.0.0.1:4280/");
  const outDir = path.resolve(argValue("--out", "artifacts/browser-smoke"));
  const timeoutMs = Number(argValue("--timeout", "20000"));
  const chrome = resolveChrome();

  if (!chrome) {
    throw new Error("Chrome/Edge executable was not found. Pass --chrome=\"C:\\path\\to\\chrome.exe\".");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const userDataDir = path.join(outDir, "profile");
  const screenshotPath = path.join(outDir, "headless-smoke.png");
  const domPath = path.join(outDir, "headless-smoke.html");
  const logPath = path.join(outDir, "headless-smoke.log");

  const commonArgs = [
    ...defaultChromeArgs,
    `--user-data-dir=${userDataDir}`,
  ];

  const domRun = await runChrome(chrome, [...commonArgs, "--dump-dom", url], timeoutMs);
  const shotRun = await runChrome(chrome, [...commonArgs, `--screenshot=${screenshotPath}`, "--window-size=1440,1000", url], timeoutMs);
  const combinedLog = [
    `url=${url}`,
    `chrome=${chrome}`,
    `dom.exit=${domRun.code}`,
    `dom.timedOut=${Boolean(domRun.timedOut)}`,
    `screenshot.exit=${shotRun.code}`,
    `screenshot.timedOut=${Boolean(shotRun.timedOut)}`,
    "",
    "[dom stderr]",
    domRun.stderr,
    "",
    "[screenshot stderr]",
    shotRun.stderr,
  ].join("\n");

  fs.writeFileSync(logPath, combinedLog);
  fs.writeFileSync(domPath, domRun.stdout || "");

  const domOk = domRun.ok && /AgencyReport AI|<html/i.test(domRun.stdout);
  const screenshotOk = shotRun.ok && fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 1000;
  const gpuStallSignals = /gpu_init|InitializeSandbox|viz_main_impl|ANGLE|Passthrough is not supported/i;
  const gpuWarnings = gpuStallSignals.test(`${domRun.stderr}\n${shotRun.stderr}`);
  const ok = domOk && screenshotOk && (!gpuWarnings || hasFlag("--allow-gpu-warnings"));

  console.log("AgencyReport AI browser smoke");
  console.log(`Target: ${url}`);
  console.log(`Chrome: ${chrome}`);
  console.log(`DOM: ${domOk ? "OK" : "FAIL"} -> ${domPath}`);
  console.log(`Screenshot: ${screenshotOk ? "OK" : "FAIL"} -> ${screenshotPath}`);
  console.log(`GPU warning scan: ${gpuWarnings ? "WARN" : "OK"} -> ${logPath}`);

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Browser smoke failed: ${error.message}`);
  process.exitCode = 1;
});

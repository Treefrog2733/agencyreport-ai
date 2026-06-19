#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const startMarker = "const copy = ";
const endMarker = "\n};\n\nfunction t";
const start = app.indexOf(startMarker);
const end = app.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Could not locate the translation catalog");
const catalogSource = app.slice(start + startMarker.length, end + 2);
const copy = vm.runInNewContext(`(${catalogSource})`, Object.create(null), { timeout: 1000 });
const htmlKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]);
const uniqueHtmlKeys = [...new Set(htmlKeys)];
const zhKeys = Object.keys(copy.zh || {});
const enKeys = Object.keys(copy.en || {});
const missingZh = uniqueHtmlKeys.filter((key) => !copy.zh?.[key]);
const missingEn = uniqueHtmlKeys.filter((key) => !copy.en?.[key]);
const asymmetric = [...new Set([...zhKeys, ...enKeys])].filter((key) => !copy.zh?.[key] || !copy.en?.[key]);
const duplicateIds = [...html.matchAll(/\sid="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id, index, values) => values.indexOf(id) !== index);
const sourceFiles = ["server.js", "app.js", "index.html", "styles.css"];
const corruptedFiles = sourceFiles.filter((file) => /[\uFFFD\uE000-\uF8FF]/u.test(fs.readFileSync(path.join(root, file), "utf8")));

function assert(condition, message, details = "") {
  if (!condition) throw new Error(`${message}${details ? `: ${details}` : ""}`);
  console.log(`OK ${message}`);
}

assert(missingZh.length === 0, "every HTML translation key has Traditional Chinese copy", missingZh.join(", "));
assert(missingEn.length === 0, "every HTML translation key has English copy", missingEn.join(", "));
assert(asymmetric.length === 0, "Traditional Chinese and English catalogs have matching keys", asymmetric.join(", "));
assert(duplicateIds.length === 0, "HTML element IDs are unique", [...new Set(duplicateIds)].join(", "));
assert(corruptedFiles.length === 0, "source files contain no replacement or private-use mojibake", corruptedFiles.join(", "));
console.log(`Translation catalog: ${zhKeys.length} paired keys; ${uniqueHtmlKeys.length} used by HTML.`);

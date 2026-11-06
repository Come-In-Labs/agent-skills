// Print a shareable report (Markdown) as an A4 PDF on white paper:
//   node report-to-pdf.mjs <report.md> [--out <file.pdf>] [--css <brand.css>]
// Converts the Markdown the report template uses (headings, paragraphs, lists,
// tables, quotes, bold, italics, code, links) and prints it with a local
// Chrome, Chromium or Edge in headless mode. CHROME_PATH picks the browser.
// A brand stylesheet may change fonts and the accent; the paper stays white.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const outArg = option("--out");
const cssArg = option("--css");
const input = args[0];
if (!input || !existsSync(input)) {
  console.error("usage: node report-to-pdf.mjs <report.md> [--out <file.pdf>] [--css <brand.css>]");
  process.exit(1);
}
const out = resolve(outArg ?? input.replace(/\.md$/i, "") + ".pdf");

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text) {
  const codes = [];
  let s = escape(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

const LIST_ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const STARTS_BLOCK = /^(#{1,4}\s|\s*([-*]|\d+\.)\s|\s*>|\s*\|)/;
const NUMBER = /^[+\-−]?\d/;

function toHtml(md) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks = [];
  const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (!line.trim() || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      // A rule prints as space only, never as a drawn line.
      i++;
    } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      blocks.push({ tag: `h${m[1].length}`, html: inline(m[2]) });
      i++;
    } else if (TABLE_ROW.test(line) && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cells(lines[i++]));
      // A column whose cells are all figures is right-aligned, header included.
      const numeric = head.map((_, j) => j > 0 && rows.some((r) => r[j]) && rows.every((r) => !r[j] || NUMBER.test(r[j])));
      const cell = (tag, c, j) => `<${tag}${numeric[j] ? ' class="num"' : ""}>${inline(c ?? "")}</${tag}>`;
      const thead = `<tr>${head.map((c, j) => cell("th", c, j)).join("")}</tr>`;
      const tbody = rows.map((r) => `<tr>${head.map((_, j) => cell("td", r[j], j)).join("")}</tr>`).join("");
      blocks.push({ tag: "table", html: `<thead>${thead}</thead><tbody>${tbody}</tbody>` });
    } else if (LIST_ITEM.test(line)) {
      const ordered = /\d/.test(line.match(LIST_ITEM)[1]);
      const items = [];
      while (i < lines.length) {
        const item = lines[i].match(LIST_ITEM);
        if (item) items.push(item[2]);
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
        i++;
      }
      blocks.push({ tag: ordered ? "ol" : "ul", html: items.map((t) => `<li>${inline(t)}</li>`).join("") });
    } else if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ tag: "blockquote", html: inline(quote.join(" ")) });
    } else {
      const para = [line.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !STARTS_BLOCK.test(lines[i])) para.push(lines[i++].trim());
      blocks.push({ tag: "p", html: inline(para.join(" ")) });
    }
  }
  // Under the title: the first paragraph is the period line, the second the summary.
  const firstSection = blocks.findIndex((b) => b.tag === "h2");
  blocks
    .slice(0, firstSection < 0 ? blocks.length : firstSection)
    .filter((b) => b.tag === "p")
    .slice(0, 2)
    .forEach((b, n) => (b.cls = n === 0 ? "meta" : "lead"));
  return blocks.map((b) => `<${b.tag}${b.cls ? ` class="${b.cls}"` : ""}>${b.html}</${b.tag}>`).join("\n");
}

const CSS = `
@page { size: A4; margin: 18mm 17mm 20mm;
  @bottom-right { content: counter(page) " / " counter(pages); font: 8.5pt var(--text); color: #8a8f98; } }
:root { --ink: #16181d; --muted: #5d636e; --hair: #e3e5e8; --accent: #1f4fd1;
  --display: "Fraunces", Georgia, serif; --text: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif; }
html, body { background: #ffffff; }
body { margin: 0; color: var(--ink); font: 10.5pt/1.5 var(--text); font-variant-numeric: tabular-nums;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1 { font: 600 27pt/1.1 var(--display); letter-spacing: -0.01em; margin: 0 0 6pt; }
.meta { color: var(--muted); font-size: 9.5pt; margin: 0 0 18pt; }
.lead { font-size: 12.5pt; line-height: 1.5; margin: 0 0 20pt; max-width: 160mm; }
.lead strong:first-child { color: var(--accent); }
h2 { font: 600 14.5pt/1.25 var(--display); margin: 18pt 0 6pt; break-after: avoid; }
h3 { font: 600 11pt/1.3 var(--text); margin: 14pt 0 6pt; break-after: avoid; }
p { margin: 0 0 8pt; }
ul, ol { margin: 0 0 10pt; padding-left: 14pt; }
li { margin: 0 0 4pt; }
li::marker { color: var(--muted); }
table { width: 100%; border-collapse: collapse; margin: 2pt 0 12pt; font-size: 9.8pt; }
th { text-align: left; font-weight: 600; color: var(--muted); padding: 0 10pt 4pt 0; border-bottom: 0.6pt solid var(--hair); vertical-align: bottom; }
td { padding: 3.5pt 10pt 3.5pt 0; border-bottom: 0.6pt solid var(--hair); vertical-align: top; }
th.num, td.num { text-align: right; padding-right: 0; padding-left: 10pt; white-space: nowrap; }
table, ul, ol, blockquote, tr { break-inside: avoid; }
/* A heading and its intro line stay with the block they introduce. */
h2 + p, h3 + p { break-after: avoid; }
blockquote { margin: 0 0 10pt; font-style: italic; }
code { font: 9pt ui-monospace, Menlo, monospace; }
a { color: inherit; }
`;

const md = readFileSync(input, "utf8");
const title = escape((md.match(/^#\s+(.*)$/m) ?? [, "Report"])[1]);
const brand = cssArg ? readFileSync(cssArg, "utf8") : "";
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>${CSS}${brand}</style></head><body>${toHtml(md)}</body></html>`;

function findBrowser() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const known = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const found = known.find((p) => existsSync(p));
  if (found) return found;
  // Playwright's own Chromium, newest first.
  const cache = join(homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright");
  if (!existsSync(cache)) return null;
  for (const dir of readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    for (const rel of [
      "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
      "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      "chrome-linux/chrome",
      "chrome-linux64/chrome",
    ]) {
      if (existsSync(join(cache, dir, rel))) return join(cache, dir, rel);
    }
  }
  return null;
}

const browser = findBrowser();
if (!browser) {
  console.error("No Chrome, Chromium or Edge found. Set CHROME_PATH to one.");
  process.exit(1);
}

// A throwaway profile, so a running browser's own profile is never touched.
const work = mkdtempSync(join(tmpdir(), "report-pdf-"));
try {
  const page = join(work, "report.html");
  writeFileSync(page, html);
  execFileSync(browser, [
    "--headless",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${join(work, "profile")}`,
    "--no-pdf-header-footer",
    "--print-to-pdf-no-header",
    "--virtual-time-budget=10000",
    `--print-to-pdf=${out}`,
    pathToFileURL(page).href,
  ], { stdio: "ignore", timeout: 120000 });
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (!existsSync(out)) {
  console.error("The browser wrote no PDF.");
  process.exit(1);
}
const pages = (readFileSync(out, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`${out} (${pages} ${pages === 1 ? "page" : "pages"})`);

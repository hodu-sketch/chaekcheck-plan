#!/usr/bin/env node
'use strict';

// Builds a static HTML view of a markdown document with its Mermaid diagrams already drawn (inline SVG, no script),
// so the original can be read outside the canvas: in the app's file pane or sent with SendUserFile.
//
//   node .claude/skills/plan-canvas/original-page.cjs <doc.md> <svg-dir> [out.html]
//
// <svg-dir> holds mermaid-<n>.svg files made with mermaid-svg-server.cjs (n = order of the ```mermaid blocks).
// Default output: <doc dir>/easy/<name>-original.html. Light theme only by itself (no canvas, so no toggle).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const [src, svgDir, outArg] = process.argv.slice(2);
if (!src || !svgDir) { console.error('usage: original-page.cjs <doc.md> <svg-dir> [out.html]'); process.exit(2); }
const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const { renderMarkdown } = require(path.join(globalRoot, 'ecc-universal', 'scripts', 'lib', 'plan-canvas', 'markdown.js'));

const md = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
let n = 0;
let missing = 0;
// Swap each mermaid block for a placeholder before rendering, then put the SVG in.
const marked = md.replace(/```mermaid\n[\s\S]*?```/g, () => `\n\nMERMAIDSVG${n++}END\n\n`);
let html = renderMarkdown(marked).replace(/<p>\s*MERMAIDSVG(\d+)END\s*<\/p>|MERMAIDSVG(\d+)END/g, (m, a, b) => {
  const file = path.join(svgDir, 'mermaid-' + (a || b) + '.svg');
  if (!fs.existsSync(file)) { missing++; return '<p class="miss">[그림을 그리지 못했습니다]</p>'; }
  const svg = fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*>/, '');
  return '<div class="dg">' + svg + '</div>';
});

const page = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${path.basename(src)} (원문)</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--text:#1f2328;--muted:#5b636e;--line:#dcd9d2;--accent:#2f5d8a;--code-bg:#f0eee9}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Noto Sans KR",system-ui,sans-serif;font-size:17px;line-height:1.7;word-break:keep-all;overflow-wrap:break-word}
main{max-width:980px;margin:0 auto;padding:32px 16px 80px;background:var(--card)}
h1,h2,h3,h4{line-height:1.35;text-wrap:balance}h1{font-size:28px}h2{font-size:23px;margin-top:40px;border-top:1px solid var(--line);padding-top:24px}h3{font-size:19px}
table{border-collapse:collapse;width:100%;font-size:15px;margin:10px 0 16px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}th{background:var(--code-bg)}
code{font-family:ui-monospace,Consolas,monospace;font-size:.86em;background:var(--code-bg);padding:1px 4px;border-radius:4px;word-break:break-all}
pre{background:var(--code-bg);padding:12px;border-radius:8px;overflow-x:auto}pre code{background:none;padding:0}
.dg{overflow-x:auto;border:1px solid var(--line);border-radius:10px;padding:12px;margin:12px 0 20px;background:#fff}.dg svg{max-width:none;height:auto}
.note{color:var(--muted);font-size:15px}.miss{color:#a1302b}
a{color:var(--accent)}
</style>
</head>
<body>
<main>
<p class="note">이 페이지는 <code>${src.replace(/\\/g, '/')}</code> 원문을 그대로 옮기고 그림만 미리 그려 넣은 것입니다. 원문이 바뀌면 다시 만들어야 합니다.</p>
${html}
</main>
</body>
</html>
`;
const out = outArg || path.join(path.dirname(src), 'easy', path.basename(src, path.extname(src)) + '-original.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(JSON.stringify({ html: out, diagrams: n, missing }));

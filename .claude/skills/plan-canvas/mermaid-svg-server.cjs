#!/usr/bin/env node
'use strict';

// Helps turn the Mermaid blocks of a markdown document into static SVG, so the document can be shown as an HTML page
// that needs no script (pages sent with SendUserFile and the app's file pane do not run scripts).
//
//   node .claude/skills/plan-canvas/mermaid-svg-server.cjs <doc.md> <out-dir> [port]
//
// 1. Serves GET /blocks -> ["<mermaid source>", ...] (the document's ```mermaid blocks, in order).
// 2. Accepts POST /svg?i=<n> with the rendered SVG as the body and writes <out-dir>/mermaid-<n>.svg.
// 3. GET /done stops the server.
// A page in the built-in browser renders the blocks with Mermaid and posts the SVGs back; see the skill
// ("Showing the original with rendered diagrams") for the snippet. CORS is open: loopback only, short-lived.

const fs = require('fs');
const http = require('http');
const path = require('path');

const [doc, outDir, portArg] = process.argv.slice(2);
if (!doc || !outDir) { console.error('usage: mermaid-svg-server.cjs <doc.md> <out-dir> [port]'); process.exit(2); }
const port = Number(portArg) || 4599;
const md = fs.readFileSync(doc, 'utf8').replace(/\r\n/g, '\n');
const blocks = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(m => m[1]);
fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/blocks') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(blocks)); }
  if (url.pathname === '/svg' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { fs.writeFileSync(path.join(outDir, 'mermaid-' + Number(url.searchParams.get('i')) + '.svg'), Buffer.concat(chunks)); res.writeHead(204); res.end(); });
    return;
  }
  if (url.pathname === '/done') { res.writeHead(204); res.end(); return server.close(); }
  res.writeHead(404); res.end();
});
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ port, blocks: blocks.length, outDir })));
setTimeout(() => server.close(), 5 * 60 * 1000).unref();

#!/usr/bin/env node
'use strict';

// Builds a proposal-review page for plan-canvas from a chaekcheck-plan markdown document.
//
//   node .claude/skills/plan-canvas/proposal-review.cjs <doc.md>
//
// Output (next to the document, git-ignored):
//   <dir>/.review/<name>.review.html     open this in the canvas instead of the .md
//   <dir>/.review/<name>.proposals.json  "#N" -> source line and context, to map decisions back
//
// Every [안] tag becomes a numbered chip. Clicking it offers 승인 / 미승인 / 기타 (기타 = free text: a question or
// the user's own suggestion); the choice is queued in the canvas as an annotation "[안 #N] 승인|미승인|기타: <text>" and sent with the "보내기" button.
// [확정] and [확인 필요] tags are styled as badges. Re-run after every edit to the .md (the canvas
// live-reloads the .html).
//
// Reuses the markdown renderer and page template of the installed ecc-universal package.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const src = process.argv[2];
if (!src) {
  console.error('usage: proposal-review.cjs <doc.md>');
  process.exit(2);
}

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const libDir = path.join(globalRoot, 'ecc-universal', 'scripts', 'lib', 'plan-canvas');
const { renderMarkdown } = require(path.join(libDir, 'markdown.js'));
const { renderMarkdownArtifactHtml } = require(path.join(libDir, 'ui.js'));

const TAG = '[안]';
const md = fs.readFileSync(src, 'utf8');

// Source positions of [안], skipping fenced blocks and inline code (the page script skips the same).
const proposals = [];
let inFence = false;
md.split('\n').forEach((line, i) => {
  if (line.trim().startsWith('```')) { inFence = !inFence; return; }
  if (inFence) return;
  const outside = line.split(/(`[^`]*`)/).filter(p => !p.startsWith('`')).join('');
  let from = 0;
  let at;
  while ((at = outside.indexOf(TAG, from)) !== -1) {
    proposals.push({ n: proposals.length + 1, line: i + 1, text: line.trim().slice(0, 200) });
    from = at + TAG.length;
  }
});

const page = renderMarkdownArtifactHtml(renderMarkdown(md), { title: path.basename(src), sdkSrc: '/sdk.js' });

const style = `<style>
.pv-chip{display:inline-flex;align-items:center;gap:3px;margin:0 2px;padding:0 7px;border-radius:99px;border:1px solid var(--orange);background:var(--orange-glow);color:var(--orange);font:600 11.5px var(--font);line-height:1.6;cursor:pointer;vertical-align:1px}
.pv-chip:before{content:'💡'}
.pv-chip.ok{border-color:var(--green);background:var(--green-glow);color:var(--green)}.pv-chip.ok:before{content:'✅'}
.pv-chip.no{border-color:var(--red);background:var(--red-glow);color:var(--red)}.pv-chip.no:before{content:'❌'}
.pv-chip.etc{border-color:var(--accent);background:var(--accent-glow);color:var(--accent)}.pv-chip.etc:before{content:'💬'}
.pv-badge{display:inline-block;margin:0 2px;padding:0 6px;border-radius:99px;font:600 11px var(--font);line-height:1.6;vertical-align:1px}
.pv-fixed{border:1px solid var(--green);color:var(--green)}
.pv-check{border:1px solid var(--pink);color:var(--pink)}
.pv-pop{position:absolute;z-index:1000;display:none;width:300px;background:var(--surface);border:1px solid var(--border-light);border-radius:8px;box-shadow:var(--shadow-lg);padding:10px 12px;font:13px var(--font);color:var(--text)}
.pv-pop .ctx{font-size:11.5px;color:var(--text2);margin-bottom:8px;max-height:70px;overflow:auto}
.pv-pop .row{display:flex;gap:6px;margin-top:8px}
.pv-pop button{flex:1;border-radius:6px;padding:5px 0;font:600 12px var(--font);cursor:pointer;border:1px solid var(--border-light);background:var(--bg3);color:var(--text)}
.pv-pop button.ok{border-color:var(--green);color:var(--green)}.pv-pop button.no{border-color:var(--red);color:var(--red)}
.pv-pop textarea{display:none;width:100%;min-height:54px;margin-top:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font:12.5px var(--font);padding:6px}
.pv-bar{position:fixed;right:16px;bottom:16px;z-index:999;display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border-light);border-radius:99px;box-shadow:var(--shadow-lg);padding:6px 8px 6px 14px;font:600 12.5px var(--font);color:var(--text)}
.pv-bar button{border-radius:99px;padding:5px 14px;border:1px solid var(--accent);background:var(--accent);color:#fff;font:600 12px var(--font);cursor:pointer}
.pv-bar button:disabled{opacity:.4;cursor:default}
</style>`;

const script = `<script>
(() => {
  const post = m => window.parent.postMessage(m, '*');
  const SKIP = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA']);
  const TAGS = [['[안]', 'p'], ['[확정]', 'f'], ['[확인 필요]', 'c']];
  const walker = document.createTreeWalker(document.querySelector('.doc'), NodeFilter.SHOW_TEXT, {
    acceptNode: n => {
      for (let p = n.parentElement; p; p = p.parentElement) if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      return TAGS.some(([t]) => n.nodeValue.includes(t)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let count = 0;
  const re = /\\[안\\]|\\[확정\\]|\\[확인 필요\\]/g;
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    let last = 0;
    node.nodeValue.replace(re, (m, at) => {
      frag.append(node.nodeValue.slice(last, at));
      if (m === '[안]') {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pv-chip';
        b.dataset.proposal = String(++count);
        b.textContent = '안 #' + count;
        frag.append(b);
      } else {
        const s = document.createElement('span');
        s.className = 'pv-badge ' + (m === '[확정]' ? 'pv-fixed' : 'pv-check');
        s.textContent = m.slice(1, -1);
        frag.append(s);
      }
      last = at + m.length;
      return m;
    });
    frag.append(node.nodeValue.slice(last));
    node.replaceWith(frag);
  }

  const context = chip => {
    const box = chip.closest('li, p, tr, h1, h2, h3, h4, blockquote') || chip.parentElement;
    const copy = box.cloneNode(true);
    copy.querySelectorAll('ul, ol').forEach(e => e.remove());
    copy.querySelectorAll('.pv-chip').forEach(e => { e.textContent = e === copy.querySelector('[data-proposal="' + chip.dataset.proposal + '"]') ? '【안 #' + chip.dataset.proposal + '】' : '[안]'; });
    return copy.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200);
  };

  // <label> wrappers keep the canvas annotation layer from treating clicks inside them as annotations.
  // htmlFor points at no element, so a click on the label does not activate a button inside it.
  const pop = document.createElement('label');
  pop.htmlFor = 'pv-none';
  pop.className = 'pv-pop';
  pop.innerHTML = '<div class="ctx"></div><div class="row"><button type="button" class="ok">승인</button><button type="button" class="no">미승인</button><button type="button" class="etc">기타</button></div><textarea placeholder="질문이나 바꿀 내용을 적고 Enter"></textarea>';
  document.body.append(pop);
  const ctxEl = pop.querySelector('.ctx');
  const ta = pop.querySelector('textarea');
  let current = null;
  const decided = new Map();

  const bar = document.createElement('label');
  bar.htmlFor = 'pv-none';
  bar.className = 'pv-bar';
  bar.innerHTML = '<span class="st"></span><button type="button">보내기</button>';
  document.body.append(bar);
  const st = bar.querySelector('.st');
  const send = bar.querySelector('button');
  let pending = 0;
  const refresh = () => {
    st.textContent = '안 ' + count + '개 · 고른 것 ' + decided.size + '개';
    send.disabled = pending === 0;
  };
  refresh();
  if (count === 0) bar.style.display = 'none';

  const close = () => { pop.style.display = 'none'; ta.style.display = 'none'; ta.value = ''; current = null; };
  const decide = (kind, text) => {
    const n = current.dataset.proposal;
    const label = { ok: '승인', no: '미승인', etc: '기타' }[kind];
    post({ type: 'pc:queue', item: { kind: 'annotation', text: '[안 #' + n + '] ' + label + (text ? ': ' + text : ''), anchor: { selector: '[data-proposal="' + n + '"]', tag: 'button', snippet: context(current) } } });
    current.classList.remove('ok', 'no', 'etc');
    current.classList.add(kind);
    if (kind !== 'etc') decided.set(n, kind);
    pending++;
    refresh();
    close();
  };

  document.addEventListener('click', e => {
    const chip = e.target.closest && e.target.closest('.pv-chip');
    if (chip) {
      current = chip;
      ctxEl.textContent = context(chip);
      const r = chip.getBoundingClientRect();
      pop.style.left = Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 320) + 'px';
      pop.style.top = r.bottom + 6 + window.scrollY + 'px';
      pop.style.display = 'block';
      return;
    }
    if (!pop.contains(e.target)) close();
  });
  pop.querySelector('.ok').addEventListener('click', () => decide('ok'));
  pop.querySelector('.no').addEventListener('click', () => { ta.style.display = 'block'; ta.dataset.kind = 'no'; ta.placeholder = '미승인 이유나 바꿀 내용(선택) 적고 Enter'; ta.focus(); });
  pop.querySelector('.etc').addEventListener('click', () => { ta.style.display = 'block'; ta.dataset.kind = 'etc'; ta.placeholder = '질문이나 제안을 적고 Enter'; ta.focus(); });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (ta.dataset.kind === 'etc' && !ta.value.trim()) return;
      decide(ta.dataset.kind, ta.value.trim());
    } else if (e.key === 'Escape') close();
  });
  send.addEventListener('click', () => {
    post({ type: 'pc:queue-and-send', item: { kind: 'chat', text: '안 결정 보냄: 전체 ' + count + '개 중 ' + decided.size + '개 결정' } });
    pending = 0;
    refresh();
  });
})();
</script>`;

const html = page.replace('</head>', style + '\n</head>').replace('<script src="/sdk.js"></script>', script + '\n<script src="/sdk.js"></script>');

const outDir = path.join(path.dirname(src), '.review');
fs.mkdirSync(outDir, { recursive: true });
const base = path.basename(src, path.extname(src));
const htmlPath = path.join(outDir, base + '.review.html');
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(path.join(outDir, base + '.proposals.json'), JSON.stringify({ source: src, proposals }, null, 2));
console.log(JSON.stringify({ html: htmlPath, proposals: proposals.length }));

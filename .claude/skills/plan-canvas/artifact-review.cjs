// Build a claude.ai artifact copy of a plan decision page, with 승인/미승인/기타 controls saved to the artifact db.
// usage: node build-artifact.cjs <decision-page.html> <out.html> <title>
const fs = require('fs');
const [src, out, title] = process.argv.slice(2);
const html = fs.readFileSync(src, 'utf8');
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
let main = html.match(/<main class="doc">([\s\S]*?)<\/main>/)[1];
let n = 0;
main = main.replace(/\[안\]/g, () => `<span class="chip" data-n="${++n}">안 #${n}</span>`);

const extraCss = `
:root{color-scheme:light}
body{background:var(--bg);color:var(--text)}
.chip{display:inline-block;font-size:15px;font-weight:700;color:var(--warn);background:var(--warn-bg);border:1px solid var(--warn);border-radius:999px;padding:0 10px;margin-right:6px;line-height:1.6}
.chip.done{color:var(--ok);background:var(--ok-bg);border-color:var(--ok)}
.dec{margin:12px 0 18px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--code-bg);display:flex;flex-direction:column;gap:10px}
.dec .btns{display:flex;flex-wrap:wrap;gap:8px}
.dec button{font:inherit;font-size:17px;padding:6px 16px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text);cursor:pointer}
.dec button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.dec button[aria-pressed="true"][data-c="승인"]{background:var(--ok-bg);border-color:var(--ok);color:var(--ok);font-weight:700}
.dec button[aria-pressed="true"][data-c="미승인"]{background:var(--no-bg);border-color:var(--no);color:var(--no);font-weight:700}
.dec button[aria-pressed="true"][data-c="기타"]{background:var(--accent-bg);border-color:var(--accent);color:var(--accent);font-weight:700}
.dec textarea{font:inherit;font-size:17px;width:100%;min-height:64px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--text);resize:vertical}
.dec .save{background:var(--accent);color:var(--card);border-color:var(--accent);font-weight:700}
.dec .st{font-size:15px;color:var(--muted)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 16px;margin:0 0 24px;font-size:17px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.bar b{font-variant-numeric:tabular-nums}
`;

const script = `
<script>
(function(){
  const items=[...document.querySelectorAll('.chip')].map(ch=>{
    const n=+ch.dataset.n; const box=ch.closest('.item')||ch.parentElement;
    const h=box.querySelector('h3'); const t=(h?h.textContent:'').replace(/^\\s*\\d+/, '').trim();
    const d=document.createElement('div'); d.className='dec';
    d.innerHTML='<div class="btns" role="group" aria-label="안 #'+n+' 결정">'+
      ['승인','미승인','기타'].map(c=>'<button type="button" data-c="'+c+'" aria-pressed="false">'+c+'</button>').join('')+'</div>'+
      '<textarea id="note-'+n+'" placeholder="덧붙일 말 (미승인 이유, 질문, 제안)"></textarea>'+
      '<div class="btns"><button type="button" class="save">저장</button><span class="st" aria-live="polite">아직 고르지 않았습니다</span></div>';
    box.appendChild(d);
    const st={n,title:t,chip:ch,el:d,pick:null};
    d.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{st.pick=b.dataset.c;paint(st);d.querySelector('.st').textContent='"저장"을 눌러야 기록됩니다';});
    d.querySelector('.save').onclick=()=>save(st);
    return st;
  });
  const bar=document.getElementById('bar');
  function paint(st){st.el.querySelectorAll('[data-c]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c===st.pick)));}
  let db=null; const saved={};
  function count(){const k=Object.keys(saved).length;bar.innerHTML='고른 것 <b>'+k+' / '+items.length+'</b>'+(db?' · 저장하면 Claude가 읽습니다':' · 저장 기능을 아직 불러오지 못했습니다');}
  count();
  async function save(st){
    const s=st.el.querySelector('.st');
    if(!st.pick){s.textContent='먼저 승인·미승인·기타 중 하나를 고르세요';return;}
    if(!db){s.textContent='저장할 수 없습니다. 로그인한 채로 claude.ai에서 열어 주세요';return;}
    const note=st.el.querySelector('textarea').value.trim();
    s.textContent='저장하는 중…';
    try{await db.doc('choices/q'+st.n).set({n:st.n,title:st.title,choice:st.pick,note,savedAt:new Date().toISOString()});s.textContent='저장했습니다';}
    catch(e){s.textContent='저장하지 못했습니다 ('+(e&&e.code||'오류')+'). 잠시 뒤 다시 눌러 주세요';}
  }
  (async()=>{
    try{db=window.claude&&await window.claude.use('db');}catch(e){db=null;}
    count(); if(!db) return;
    db.collection('choices').onSnapshot(snap=>{
      snap.docs.forEach(doc=>{const v=doc.data();const st=items.find(i=>i.n===v.n);if(!st)return;saved[v.n]=v;
        if(document.activeElement!==st.el.querySelector('textarea')) st.el.querySelector('textarea').value=v.note||'';
        st.pick=v.choice;paint(st);st.chip.classList.add('done');st.chip.textContent='안 #'+v.n+' · '+v.choice;
        st.el.querySelector('.st').textContent='저장됨: '+v.choice+' ('+new Date(v.savedAt).toLocaleString('ko-KR')+')';});
      count();
    },()=>{});
  })();
})();
</script>`;

const page = `<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>${style}${extraCss}</style>
<main class="doc">
<div class="bar" id="bar">불러오는 중</div>
${main}
</main>
${script}
`;
fs.writeFileSync(out, page);
console.log('chips', n);

import json, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
SC = ['직접만 (EC2 IP 1개)', '모두 (EC2 1 + Webshare 20)', '프록시만 (Webshare 20)']
SHORT = {'직접만 (EC2 IP 1개)': '프록시 없이 · 서버 IP 1개만', '모두 (EC2 1 + Webshare 20)': '서버 IP 1개 + 프록시 20개', '프록시만 (Webshare 20)': '프록시 20개만'}
RATES = [0.5, 1, 2, 5, 8]
COL = {0.5: '#86b6ef', 1: '#5598e7', 2: '#2a78d6', 5: '#1c5cab', 8: '#0d366b'}


def key(s, r):
    return f'{s}|{r if r != int(r) else int(r)}'


def line_panel(series_key_fn, field, ymax, title, x0, y0, w=270, h=170, cap=None, unit=''):
    o = [f'<g transform="translate({x0},{y0})">',
         f'<text x="0" y="-12" font-size="14" font-weight="700" fill="var(--text)">{title}</text>']
    for k in range(5):
        yv = ymax * k / 4
        y = h - h * k / 4
        o.append(f'<line x1="0" x2="{w}" y1="{y}" y2="{y}" stroke="var(--line)" stroke-width="1"/>')
        o.append(f'<text x="-6" y="{y+4}" font-size="11" text-anchor="end" fill="var(--muted)">{yv:g}{unit}</text>')
    for tx in (0, 30, 60, 90, 120):
        x = w * tx / 120
        o.append(f'<text x="{x}" y="{h+16}" font-size="11" text-anchor="middle" fill="var(--muted)">{tx}초</text>')
    if cap is not None:
        y = h - h * cap / ymax
        o.append(f'<line x1="0" x2="{w}" y1="{y}" y2="{y}" stroke="var(--no)" stroke-width="1.5" stroke-dasharray="5 4"/>')
    for r in RATES:
        ser = d[series_key_fn(r)]['series']
        pts = ' '.join(f"{w*p['t']/120:.1f},{h - h*min(p[field], ymax)/ymax:.1f}" for p in ser)
        o.append(f'<polyline points="{pts}" fill="none" stroke="{COL[r]}" stroke-width="2" stroke-linejoin="round"/>')
    o.append('</g>')
    return '\n'.join(o)


def legend(x, y):
    o = [f'<g transform="translate({x},{y})">', '<text x="0" y="0" font-size="12" fill="var(--muted)">초당 검색</text>']
    for i, r in enumerate(RATES):
        xx = 70 + i * 80
        o.append(f'<line x1="{xx}" x2="{xx+22}" y1="-4" y2="-4" stroke="{COL[r]}" stroke-width="3"/>')
        o.append(f'<text x="{xx+28}" y="0" font-size="12" fill="var(--text)">{r:g}건</text>')
    o.append('</g>')
    return '\n'.join(o)


def chart_active():
    parts = [legend(60, 20)]
    for i, s in enumerate(SC):
        parts.append(line_panel(lambda r, s=s: key(s, r), 'active', 20, SHORT[s], 60 + i * 300, 70, cap=20))
    return f'<svg viewBox="0 0 960 290" role="img" aria-label="시나리오별 열린 검색 수">{"".join(parts)}<text x="60" y="282" font-size="12" fill="var(--no)">빨간 점선 = 동시 검색 상한 20 (넘으면 바로 503 "서버가 바빠요")</text></svg>'


def chart_mem():
    parts = [legend(60, 20)]
    for i, s in enumerate(SC):
        parts.append(line_panel(lambda r, s=s: key(s, r), 'mem', 600, SHORT[s], 60 + i * 300, 70, cap=512, unit=''))
    return f'<svg viewBox="0 0 960 290" role="img" aria-label="시나리오별 힙 메모리 어림">{"".join(parts)}<text x="60" y="282" font-size="12" fill="var(--no)">빨간 점선 = JVM 힙 상한 512MB. 단위 MB</text></svg>'


def bars():
    # per scenario: share of searches refused and share of library answers not received
    W, H = 270, 150
    parts = []
    for gi, (field, title, ymax) in enumerate([('to', '도서관 답을 못 받은 비율 (확인 불가)', 100), ('ref', '바로 거절된 검색 비율 (503)', 100)]):
        y0 = 40 + gi * 220
        parts.append(f'<text x="60" y="{y0-14}" font-size="15" font-weight="700" fill="var(--text)">{title}</text>')
        for i, s in enumerate(SC):
            x0 = 60 + i * 300
            parts.append(f'<g transform="translate({x0},{y0})"><text x="0" y="8" font-size="12" fill="var(--muted)">{SHORT[s]}</text>')
            for k in (0, 50, 100):
                y = 20 + H - H * k / 100
                parts.append(f'<line x1="0" x2="{W}" y1="{y}" y2="{y}" stroke="var(--line)"/><text x="-6" y="{y+4}" font-size="11" text-anchor="end" fill="var(--muted)">{k}%</text>')
            bw = W / len(RATES)
            for j, r in enumerate(RATES):
                v = d[key(s, r)]
                if field == 'to':
                    tot = v['answered'] + v['timeouts']
                    pct = 100 * v['timeouts'] / tot if tot else 0
                else:
                    tot = v['started_total'] + v['refused_total']
                    pct = 100 * v['refused_total'] / tot if tot else 0
                bh = H * pct / 100
                x = j * bw + 6
                color = 'var(--no)' if pct >= 1 else 'var(--ok)'
                parts.append(f'<rect x="{x:.1f}" y="{20+H-bh:.1f}" width="{bw-12:.1f}" height="{max(bh,1.5):.1f}" rx="3" fill="{color}"/>')
                parts.append(f'<text x="{x+(bw-12)/2:.1f}" y="{20+H-bh-5:.1f}" font-size="11" text-anchor="middle" fill="var(--text)">{pct:.0f}%</text>')
                parts.append(f'<text x="{x+(bw-12)/2:.1f}" y="{20+H+15:.1f}" font-size="11" text-anchor="middle" fill="var(--muted)">{r:g}건/초</text>')
            parts.append('</g>')
    return f'<svg viewBox="0 0 960 450" role="img" aria-label="초당 검색 수별 확인 불가와 거절 비율">{"".join(parts)}</svg>'


def table():
    rows = ['<tr><th>길</th><th>초당 검색</th><th>2분 동안 받은 검색</th><th>바로 거절(503)</th><th>도서관 답</th><th>확인 불가</th><th>힙 어림 최대</th></tr>']
    for s in SC:
        for r in RATES:
            v = d[key(s, r)]
            m = max(p['mem'] for p in v['series'])
            rows.append(f"<tr><td>{SHORT[s]}</td><td>{r:g}</td><td>{v['started_total']}</td><td>{v['refused_total']}</td><td>{v['answered']}</td><td>{v['timeouts']}</td><td>{m:.0f}MB</td></tr>")
    return '<table>' + ''.join(rows) + '</table>'


out = {'active': chart_active(), 'mem': chart_mem(), 'bars': bars(), 'table': table()}
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)

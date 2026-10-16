"""대출 조회 부하 시뮬레이션 (어림 모델).

규칙(dev application.yml 기준): 동시 검색 20(넘으면 503 즉시 거절), 검색 하나 동시 5곳,
검색 마감 8초, 마감 3초 전부터 새 요청 안 함, 도서관 주소(호스트)마다 나가는 IP당 동시 1건 + 끝나고 1초 쉼.
가정: 같은 지역 사용자(최악) — 모든 검색이 같은 도서관 30곳 목록을 같은 순서로 묻고, 검색 하나는 10곳 답을 받으면 끝(행 한도 어림).
캐시 안 맞음(검색어가 모두 다름). 응답 시간: EC2 직접 2.3초, Webshare 1.7초 (2026-10-16 시드니 측정 1회).
메모리 어림: 바탕 힙 77MB(로컬 측정) + 캐시 최대 10MB + 진행 중 요청마다 응답 본문 0.2MB + 열린 검색마다 0.05MB.
"""
import json, random, sys

DT = 0.1
T_END = 120.0
SLOTS = 20
PAR = 5
DEADLINE = 8.0
CUTOFF = 3.0
NEED = 10
HOSTS = 30
GAP = 1.0


def run(rate, lanes):
    # lanes: list of response times
    random.seed(1)
    host_lane_free = [[0.0] * len(lanes) for _ in range(HOSTS)]  # time lane becomes usable for host
    searches = []  # dict start, done, next_idx, inflight list of (end, ok)
    t = 0.0
    acc = 0.0
    out = []
    refused_total = 0
    started_total = 0
    finished = []  # (answered, timedout)
    while t < T_END:
        acc += rate * DT
        refused = 0
        while acc >= 1.0:
            acc -= 1.0
            active = [s for s in searches if not s['closed']]
            if len(active) >= SLOTS:
                refused += 1
                refused_total += 1
            else:
                searches.append({'start': t, 'answered': 0, 'next': 0, 'inflight': [], 'closed': False, 'timeouts': 0})
                started_total += 1
        inflight_n = 0
        for s in searches:
            if s['closed']:
                continue
            # finish requests
            still = []
            for (end, lane, host) in s['inflight']:
                if end <= t:
                    s['answered'] += 1
                    host_lane_free[host][lane] = end + GAP
                else:
                    still.append((end, lane, host))
            s['inflight'] = still
            left = s['start'] + DEADLINE - t
            if s['answered'] >= NEED and not s['inflight']:
                s['closed'] = True
            elif left <= 0:
                s['timeouts'] += len(s['inflight']) + max(0, min(NEED - s['answered'], HOSTS - s['next']) - len(s['inflight']))
                for (end, lane, host) in s['inflight']:
                    host_lane_free[host][lane] = max(host_lane_free[host][lane], end + GAP)
                s['inflight'] = []
                s['closed'] = True
            else:
                # launch
                while (len(s['inflight']) < PAR and s['answered'] + len(s['inflight']) < NEED
                       and s['next'] < HOSTS and left > CUTOFF):
                    host = s['next']
                    # pick a lane free for this host
                    best = None
                    for li, rt in enumerate(lanes):
                        if host_lane_free[host][li] <= t:
                            best = li
                            break
                    if best is None:
                        break  # wait for this host (blocks in order)
                    host_lane_free[host][best] = float('inf')
                    s['inflight'].append((t + lanes[best], best, host))
                    s['next'] += 1
                inflight_n += len(s['inflight'])
            if s['closed']:
                finished.append((s['answered'], s['timeouts']))
        active = sum(1 for s in searches if not s['closed'])
        mem = 77 + 10 + inflight_n * 0.2 + active * 0.05
        out.append({'t': round(t, 1), 'active': active, 'inflight': inflight_n, 'refused': refused_total, 'mem': round(mem, 1), 'ans': sum(a for a,_ in finished), 'to': sum(b for _,b in finished)})
        t += DT
    ans = sum(a for a, _ in finished)
    to = sum(b for _, b in finished)
    return {'series': out, 'refused_total': refused_total, 'started_total': started_total,
            'answered': ans, 'timeouts': to}


if __name__ == '__main__':
    scen = {'직접만 (EC2 IP 1개)': [2.3], '모두 (EC2 1 + Webshare 20)': [2.3] + [1.7] * 20, '프록시만 (Webshare 20)': [1.7] * 20}
    rates = [0.2, 0.5, 1, 2, 3, 5, 8]
    res = {}
    for name, lanes in scen.items():
        for r in rates:
            x = run(r, lanes)
            # downsample to 1s
            ser = x['series'][::10]
            res[f'{name}|{r}'] = {'series': ser, 'refused_total': x['refused_total'], 'started_total': x['started_total'],
                                  'answered': x['answered'], 'timeouts': x['timeouts']}
            print(f"{name:28} {r:>4}/s  시작 {x['started_total']:4}  거절 {x['refused_total']:4}  답 {x['answered']:5}  확인불가 {x['timeouts']:5}  "
                  f"평균열린검색 {sum(p['active'] for p in ser[20:])/len(ser[20:]):5.1f}  최대메모리 {max(p['mem'] for p in ser):6.1f}MB")
    json.dump(res, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False)

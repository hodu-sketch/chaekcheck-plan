"""기본 검색(상세 페이지 10개) 기준, 프록시 개수·도서관 분포(지역 수 k)·동시 검색 상한별 초당 검색 가능 수 어림.
상세 페이지 10개는 사용자 지역 도서관 30곳 중 무작위(같은 곳 겹칠 수 있음).

loadsim.py와 같은 규칙. 다른 점: 검색마다 k개 지역 중 하나를 고르게 고르고, 지역마다 도서관 30곳(호스트 30개)이 따로 있음.
"버틴다" = 60초 동안 바로 거절(503) 1% 미만이고 확인 불가 1% 미만.
"""
import random, sys

DT = 0.1
DEADLINE, CUTOFF, PAR, NEED, PER_REGION, GAP = 8.0, 3.0, 5, 10, 30, 1.0


def run(rate, lanes, k, slots, t_end=60.0, seed=1):
    rnd = random.Random(seed)
    free = {}
    searches = []
    acc = 0.0
    started = refused = ans = to = 0
    max_open = 0
    max_inflight = 0
    t = 0.0
    while t < t_end:
        acc += rate * DT
        while acc >= 1:
            acc -= 1
            open_n = sum(1 for s in searches if not s['c'])
            if open_n >= slots:
                refused += 1
            else:
                started += 1
                searches.append({'st': t, 'r': rnd.randrange(k), 'a': 0, 'n': 0, 'f': [], 'c': False, 'h': [rnd.randrange(PER_REGION) for _ in range(NEED)]})
        inflight = 0
        for s in searches:
            if s['c']:
                continue
            keep = []
            for (end, li, h) in s['f']:
                if end <= t:
                    s['a'] += 1
                    free[(h, li)] = end + GAP
                else:
                    keep.append((end, li, h))
            s['f'] = keep
            left = s['st'] + DEADLINE - t
            if s['a'] >= NEED and not s['f']:
                s['c'] = True
                ans += s['a']
            elif left <= 0:
                miss = NEED - s['a']
                to += miss
                ans += s['a']
                for (end, li, h) in s['f']:
                    free[(h, li)] = max(free.get((h, li), 0), end + GAP)
                s['f'] = []
                s['c'] = True
            else:
                while len(s['f']) < PAR and s['n'] < NEED and left > CUTOFF:
                    h = s['r'] * PER_REGION + s['h'][s['n']]
                    pick = None
                    for li in range(len(lanes)):
                        if free.get((h, li), 0) <= t:
                            pick = li
                            break
                    if pick is None:
                        break
                    free[(h, pick)] = float('inf')
                    s['f'].append((t + lanes[pick], pick, h))
                    s['n'] += 1
                inflight += len(s['f'])
        searches = [s for s in searches if not s['c']] if len(searches) > 2000 else searches
        max_open = max(max_open, sum(1 for s in searches if not s['c']))
        max_inflight = max(max_inflight, inflight)
        t += DT
    tot_s = started + refused
    tot_l = ans + to
    return refused / tot_s if tot_s else 0, to / tot_l if tot_l else 0, max_open, max_inflight


def capacity(lanes, k, slots):
    best = 0.0
    info = None
    r = 0.1
    while r <= 200:
        ref, tmo, mo, mi = run(r, lanes, k, slots)
        if ref < 0.01 and tmo < 0.01:
            best, info = r, (mo, mi)
            r = r * 1.25 if r >= 1 else r + 0.1
        else:
            break
    return round(best, 1), info


if __name__ == '__main__':
    KS = [1, 3, 17]
    PS = [0, 5, 10, 20, 30, 50]
    print('slots,k,proxies,cap,max_open,max_inflight', flush=True)
    for slots in [20, 100000]:
        for k in KS:
            for p in PS:
                lanes = [2.3] + [1.7] * p
                c, info = capacity(lanes, k, slots)
                print(f"{slots},{k},{p},{c},{info[0] if info else 0},{info[1] if info else 0}", flush=True)

"""Webshare 정적 주거용 프록시 접속 시험 (사이클 밖 조사 도구, 앱 코드 아님).

사용법:
  python proxy_check.py <프록시 목록.txt> [--all] [--auth ip|password]

- 목록 파일: Webshare 대시보드 Proxy List에서 받은 .txt (한 줄에 ip:port:username:password)
- --auth ip (기본): Webshare에 이 PC의 공인 IP를 IP Authorization으로 등록한 경우. ip:port만 씀
- --auth password: 아이디·비밀번호로 접속. 비밀번호는 화면에 찍지 않음
- 기본은 앞 3개만 시험, --all이면 전부
- 프록시마다 사이트별 요청 1번, 요청 사이 1초 쉼 (IP마다 1건·1초 규칙 안)
"""
import json
import sys
import time
import urllib.error
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36")
TARGETS = [
    ("강동구립 홈페이지", "https://www.gdlibrary.or.kr/"),
    ("강동 전자도서관", "https://ebook.gdlibrary.or.kr/"),
    ("부산 전자도서관(외국 IP 막음)", "https://ebook.busan.go.kr/"),
    ("교보 구독형 강동(집 IP 막음)", "https://gdlib.dkyobobook.co.kr/"),
]
TIMEOUT = 15


def opener(proxy_url):
    handler = urllib.request.ProxyHandler({"http": proxy_url, "https": proxy_url})
    return urllib.request.build_opener(handler)


def get(op, url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    start = time.time()
    try:
        with op.open(req, timeout=TIMEOUT) as r:
            body = r.read()
            return r.status, len(body), time.time() - start, body
    except urllib.error.HTTPError as e:
        return e.code, 0, time.time() - start, b""
    except Exception as e:  # 연결 실패·시간 초과
        return type(e).__name__, 0, time.time() - start, b""


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    path = args[0]
    use_all = "--all" in args
    auth = "password" if "--auth" in args and args[args.index("--auth") + 1] == "password" else "ip"

    lines = [l.strip() for l in open(path, encoding="utf-8") if l.strip()]
    if not use_all:
        lines = lines[:3]

    for i, line in enumerate(lines, 1):
        parts = line.split(":")
        host, port = parts[0], parts[1]
        if auth == "password" and len(parts) >= 4:
            proxy_url = f"http://{parts[2]}:{parts[3]}@{host}:{port}"
        else:
            proxy_url = f"http://{host}:{port}"
        op = opener(proxy_url)
        print(f"\n[{i}/{len(lines)}] 프록시 {host}:{port}")

        status, _, sec, body = get(op, "https://ipinfo.io/json")
        if status == 200:
            info = json.loads(body)
            print(f"  나가는 IP {info.get('ip')}  나라 {info.get('country')}  통신사 {info.get('org')}")
        else:
            print(f"  나가는 IP 확인 실패: {status} (407이면 인증 문제: IP 등록 또는 --auth password)")
            continue

        for name, url in TARGETS:
            time.sleep(1)
            status, size, sec, _ = get(op, url)
            ok = "열림" if isinstance(status, int) and status < 400 else "안 열림"
            print(f"  {ok:4}  {status}  {sec:4.1f}초  {size:>7}바이트  {name}")


if __name__ == "__main__":
    main()

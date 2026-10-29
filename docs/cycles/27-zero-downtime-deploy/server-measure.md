# 운영 서버 측정 (사이클 27)

측정일: 2026-10-29, v1.21.3 운영 중

## 메모리 (`free -m`)

```
               total        used        free      shared  buff/cache   available
Mem:            1834        1366         121          69         575         467
Swap:           2047         249        1798
```

## 스왑 (`swapon --show`, `/proc/swaps`, `swappiness`)

```
NAME      TYPE SIZE   USED PRIO
/swapfile file   2G 249.9M   -1

Filename                Type        Size        Used        Priority
/swapfile               file        2097148     255860      -1
```

swappiness: **10**

## CPU / 디스크 (`nproc`, `df -h`)

```
nproc: 2

Filesystem      Size  Used Avail Use% Mounted on
/dev/root        29G   18G   11G  64% /
```

`/srv`은 `/`과 같은 파티션.

## Docker 컨테이너 (`docker stats --no-stream`)

```
CONTAINER ID   NAME                       CPU %   MEM USAGE / LIMIT     MEM %   PIDS
b122f01fd949   chaekcheck-web-1           0.00%   5.176MiB / 1.791GiB   0.28%   3
529b8b73cbcc   chaekcheck-backend-1       0.14%   712.8MiB / 1.791GiB   38.86%  54
0f53a60a4340   chaekcheck-cloudflared-1   0.24%   23.42MiB / 1.791GiB   1.28%   10
a655650265f9   chaekcheck-db-1            0.00%   279.8MiB / 1.791GiB   15.25%  19
```

## 컨테이너 상태 (`docker ps`)

```
chaekcheck-web-1       chaekcheck/web:1.21.3              Up 54 minutes
chaekcheck-backend-1   chaekcheck/backend:1.21.3          Up 54 minutes
chaekcheck-cloudflared-1 cloudflare/cloudflared:2026.10.0 Up 10 days
chaekcheck-db-1        chaekcheck/postgres-bigm:18        Up 10 days (healthy)
```

## 백엔드 시작 시간 (`docker logs`)

```
2026-10-29T19:29:23.896+09:00  INFO  Starting ChaekcheckApplication v1.21.3 using Java 25.0.4.1
2026-10-29T19:29:39.867+09:00  INFO  ai search vectors on (REMOTE): 81078 books x 1024, loaded in 396 ms
2026-10-29T19:29:42.147+09:00  INFO  Started ChaekcheckApplication in 19.383 seconds (process running for 20.63)
```

## 요약

| 항목 | 값 |
|---|---|
| 전체 메모리 | 1,834 MB |
| 사용 가능 메모리 | 467 MB |
| 스왑 | 2 GB (`/swapfile`), 250 MB 사용 중 |
| swappiness | 10 |
| CPU | 2 코어 (arm64) |
| 디스크 여유 | 11 GB (29 GB 중 64% 사용) |
| 백엔드 컨테이너 메모리 | 712.8 MB (38.86%) |
| DB 컨테이너 메모리 | 279.8 MB (15.25%) |
| 백엔드 시작 시간 | **19.4초** (프로세스 20.6초) |
| 벡터 적재 | 396 ms (81,078 books x 1024) |

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

## 2026-11-01 14:01 KST 재측정 (v1.23.1 green, 벡터 24만 줄 파일 매핑 이후)

사용자가 서버에서 직접 실행(`free -m; docker stats --no-stream; docker exec chaekcheck-backend-green-1 grep -e ^anon -e ^file /sys/fs/cgroup/memory.stat`). [확정]

| 항목 | 값 |
|---|---|
| 서버 전체 | total 1,834MB · used 1,277 · buff/cache 653 · available 557 · swap 390/2,047 사용 |
| chaekcheck-backend-green-1 | 661.4MiB (docker stats) = anon 608.7MiB + 파일 캐시 일부. cgroup file 108.7MiB, 그중 file_mapped 79.0MiB(벡터 파일 `book-vectors.bin` 235.5MB 가운데 건드린 쪽) |
| chaekcheck-db-1 | 89.4MiB (2026-10-29의 279.8MiB보다 작음, 재시작 뒤 아직 덜 올라온 것으로 보임 [확인 필요]) |
| chaekcheck-web-1 / cloudflared | 10.1MiB / 27.4MiB |

읽는 법: 백엔드의 힙·메타스페이스 등 프로세스 자체 메모리는 anon 609MB이고, 매핑한 벡터 파일은 79MB만 메모리에 올라와 있으며 이것은 힙 밖(커널이 필요하면 버릴 수 있는 파일 캐시)이다. 10-29 측정(백엔드 713MB)은 단일 백엔드·v1.21.3 때라 구성 자체가 다르다.

# 노트북에서 LLM 처음 돌려 보기 (Ollama + Qwen3-4B)

- 작성 2026-10-24. 사이클 밖 학습용. 결정: 3차 페이지 #5 "Qwen3-4B로 시작, 되면 8B" [확정] (사용자 선택, 2026-10-24). 바탕 [natural-search.md](natural-search.md) 9절
- 대상 노트북: Windows 11 Home, i7-1260P, RAM 32GB, Intel Iris Xe(전용 메모리 없음), C: 남은 약 123GB
- 모든 명령은 PowerShell에서 칩니다. 근거는 모두 Ollama GitHub 원문 (2026-10-24 확인, ollama.com은 이 환경에서 열리지 않음)

## 1. 설치

공식 설치 파일 https://ollama.com/download/OllamaSetup.exe 를 내려받아 실행합니다. 관리자 권한이 필요 없고 홈 폴더에 깔립니다 [확정] (https://github.com/ollama/ollama/blob/main/README.md , https://github.com/ollama/ollama/blob/main/docs/windows.mdx).
(README에는 `irm https://ollama.com/install.ps1 | iex` 한 줄 설치도 있습니다. 인터넷의 스크립트를 바로 실행하는 방식이라 설치 파일을 권합니다 [안].)

설치가 끝나면 Ollama가 뒤에서 켜져 있고 `http://localhost:11434`에서 요청을 받습니다 [확정] (windows.mdx). 확인:

```powershell
ollama --version
```

## 2. 모델 받기와 첫 대화

```powershell
ollama pull qwen3:4b
ollama run qwen3:4b "출근길에 가볍게 읽을 과학책의 특징을 두 문장으로 말해 줘"
```

- `qwen3:4b` 2.5GB, `qwen3:8b` 5.2GB(= `qwen3:latest`) [확정] (https://ollama.com/library/qwen3/tags , 노트북 원격 접속용 세션이 확인, 2026-10-24). `qwen3:8b`는 Ollama 문서 예시에도 나옴 (https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx)

## 3. CPU로 도는지 그래픽카드로 도는지

모델이 켜져 있는 동안:

```powershell
ollama ps
```

Processor 칸에 CPU인지 GPU인지 나옵니다 [확정] (https://github.com/ollama/ollama/blob/main/docs/faq.mdx). Windows에서는 Vulkan으로 그래픽카드를 더 쓸 수 있다고 하지만 Iris Xe에서 쓰이는지는 여기서 처음 확인합니다 (https://github.com/ollama/ollama/blob/main/docs/gpu.mdx).

## 4. 우리 서버가 부를 방식으로 요청 보내기 (OpenAI 호환 + JSON 형식)

나중에 우리 서버, vast.ai의 vLLM도 같은 방식입니다. 아래 후보 책 세 권은 **예시**입니다.

```powershell
$body = @{
  model = "qwen3:4b"
  messages = @(
    @{ role = "system"; content = "너는 도서 추천 도우미다. 반드시 후보 번호 중에서만 고르고, 질문에 맞춰 2~3문장으로 쓴다." },
    @{ role = "user"; content = "질문: 잠들기 전에 조금씩 읽을 과학책`n후보:`n1. (예시) 우주 이야기 - 짧은 장으로 된 천문학 교양서`n2. (예시) 수학의 즐거움 - 퍼즐로 배우는 수학`n3. (예시) 생명의 기원 - 생물학 입문서" }
  )
  response_format = @{
    type = "json_schema"
    json_schema = @{
      name = "picks"
      schema = @{
        type = "object"
        properties = @{ picks = @{ type = "array"; items = @{ type = "object"; properties = @{ no = @{ type = "integer" }; text = @{ type = "string" } }; required = @("no","text") } } }
        required = @("picks")
      }
    }
  }
} | ConvertTo-Json -Depth 12

$r = Invoke-RestMethod -Uri "http://localhost:11434/v1/chat/completions" -Method Post `
  -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
$r.choices[0].message.content
```

- 주소 `http://localhost:11434/v1/chat/completions`와 `response_format` 지원 [확정] (openai-compatibility.mdx). `json_schema` 형식을 Ollama가 그대로 받는지는 [확인 필요: 이 시험으로 확인]
- 한글이 깨지지 않게 본문을 UTF-8 바이트로 보냅니다

## 5. 속도 재기

Ollama 자체 주소는 응답에 `eval_count`(쓴 토큰 수)와 `eval_duration`(나노초)을 줍니다. 1초당 토큰 = `eval_count / eval_duration × 10^9` [확정] (https://github.com/ollama/ollama/blob/main/docs/api.md)

```powershell
$g = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes((@{ model = "qwen3:4b"; prompt = "과학책 한 권을 세 문장으로 소개해 줘"; stream = $false } | ConvertTo-Json)))
"{0:N1} 토큰/초" -f ($g.eval_count / $g.eval_duration * 1e9)
```

4B와 8B를 같은 글로 재서 적어 둡니다. 8B는 `ollama pull qwen3:8b` 뒤 위 명령의 모델 이름만 바꿉니다.

## 6. 적어 둘 것 (다음 단계 Haiku 비교의 바탕)

| 모델 | 토큰/초 | `ollama ps` Processor | JSON 형식 지켰나 | 한국어 글 느낌 |
|---|---|---|---|---|
| qwen3:4b | | | | |
| qwen3:8b | | | | |

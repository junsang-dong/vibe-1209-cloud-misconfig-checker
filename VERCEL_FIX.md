# 🔧 Vercel 배포 오류 수정 사항

## 발견된 문제점

### 1. ❌ vercel.json 설정 문제

**문제점:**
- `builds` 섹션이 불필요 (Vercel이 자동 감지)
- `env` 섹션의 `@` 접두사는 Vercel Secrets를 참조하는데, 환경 변수는 대시보드에서 직접 설정해야 함
- `routes` 대신 `rewrites`를 사용해야 함

**수정:**
- `builds` 섹션 제거 (자동 감지)
- `env` 섹션 제거 (대시보드에서 설정)
- `rewrites`로 API 라우팅 설정
- CORS 헤더를 `headers` 섹션으로 이동

### 2. ❌ API 함수 형식 문제

**문제점:**
- Node.js 스타일의 `req, res` 객체 사용
- Vercel Functions는 Web API 표준 `Request/Response` 객체를 사용해야 함

**수정:**
- `export default async function handler(req, res)` → `export default async function handler(req)`
- `res.status().json()` → `new Response(JSON.stringify(), { status, headers })`
- `req.body` → `await req.json()`
- 모든 응답을 `Response` 객체로 변경

## 수정된 파일

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### api/analyze.js
- Web API 표준 `Request/Response` 형식으로 변경
- CORS 헤더를 모든 응답에 포함
- `await req.json()`으로 요청 본문 파싱

## 배포 전 확인사항

1. ✅ **환경 변수 설정**
   - Vercel 대시보드 → 프로젝트 설정 → Environment Variables
   - 다음 변수 추가:
     - `OPENAI_API_KEY`
     - `LLM_API_URL` (선택)
     - `LLM_MODEL` (선택)

2. ✅ **빌드 설정**
   - Framework: Vite (자동 감지)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. ✅ **의존성 확인**
   - `package.json`의 모든 의존성이 올바른지 확인
   - `npm install`이 로컬에서 성공하는지 확인

## 테스트 방법

### 로컬 빌드 테스트
```bash
npm run build
```

### Vercel CLI로 로컬 테스트
```bash
npm i -g vercel
vercel dev
```

## 추가 참고사항

- Vercel은 자동으로 Vite 프로젝트를 감지합니다
- `api/` 폴더의 파일은 자동으로 Serverless Function으로 배포됩니다
- 환경 변수는 대시보드에서만 설정하세요 (코드에 포함하지 마세요)


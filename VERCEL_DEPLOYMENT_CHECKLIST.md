# ✅ Vercel 배포 체크리스트

## 📋 배포 전 확인사항

### 1. 코드 상태
- [x] 모든 변경사항이 GitHub에 푸시됨
- [x] `vercel.json` 설정 완료
- [x] `package.json` 빌드 스크립트 확인
- [x] API 함수 (`api/analyze.js`) 정상 작동

### 2. Vercel 프로젝트 설정

#### 프로젝트 생성
- [ ] Vercel 대시보드 접속: https://vercel.com
- [ ] "Add New..." → "Project" 클릭
- [ ] GitHub 저장소 선택: `junsang-dong/vibe-1209-cloud-misconfig-checker`
- [ ] "Import" 클릭

#### 빌드 설정 (자동 감지됨)
- [ ] Framework Preset: **Vite** ✅
- [ ] Build Command: `npm run build` ✅
- [ ] Output Directory: `dist` ✅
- [ ] Install Command: `npm install` ✅
- [ ] Root Directory: `./` ✅

#### 환경 변수 설정 (중요!)

**Settings → Environment Variables**에서 다음 변수 추가:

**필수 (LLM 분석 기능 사용 시):**
```
OPENAI_API_KEY = sk-your-openai-api-key-here
```

**선택사항:**
```
LLM_API_URL = https://api.openai.com/v1/chat/completions
LLM_MODEL = gpt-4o-mini
```

**환경 변수 추가 방법:**
1. Settings → Environment Variables 클릭
2. "Add New" 클릭
3. Name 입력 (예: `OPENAI_API_KEY`)
4. Value 입력 (예: `sk-...`)
5. Environments 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (로컬 개발 시)
6. "Save" 클릭

> **중요**: 각 환경 변수를 개별적으로 추가해야 합니다.

### 3. 배포 실행

- [ ] "Deploy" 버튼 클릭
- [ ] 빌드 로그 확인 (오류 없음)
- [ ] 배포 완료 대기 (1-3분)

### 4. 배포 후 확인

- [ ] 배포 URL 확인 (예: `https://vibe-1209-cloud-misconfig-checker.vercel.app`)
- [ ] 웹앱 접속 테스트
- [ ] 파일 업로드 기능 테스트
- [ ] 텍스트 붙여넣기 기능 테스트
- [ ] 기본 분석 기능 테스트
- [ ] API 엔드포인트 테스트 (`/api/analyze`)

## 🔧 현재 프로젝트 설정 요약

### 빌드 설정
- **Framework**: Vite (자동 감지)
- **Node Version**: 18.x (Vercel 기본값)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### API 함수
- **경로**: `/api/analyze`
- **메서드**: POST
- **CORS**: 활성화 (모든 오리진 허용)

### 환경 변수 (서버 사이드)
- `OPENAI_API_KEY`: OpenAI API 키
- `LLM_API_URL`: LLM API URL (선택)
- `LLM_MODEL`: 사용할 모델 (선택)

## 🚨 문제 해결

### 빌드 실패 시

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 실패한 배포 클릭
   - "Build Logs" 탭에서 오류 확인

2. **일반적인 문제**
   - 의존성 오류: `package.json` 확인
   - 환경 변수 누락: Environment Variables 확인
   - 빌드 명령 오류: `vercel.json` 확인

### API 함수 오류 시

1. **함수 로그 확인**
   - Vercel 대시보드 → Functions 탭
   - `/api/analyze` 함수 로그 확인

2. **일반적인 문제**
   - 환경 변수 미설정: API 키 확인
   - CORS 오류: `vercel.json` headers 확인
   - 타임아웃: 함수 실행 시간 확인

## 📊 배포 상태 확인

### GitHub 연동
- ✅ 저장소: `junsang-dong/vibe-1209-cloud-misconfig-checker`
- ✅ 브랜치: `main`
- ✅ 최신 커밋: S3 보안 분석 강화

### Vercel 배포
- [ ] 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 첫 배포 성공
- [ ] 프로덕션 URL 확인

## 🔄 자동 배포 설정

GitHub에 푸시하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

- Vercel이 자동으로 변경사항 감지
- 새로운 Preview 배포 생성
- Production 배포는 수동 승인 (설정에 따라)

## 📝 배포 완료 후 할 일

1. **프로덕션 URL 확인**
   - Vercel 대시보드에서 배포 URL 확인
   - 예: `https://vibe-1209-cloud-misconfig-checker.vercel.app`

2. **기능 테스트**
   - 파일 업로드 테스트
   - 텍스트 붙여넣기 테스트
   - 분석 결과 확인
   - LLM 분석 테스트 (API 키 설정 시)

3. **모니터링 설정**
   - Vercel Analytics 활성화 (선택)
   - 에러 로그 모니터링

## ✅ 배포 완료 체크리스트

- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 첫 배포 성공
- [ ] 웹앱 기능 테스트 완료
- [ ] 프로덕션 URL 확인

---

**배포 준비 완료!** 🚀

Vercel 대시보드에서 프로젝트를 생성하고 배포를 시작하세요.


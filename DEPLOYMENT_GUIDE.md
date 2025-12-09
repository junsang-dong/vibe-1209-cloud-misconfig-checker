# 🚀 Vercel 배포 가이드

이 문서는 Cloud Misconfig Checker를 Vercel에 배포하는 상세한 절차를 안내합니다.

## 📋 사전 준비사항

- ✅ GitHub 저장소에 코드가 푸시되어 있어야 합니다
- ✅ Vercel 계정이 필요합니다 (무료 계정 가능)
- ✅ OpenAI API 키 (선택사항, LLM 분석 기능 사용 시)

## 🔧 배포 절차

### 1단계: Vercel 프로젝트 생성

1. **Vercel 웹사이트 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 추가**
   - 대시보드에서 "Add New..." → "Project" 클릭
   - 또는 https://vercel.com/new 접속

3. **GitHub 저장소 선택**
   - "Import Git Repository" 섹션에서
   - `junsang-dong/vibe-1209-cloud-misconfig-checker` 저장소 선택
   - "Import" 클릭

### 2단계: 프로젝트 설정

1. **프로젝트 이름 확인**
   - Project Name: `vibe-1209-cloud-misconfig-checker` (또는 원하는 이름)
   - Framework Preset: **Vite** (자동 감지됨)
   - Root Directory: `./` (기본값)

2. **빌드 설정 확인**
   - Build Command: `npm run build` (자동 설정됨)
   - Output Directory: `dist` (자동 설정됨)
   - Install Command: `npm install` (자동 설정됨)

3. **환경 변수 설정 (중요!)**

   "Environment Variables" 섹션에서 다음 변수들을 추가하세요:

   #### 필수 (LLM 분석 기능 사용 시)
   ```
   OPENAI_API_KEY = sk-your-openai-api-key-here
   ```

   #### 선택사항
   ```
   LLM_API_URL = https://api.openai.com/v1/chat/completions
   LLM_MODEL = gpt-4o-mini
   ```

   **환경 변수 추가 방법:**
   1. "Environment Variables" 섹션 클릭
   2. "Name"에 변수 이름 입력 (예: `OPENAI_API_KEY`)
   3. "Value"에 변수 값 입력 (예: `sk-...`)
   4. "Environments" 선택:
      - ✅ Production
      - ✅ Preview
      - ✅ Development (로컬 개발 시)
   5. "Add" 클릭

   > **보안 참고**: API 키는 서버 사이드(Vercel Function)에서만 사용되며 클라이언트에 노출되지 않습니다.

### 3단계: 배포 실행

1. **"Deploy" 버튼 클릭**
   - 모든 설정이 완료되면 "Deploy" 버튼 클릭
   - 배포가 시작되며 진행 상황을 확인할 수 있습니다

2. **배포 완료 대기**
   - 빌드 로그를 실시간으로 확인 가능
   - 일반적으로 1-3분 소요
   - "Building..." → "Ready" 상태로 변경되면 완료

### 4단계: 배포 확인

1. **배포 URL 확인**
   - 배포 완료 후 자동 생성된 URL 확인
   - 예: `https://vibe-1209-cloud-misconfig-checker.vercel.app`
   - 이 URL로 웹앱에 접속 가능

2. **기능 테스트**
   - 파일 업로드 기능 테스트
   - 텍스트 붙여넣기 기능 테스트
   - 분석 결과 확인
   - LLM 분석 기능 테스트 (API 키 설정 시)

## 🔄 이후 업데이트 배포

GitHub에 코드를 푸시하면 자동으로 재배포됩니다:

```bash
git add .
git commit -m "업데이트 내용"
git push origin main
```

- Vercel이 자동으로 변경사항 감지
- 새로운 Preview 배포 생성
- Production 배포는 수동으로 승인 필요 (설정에 따라)

## ⚙️ 고급 설정

### 커스텀 도메인 설정

1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 도메인 연결

### 환경별 환경 변수

- **Production**: 프로덕션 환경용
- **Preview**: Pull Request 미리보기용
- **Development**: 로컬 개발용

각 환경에 다른 API 키를 설정할 수 있습니다.

### 빌드 최적화

현재 설정으로 최적화되어 있습니다:
- ✅ 프로덕션 빌드 시 콘솔 로그 제거
- ✅ 코드 압축 및 최소화
- ✅ 정적 파일 최적화

## 🐛 문제 해결

### 배포 실패 시

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 실패한 배포 클릭
   - "Build Logs" 탭에서 오류 확인

2. **일반적인 문제**
   - 의존성 오류: `package.json` 확인
   - 환경 변수 누락: Environment Variables 확인
   - 빌드 명령 오류: `vercel.json` 확인

### API 키 오류

- 환경 변수가 올바르게 설정되었는지 확인
- Production, Preview, Development 모두 설정했는지 확인
- API 키 형식이 올바른지 확인 (공백 없음)

### 함수 오류

- `api/analyze.js` 파일이 올바른 위치에 있는지 확인
- Vercel Function 로그 확인 (Functions 탭)

## 📊 모니터링

### 배포 상태 확인

- Vercel 대시보드 → Deployments
- 각 배포의 상태, 시간, 로그 확인 가능

### 성능 모니터링

- Vercel 대시보드 → Analytics
- 트래픽, 응답 시간 등 확인 가능

## 🔒 보안 체크리스트

배포 전 확인사항:

- ✅ `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- ✅ API 키가 환경 변수로 설정되었는지 확인
- ✅ `vercel.json`의 환경 변수 설정 확인
- ✅ 불필요한 파일이 커밋되지 않았는지 확인

## 📚 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel Functions 가이드](https://vercel.com/docs/functions)
- [환경 변수 관리](https://vercel.com/docs/environment-variables)

## ✅ 배포 완료 체크리스트

- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 배포 성공 확인
- [ ] 웹앱 기능 테스트 완료
- [ ] LLM 분석 기능 테스트 완료 (API 키 설정 시)

---

**배포 완료 후 웹앱 URL을 공유하세요!** 🎉


# ☁️ Cloud Misconfig Checker

클라우드 설정 오류를 자동으로 분석하는 웹 애플리케이션입니다. AWS, GCP, Azure 설정 파일의 보안 취약점을 탐지하고 개선안을 제시합니다.

## 🚀 주요 기능

### 입력 방식
- **파일 업로드**: JSON, YAML 파일 드래그 앤 드롭 또는 선택
- **텍스트 붙여넣기**: JSON/YAML 텍스트를 직접 입력하거나 붙여넣기
  - 자동 형식 감지 (JSON/YAML)
  - 수동 형식 선택 지원

### 분석 기능
- **2단계 분석 시스템**:
  1. **브라우저 기반 기본 필터링**: 정규식/조건 기반 실시간 탐지 (15개 이상 패턴)
  2. **LLM 기반 심층 분석**: OpenAI API를 통한 상세 분석 및 개선안 생성 (API 키 설정 시)

### UI/UX
- **2단 레이아웃**: 원본 정책 뷰어(왼쪽)와 분석 결과(오른쪽)를 나란히 표시
- **심각도 요약 대시보드**: Critical, High, Medium, Low 통계 표시
- **상세 분석 결과**:
  - 발견된 문제 설정 목록
  - 각 문제의 심각도 및 위치 (JSON 경로)
  - 구체적인 권장사항
  - 잠재적 위협 시나리오
- **개선된 정책 생성**: 보안 문제가 수정된 정책 자동 생성 및 다운로드

## 📋 기술 스택

- **프론트엔드**: React 18 + Vite
- **스타일링**: CSS3 (모던 그라데이션 디자인, 반응형)
- **코드 하이라이팅**: react-syntax-highlighter
- **YAML 파싱**: js-yaml
- **LLM API**: OpenAI API (또는 호환 API)

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (선택사항)

#### 로컬 개발 환경

로컬 개발 시 Vercel CLI를 사용하여 환경 변수를 설정할 수 있습니다:

```bash
# Vercel CLI 설치 (전역)
npm i -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 설정
vercel env add OPENAI_API_KEY
```

또는 `.env.local` 파일을 생성 (Vercel CLI가 자동으로 로드):

```env
OPENAI_API_KEY=your_openai_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
```

#### Vercel 배포 환경

Vercel 대시보드에서 환경 변수를 설정하세요:

1. 프로젝트 설정 > Environment Variables
2. 다음 변수 추가:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `LLM_API_URL`: (선택) LLM API URL (기본값: OpenAI)
   - `LLM_MODEL`: (선택) 사용할 모델 (기본값: gpt-4o-mini)

> **보안**: API 키는 서버 사이드(Vercel Function)에서만 사용되며 클라이언트에 노출되지 않습니다.  
> **참고**: API 키 없이도 기본 필터링 기능은 정상 작동합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 5. 빌드 미리보기

```bash
npm run preview
```

## 📁 프로젝트 구조

```
cloud-misconfig-checker/
├── api/                     # Vercel Serverless Functions
│   └── analyze.js                # LLM 분석 API (서버 사이드)
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── FileUploader.jsx      # 파일 업로드 및 텍스트 입력
│   │   ├── PolicyViewer.jsx      # 원본 정책 뷰어
│   │   ├── AnalysisPanel.jsx     # 분석 결과 패널
│   │   ├── RiskCard.jsx          # 위험 분석 카드
│   │   └── ImprovedPolicyCard.jsx # 개선안 카드
│   ├── services/            # 비즈니스 로직
│   │   ├── misconfigAnalyzer.js  # 기본 필터링 (15개 이상 패턴)
│   │   └── llmService.js         # LLM API 클라이언트 (Vercel Function 호출)
│   ├── utils/               # 유틸리티
│   │   └── fileParser.js         # 파일/텍스트 파서
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── samples/                 # 샘플 설정 파일
│   ├── aws-s3-public-bucket.json
│   ├── aws-iam-wildcard-policy.json
│   ├── gcp-service-account-overprivileged.json
│   ├── azure-nsg-open-access.json
│   └── gcp-public-bucket.yaml
├── package.json
├── vite.config.js
├── vercel.json              # Vercel 배포 설정
├── env.example              # 환경 변수 예시
└── README.md
```

## 🔍 분석 가능한 Misconfiguration

### AWS S3
- ✅ S3 버킷 Public Read 설정 (`public-read`)
- ✅ S3 버킷 버전 관리 비활성화
- ✅ S3 서버 측 암호화 미설정
- ✅ S3 버킷 정책 공개 접근 (Principal: `*`)
- ✅ S3 CORS 과도한 허용 (AllowedOrigins: `*`)

### AWS IAM
- ✅ IAM 정책 Wildcard 권한 (`Action: "*"`, `Resource: "*"`)
- ✅ IAM 약한 비밀번호 정책 (최소 길이 6자, 대문자/특수문자 불필요)
- ✅ IAM MFA 미활성화

### GCP
- ✅ 서비스 계정 과도한 권한 (Owner, Editor, Security Admin)
- ✅ 공개 스토리지 버킷 (`allUsers`, `allAuthenticatedUsers`)
- ✅ 기본 네트워크 사용

### Azure
- ✅ NSG 모든 IP 접근 허용 (`0.0.0.0/0`)
- ✅ 저장소 계정 공개 접근 (`allowBlobPublicAccess: true`)
- ✅ Key Vault 자동 키 로테이션 미설정

### 일반 보안
- ✅ 하드코딩된 자격 증명 (비밀번호, API 키, 시크릿)
- ✅ 로깅 비활성화

## 📊 심각도 레벨

- **Critical**: 하드코딩된 자격 증명 등 즉시 조치 필요
- **High**: 공개 접근, 과도한 권한 등 심각한 보안 위험
- **Medium**: 버전 관리 비활성화, 약한 정책 등 개선 권장
- **Low**: 경미한 설정 문제

## 🚢 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에 로그인
3. 새 프로젝트 추가 → GitHub 저장소 선택
4. 환경 변수 설정 (프로젝트 설정 > Environment Variables):
   - `OPENAI_API_KEY`: OpenAI API 키 (서버 사이드만 접근 가능)
   - `LLM_API_URL`: (선택) LLM API URL
   - `LLM_MODEL`: (선택) 사용할 모델
5. 배포 완료!

> **보안**: API 키는 Vercel Function(서버 사이드)에서만 사용되며 클라이언트에 노출되지 않습니다.

### 수동 배포

```bash
npm run build
```

`dist` 폴더의 내용을 정적 호스팅 서비스에 업로드하세요.

## 💡 사용 방법

### 파일 업로드
1. "파일 업로드" 탭 선택
2. JSON 또는 YAML 파일을 드래그 앤 드롭하거나 "파일 선택" 클릭
3. 분석 결과 확인

### 텍스트 붙여넣기
1. "텍스트 붙여넣기" 탭 선택
2. JSON 또는 YAML 설정 텍스트를 입력하거나 붙여넣기
3. 형식 선택 (자동 감지 권장)
4. "분석 시작" 버튼 클릭

### 분석 결과 확인
- **위험 분석 탭**: 발견된 문제, 심각도, 위치, 권장사항
- **개선안 탭**: 보안 문제가 수정된 정책 (LLM API 사용 시)

## 🔒 보안

- ✅ **API 키 보호**: API 키는 Vercel Function(서버 사이드)에서만 사용되며 클라이언트에 노출되지 않습니다
- ✅ **환경 변수 관리**: 서버 사이드 환경 변수는 Vercel 대시보드에서 안전하게 관리됩니다
- ✅ **프로덕션 빌드**: 콘솔 로그가 자동 제거됩니다
- ✅ **클라이언트 사이드**: 기본 분석은 브라우저에서 로컬로 수행됩니다
- ✅ **서버리스 아키텍처**: LLM API 호출은 Vercel Function을 통해 안전하게 처리됩니다

## 📝 샘플 파일 사용법

`samples` 폴더에 있는 샘플 파일을 사용하여 테스트할 수 있습니다:

1. 웹앱 실행
2. "파일 업로드" 탭에서 `samples` 폴더의 파일 중 하나를 드래그 앤 드롭
3. 또는 "텍스트 붙여넣기" 탭에서 파일 내용을 복사하여 붙여넣기
4. 분석 결과 확인

## 🎓 학습 목적

이 프로젝트는 다음을 학습하기에 적합합니다:

- ✅ React 함수형 컴포넌트와 Hooks
- ✅ Vite 빌드 도구 사용
- ✅ 파일 업로드 및 텍스트 파싱
- ✅ 정규식 기반 패턴 매칭
- ✅ JSON 경로 추적 알고리즘
- ✅ LLM API 통합
- ✅ 클라우드 보안 모범 사례
- ✅ 반응형 UI 디자인
- ✅ Vercel 서버리스 배포

## 🎯 주요 특징

### 토큰 효율성
- 간결한 코드 구조로 토큰 소모량 최소화
- 불필요한 의존성 제거

### 이해하기 쉬운 코드
- 명확한 컴포넌트 분리
- 주석과 설명이 포함된 코드
- 직관적인 파일 구조

### 보안 우선
- API 키 환경 변수 관리
- 클라이언트 사이드 보안
- 하드코딩된 자격 증명 탐지

### 현대적인 웹앱
- React 18 + Vite
- 반응형 디자인
- 모던 UI/UX

## 📄 라이선스

MIT

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 📚 참고 자료

- [AWS 보안 모범 사례](https://docs.aws.amazon.com/security/)
- [GCP 보안 가이드](https://cloud.google.com/security)
- [Azure 보안 모범 사례](https://docs.microsoft.com/azure/security/)

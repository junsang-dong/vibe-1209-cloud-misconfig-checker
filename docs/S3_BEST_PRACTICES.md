# 🔒 S3 버킷 정책 보안 모범 사례 가이드

이 문서는 AWS S3 버킷 정책의 보안 모범 사례를 제시합니다.

## 📋 주요 보안 문제점

### 1. ❌ 공개 접근 허용 (Critical)

**문제점:**
```json
{
  "Principal": "*",
  "Effect": "Allow",
  "Action": "s3:GetObject"
}
```

**위험:**
- 전 세계 누구나 버킷의 객체에 접근 가능
- 데이터 유출 위험
- 비용 증가 (무단 접근으로 인한 트래픽)

**해결책:**
- Principal을 특정 IAM 사용자/역할로 제한
- 필요한 경우 IP 제한 추가

### 2. ❌ HTTPS 강제 없음 (High)

**문제점:**
- HTTP를 통한 비암호화 접근 허용
- 중간자 공격(MITM) 위험

**해결책:**
```json
{
  "Sid": "DenyInsecureConnections",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": [
    "arn:aws:s3:::example-bucket",
    "arn:aws:s3:::example-bucket/*"
  ],
  "Condition": {
    "Bool": {
      "aws:SecureTransport": "false"
    }
  }
}
```

### 3. ❌ 암호화 요구사항 없음 (High)

**문제점:**
- 암호화되지 않은 객체 업로드 허용
- 저장 데이터 평문 노출 위험

**해결책:**
```json
{
  "Sid": "RequireSSEKMS",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::example-bucket/*",
  "Condition": {
    "Null": {
      "s3:x-amz-server-side-encryption-aws-kms-key-id": "true"
    }
  }
}
```

### 4. ❌ MFA 요구사항 없음 (Medium)

**문제점:**
- 민감한 데이터에 대한 2단계 인증 없음
- 계정 탈취 시 데이터 노출 위험

**해결책:**
```json
{
  "Sid": "RequireMFAForSensitiveData",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::example-bucket/sensitive/*",
  "Condition": {
    "Null": {
      "aws:MultiFactorAuthAge": "true"
    }
  }
}
```

### 5. ❌ 과도한 권한 (High)

**문제점:**
```json
{
  "Action": "s3:*"
}
```

**위험:**
- 불필요한 권한 부여
- 최소 권한 원칙 위반

**해결책:**
- 필요한 액션만 명시적으로 허용
- 예: `["s3:GetObject", "s3:PutObject"]`

### 6. ❌ IP 제한 없음 (Medium)

**문제점:**
- 공개 접근 시 전 세계 어디서나 접근 가능

**해결책:**
```json
{
  "Condition": {
    "StringEquals": {
      "aws:SourceIp": "203.0.113.0/24"
    }
  }
}
```

## ✅ 모범 사례 체크리스트

### 필수 보안 조치

- [ ] **HTTPS 강제**: `aws:SecureTransport` 조건 사용
- [ ] **암호화 요구**: SSE-KMS 또는 AES256 필수
- [ ] **최소 권한**: 필요한 액션만 허용
- [ ] **Principal 제한**: 특정 IAM 사용자/역할만 허용
- [ ] **명시적 Deny**: 보안 정책을 명확히 정의

### 권장 보안 조치

- [ ] **MFA 요구**: 민감한 데이터에 대해 MFA 필수
- [ ] **IP 제한**: 허용된 IP 범위만 접근 허용
- [ ] **버전 관리**: 실수로 삭제된 객체 복구 가능
- [ ] **생명주기 정책**: 오래된 데이터 자동 삭제
- [ ] **액세스 로깅**: 모든 접근 기록 보관

## 📝 모범 사례 정책 예시

### 예시 1: 안전한 공개 읽기 (정적 웹사이트)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::example-bucket",
        "arn:aws:s3:::example-bucket/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-bucket/public/*"
    }
  ]
}
```

### 예시 2: IAM 역할 기반 접근 (암호화 필수)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::example-bucket",
        "arn:aws:s3:::example-bucket/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "RequireSSEKMS",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::example-bucket/*",
      "Condition": {
        "Null": {
          "s3:x-amz-server-side-encryption-aws-kms-key-id": "true"
        }
      }
    },
    {
      "Sid": "AllowIAMRoleAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:role/ApplicationRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::example-bucket/*"
    }
  ]
}
```

### 예시 3: 민감한 데이터 보호 (MFA + IP 제한)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::example-bucket",
        "arn:aws:s3:::example-bucket/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "RequireMFAForSensitiveData",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::example-bucket/sensitive/*",
      "Condition": {
        "Null": {
          "aws:MultiFactorAuthAge": "true"
        }
      }
    },
    {
      "Sid": "AllowAccessWithMFAAndIP",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:user/AdminUser"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::example-bucket/sensitive/*",
      "Condition": {
        "NumericLessThan": {
          "aws:MultiFactorAuthAge": "3600"
        },
        "StringEquals": {
          "aws:SourceIp": "203.0.113.0/24"
        }
      }
    }
  ]
}
```

## 🔍 보안 검증 방법

### 1. 정책 검증 도구 사용
- AWS Policy Simulator
- AWS Access Analyzer
- 이 웹앱의 분석 기능

### 2. 정기적인 감사
- 버킷 정책 변경사항 모니터링
- CloudTrail 로그 검토
- Access Analyzer 결과 확인

### 3. 테스트
- 다양한 시나리오로 접근 테스트
- Deny 정책이 올바르게 작동하는지 확인
- 조건부 정책의 동작 검증

## 📚 참고 자료

- [AWS S3 버킷 정책 예시](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html)
- [IAM 정책 언어](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies.html)
- [S3 보안 모범 사례](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

## ⚠️ 주의사항

1. **정책 테스트**: 프로덕션 적용 전 충분한 테스트
2. **점진적 적용**: 한 번에 모든 정책을 변경하지 말고 단계적으로 적용
3. **백업**: 정책 변경 전 현재 정책 백업
4. **모니터링**: 정책 변경 후 접근 로그 모니터링

---

**이 가이드를 참고하여 안전한 S3 버킷 정책을 구성하세요!** 🔒


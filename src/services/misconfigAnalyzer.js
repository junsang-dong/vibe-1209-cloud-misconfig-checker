// 브라우저 기반 기본 Misconfiguration 필터링 (강화 버전)
export function analyzeMisconfig(data) {
  const issues = []
  const misconfigs = []
  const dataString = JSON.stringify(data).toLowerCase()
  const dataObj = typeof data === 'object' ? data : JSON.parse(JSON.stringify(data))

  // ========== AWS S3 관련 검사 ==========
  
  // S3 Public Read (정규식 강화)
  const s3PublicPatterns = [
    /public-read/i,
    /publicread/i,
    /"acl"\s*:\s*"public-read"/i,
    /"acl"\s*:\s*"public"/i
  ]
  if (s3PublicPatterns.some(pattern => pattern.test(dataString))) {
    const location = findJsonPath(dataObj, ['ACL', 'acl'], 'public-read')
    issues.push({
      type: 'S3 Public Access',
      severity: 'High',
      description: 'S3 버킷이 public-read로 설정되어 있어 누구나 읽기 접근이 가능합니다.',
      location,
      recommendation: '버킷 ACL을 private로 변경하고, 필요한 경우 버킷 정책으로 특정 사용자만 접근 허용하세요.'
    })
    misconfigs.push('S3 버킷이 public-read로 설정됨')
  }

  // S3 버킷 버전 관리 비활성화
  if (dataString.includes('versioning') && (dataString.includes('"status": "suspended"') || dataString.includes('"enabled": false'))) {
    const location = findJsonPath(dataObj, ['Versioning', 'versioning'], 'suspended')
    issues.push({
      type: 'S3 Versioning Disabled',
      severity: 'Medium',
      description: 'S3 버킷 버전 관리가 비활성화되어 있어 실수로 삭제된 객체를 복구할 수 없습니다.',
      location,
      recommendation: '버전 관리를 활성화하여 데이터 보호 및 복구 기능을 활용하세요.'
    })
    misconfigs.push('S3 버킷 버전 관리가 비활성화됨')
  }

  // S3 암호화 없음
  if (dataString.includes('server-side-encryption') && (dataString.includes('"ssealgorithm": "none"') || !dataString.includes('aes256') && !dataString.includes('aws:kms'))) {
    const location = findJsonPath(dataObj, ['ServerSideEncryption', 'server-side-encryption'], 'encryption')
    issues.push({
      type: 'S3 Encryption Missing',
      severity: 'High',
      description: 'S3 버킷에 서버 측 암호화가 설정되지 않았습니다.',
      location,
      recommendation: 'AES256 또는 AWS KMS를 사용한 서버 측 암호화를 활성화하세요.'
    })
    misconfigs.push('S3 버킷 암호화가 설정되지 않음')
  }

  // S3 버킷 정책 공개 접근 (정규식 강화)
  const publicPrincipalPattern = /"principal"\s*:\s*["']?\*["']?/i
  const allowEffectPattern = /"effect"\s*:\s*["']?allow["']?/i
  if (publicPrincipalPattern.test(dataString) && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Principal'], '*')
    issues.push({
      type: 'S3 Bucket Policy Public',
      severity: 'High',
      description: 'S3 버킷 정책이 모든 주체(*)에게 접근을 허용합니다.',
      location,
      recommendation: 'Principal을 특정 IAM 사용자/역할로 제한하고, 필요한 액션만 허용하세요.'
    })
    misconfigs.push('S3 버킷 정책이 모든 주체에 접근 허용')
  }

  // S3 CORS 과도한 허용
  if (dataString.includes('cors') && (dataString.includes('"allowedorigins": ["*"]') || dataString.includes('"allowedorigins": "*"'))) {
    const location = findJsonPath(dataObj, ['CORS', 'cors'], 'allowedorigins')
    issues.push({
      type: 'S3 CORS Overly Permissive',
      severity: 'Medium',
      description: 'S3 CORS 설정이 모든 오리진(*)을 허용하고 있습니다.',
      location,
      recommendation: '특정 도메인만 허용하도록 CORS 설정을 제한하세요.'
    })
    misconfigs.push('S3 CORS가 모든 오리진을 허용')
  }

  // S3 HTTPS 강제 없음 (aws:SecureTransport)
  const hasS3Statements = dataString.includes('"action"') && (dataString.includes('s3:') || dataString.includes('"resource"') && dataString.includes('s3:::'))
  const hasSecureTransport = dataString.includes('aws:securetransport') || dataString.includes('"securetransport"')
  if (hasS3Statements && !hasSecureTransport && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Condition'], 'SecureTransport')
    issues.push({
      type: 'S3 HTTPS Not Enforced',
      severity: 'High',
      description: 'S3 버킷 정책에 HTTPS 강제 조건이 없어 HTTP를 통한 비암호화 접근이 가능합니다.',
      location,
      recommendation: 'aws:SecureTransport 조건을 사용하여 HTTPS 연결만 허용하도록 정책을 수정하세요.'
    })
    misconfigs.push('S3 버킷 정책에 HTTPS 강제 조건 없음')
  }

  // S3 암호화 요구사항 없음 (SSE-KMS)
  const hasPutObject = dataString.includes('s3:putobject') || dataString.includes('s3:PutObject')
  const hasEncryptionCondition = dataString.includes('s3:x-amz-server-side-encryption') || dataString.includes('server-side-encryption')
  if (hasPutObject && !hasEncryptionCondition && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Action'], 'PutObject')
    issues.push({
      type: 'S3 Encryption Not Required',
      severity: 'High',
      description: 'S3 버킷 정책에 암호화 요구사항이 없어 암호화되지 않은 객체 업로드가 가능합니다.',
      location,
      recommendation: 's3:x-amz-server-side-encryption 조건을 사용하여 SSE-KMS 또는 AES256 암호화를 필수로 요구하세요.'
    })
    misconfigs.push('S3 버킷 정책에 암호화 요구사항 없음')
  }

  // S3 MFA 요구사항 없음 (민감한 데이터)
  const hasSensitiveActions = dataString.includes('s3:deleteobject') || dataString.includes('s3:putobject') || dataString.includes('taxdocuments')
  const hasMFA = dataString.includes('aws:multifactorauthage') || dataString.includes('MultiFactorAuthAge')
  if (hasSensitiveActions && !hasMFA && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Condition'], 'MultiFactorAuthAge')
    issues.push({
      type: 'S3 MFA Not Required',
      severity: 'Medium',
      description: '민감한 데이터에 대한 S3 작업에 MFA 요구사항이 없습니다.',
      location,
      recommendation: 'aws:MultiFactorAuthAge 조건을 사용하여 MFA 인증을 필수로 요구하세요.'
    })
    misconfigs.push('S3 버킷 정책에 MFA 요구사항 없음')
  }

  // S3 과도한 권한 (s3:*)
  if (dataString.includes('"action"') && (dataString.includes('"s3:*"') || dataString.includes('"action": "*"')) && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Action'], 's3:*')
    issues.push({
      type: 'S3 Overly Permissive Actions',
      severity: 'High',
      description: 'S3 버킷 정책에 모든 S3 액션(s3:*)이 허용되어 있어 과도한 권한이 부여되었습니다.',
      location,
      recommendation: '최소 권한 원칙에 따라 필요한 액션만 명시적으로 허용하세요 (예: s3:GetObject, s3:PutObject).'
    })
    misconfigs.push('S3 버킷 정책에 과도한 권한(s3:*) 부여')
  }

  // S3 IP 제한 없음 (공개 접근 시)
  const hasPublicAccess = publicPrincipalPattern.test(dataString) || dataString.includes('"principal": "*"')
  const hasIPRestriction = dataString.includes('aws:sourceip') || dataString.includes('IpAddress')
  if (hasPublicAccess && !hasIPRestriction && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Condition'], 'SourceIp')
    issues.push({
      type: 'S3 No IP Restriction',
      severity: 'Medium',
      description: '공개 접근이 허용된 S3 버킷에 IP 제한이 없어 전 세계 어디서나 접근이 가능합니다.',
      location,
      recommendation: 'aws:SourceIp 조건을 사용하여 허용된 IP 주소 범위만 접근할 수 있도록 제한하세요.'
    })
    misconfigs.push('S3 버킷 정책에 IP 제한 없음')
  }

  // S3 버킷 정책에 Deny 문이 없음 (명시적 거부)
  const hasDenyStatement = dataString.includes('"effect": "deny"') || dataString.includes('"Effect": "Deny"')
  if (hasPublicAccess && !hasDenyStatement) {
    const location = findJsonPath(dataObj, ['Statement'], 'Deny')
    issues.push({
      type: 'S3 Missing Explicit Deny',
      severity: 'Low',
      description: '공개 접근이 허용된 정책에 명시적 Deny 문이 없어 보안 제어가 약할 수 있습니다.',
      location,
      recommendation: '명시적 Deny 문을 추가하여 특정 조건(예: HTTP, 비암호화)을 명확히 차단하세요.'
    })
    misconfigs.push('S3 버킷 정책에 명시적 Deny 문 없음')
  }

  // ========== AWS IAM 관련 검사 ==========

  // IAM Wildcard Permissions (정규식 강화)
  const wildcardActionPattern = /"action"\s*:\s*["']?\*["']?/i
  const wildcardResourcePattern = /"resource"\s*:\s*["']?\*["']?/i
  if (wildcardActionPattern.test(dataString) && wildcardResourcePattern.test(dataString) && allowEffectPattern.test(dataString)) {
    const location = findJsonPath(dataObj, ['Statement', 'Action'], '*')
    issues.push({
      type: 'IAM Wildcard Permission',
      severity: 'High',
      description: 'IAM 정책에 모든 리소스(*)에 대한 모든 액션(*) 권한이 부여되어 있습니다.',
      location,
      recommendation: '최소 권한 원칙에 따라 필요한 리소스와 액션만 명시적으로 허용하세요.'
    })
    misconfigs.push('IAM 정책에 *:* 권한이 부여됨')
  }

  // IAM 비밀번호 정책 약함
  if (dataString.includes('passwordpolicy') && (
    dataString.includes('"minimumpasswordlength": 6') || 
    dataString.includes('"requireuppercasecharacters": false') ||
    dataString.includes('"requiresymbols": false')
  )) {
    const location = findJsonPath(dataObj, ['PasswordPolicy', 'passwordpolicy'], 'password')
    issues.push({
      type: 'IAM Weak Password Policy',
      severity: 'Medium',
      description: 'IAM 비밀번호 정책이 약합니다 (최소 길이 6자, 대문자/특수문자 불필요).',
      location,
      recommendation: '최소 12자 이상, 대문자/소문자/숫자/특수문자 조합을 요구하는 강력한 비밀번호 정책을 설정하세요.'
    })
    misconfigs.push('IAM 비밀번호 정책이 약함')
  }

  // IAM MFA 없음
  if (dataString.includes('mfa') && (dataString.includes('"mfadevices": []') || dataString.includes('"mfaenabled": false'))) {
    const location = findJsonPath(dataObj, ['MFADevices', 'mfa'], 'mfa')
    issues.push({
      type: 'IAM MFA Not Enabled',
      severity: 'High',
      description: 'IAM 사용자에게 MFA(다중 인증)가 활성화되지 않았습니다.',
      location,
      recommendation: '모든 IAM 사용자에게 MFA를 필수로 설정하여 보안을 강화하세요.'
    })
    misconfigs.push('IAM MFA가 활성화되지 않음')
  }

  // ========== GCP 관련 검사 ==========

  // GCP Service Account 과도한 권한 (정규식 강화)
  const gcpOverprivilegedPatterns = [
    /roles\/owner/i,
    /roles\/editor/i,
    /roles\/iam\.securityadmin/i
  ]
  if (gcpOverprivilegedPatterns.some(pattern => pattern.test(dataString))) {
    const location = findJsonPath(dataObj, ['bindings', 'role'], 'roles/owner')
    issues.push({
      type: 'GCP Overprivileged Service Account',
      severity: 'High',
      description: '서비스 계정에 Owner, Editor 또는 Security Admin 역할이 부여되어 과도한 권한을 가지고 있습니다.',
      location,
      recommendation: '최소 권한 원칙에 따라 필요한 역할만 부여하세요. Owner/Editor 대신 특정 서비스별 역할을 사용하세요.'
    })
    misconfigs.push('GCP 서비스 계정에 과도한 권한 부여')
  }

  // GCP 공개 버킷 (정규식 강화)
  const gcpPublicPatterns = [
    /allusers/i,
    /allauthenticatedusers/i,
    /"members":\s*\[\s*"allusers"\s*\]/i
  ]
  if (gcpPublicPatterns.some(pattern => pattern.test(dataString))) {
    const location = findJsonPath(dataObj, ['bindings', 'members'], 'allUsers')
    issues.push({
      type: 'GCP Public Bucket',
      severity: 'High',
      description: 'GCP 스토리지 버킷이 모든 사용자(allUsers) 또는 인증된 사용자(allAuthenticatedUsers)에게 공개되어 있습니다.',
      location,
      recommendation: '버킷 접근 권한을 특정 서비스 계정이나 IAM 역할로 제한하세요.'
    })
    misconfigs.push('GCP 버킷이 공개적으로 접근 가능')
  }

  // GCP 기본 네트워크 사용
  if (dataString.includes('default') && dataString.includes('network')) {
    const location = findJsonPath(dataObj, ['network', 'networkConfig'], 'default')
    issues.push({
      type: 'GCP Default Network Usage',
      severity: 'Medium',
      description: 'GCP 기본 네트워크를 사용하고 있어 보안 위험이 있습니다.',
      location,
      recommendation: '커스텀 VPC 네트워크를 생성하여 사용하고, 기본 네트워크는 사용하지 마세요.'
    })
    misconfigs.push('GCP 기본 네트워크 사용')
  }

  // ========== Azure 관련 검사 ==========

  // Azure NSG 모든 IP 허용 (정규식 강화)
  const azureOpenPatterns = [
    /0\.0\.0\.0\/0/i,
    /0\.0\.0\.0-255\.255\.255\.255/i,
    /"\*"/i
  ]
  if (azureOpenPatterns.some(pattern => pattern.test(dataString)) && dataString.includes('sourceaddressprefix')) {
    const location = findJsonPath(dataObj, ['properties', 'securityRules', 'sourceAddressPrefix'], '0.0.0.0')
    issues.push({
      type: 'Azure NSG Open Access',
      severity: 'High',
      description: '네트워크 보안 그룹(NSG)이 모든 IP(0.0.0.0/0)에서의 접근을 허용합니다.',
      location,
      recommendation: '특정 IP 범위나 서브넷만 허용하도록 NSG 규칙을 제한하세요.'
    })
    misconfigs.push('NSG가 0.0.0.0/0에서 접근 허용')
  }

  // Azure 저장소 계정 공개 접근
  if (dataString.includes('storageaccount') && (dataString.includes('"allowblobpublicaccess": true') || dataString.includes('"publicaccess": "blob"'))) {
    const location = findJsonPath(dataObj, ['properties', 'allowBlobPublicAccess'], 'true')
    issues.push({
      type: 'Azure Storage Public Access',
      severity: 'High',
      description: 'Azure 저장소 계정이 공개 접근을 허용하고 있습니다.',
      location,
      recommendation: 'allowBlobPublicAccess를 false로 설정하여 공개 접근을 차단하세요.'
    })
    misconfigs.push('Azure 저장소 계정이 공개 접근 허용')
  }

  // Azure 키 로테이션 없음
  if (dataString.includes('keyvault') && !dataString.includes('rotation') && !dataString.includes('automatic')) {
    const location = findJsonPath(dataObj, ['properties', 'rotationPolicy'], 'rotation')
    issues.push({
      type: 'Azure Key Rotation Missing',
      severity: 'Medium',
      description: 'Azure Key Vault에 자동 키 로테이션이 설정되지 않았습니다.',
      location,
      recommendation: 'Key Vault에 자동 키 로테이션 정책을 설정하여 정기적으로 키를 갱신하세요.'
    })
    misconfigs.push('Azure 키 로테이션이 설정되지 않음')
  }

  // ========== 일반 보안 검사 ==========

  // 하드코딩된 자격 증명
  const credentialPatterns = [
    /"password"\s*:\s*"[^"]+"/i,
    /"secret"\s*:\s*"[^"]+"/i,
    /"apikey"\s*:\s*"[^"]+"/i,
    /"accesskey"\s*:\s*"[^"]+"/i
  ]
  if (credentialPatterns.some(pattern => pattern.test(dataString))) {
    const location = findJsonPath(dataObj, ['password', 'secret', 'apiKey', 'accessKey'], 'credential')
    issues.push({
      type: 'Hardcoded Credentials',
      severity: 'Critical',
      description: '설정 파일에 하드코딩된 비밀번호, API 키 또는 자격 증명이 발견되었습니다.',
      location,
      recommendation: '모든 자격 증명을 환경 변수, 시크릿 관리자 또는 Key Vault로 이동하세요.'
    })
    misconfigs.push('하드코딩된 자격 증명 발견')
  }

  // 로깅 비활성화
  if (dataString.includes('logging') && (dataString.includes('"enabled": false') || dataString.includes('"status": "disabled"'))) {
    const location = findJsonPath(dataObj, ['Logging', 'logging'], 'disabled')
    issues.push({
      type: 'Logging Disabled',
      severity: 'Medium',
      description: '로깅이 비활성화되어 있어 보안 감사 및 모니터링이 불가능합니다.',
      location,
      recommendation: 'CloudTrail, Cloud Logging 또는 Monitor 로깅을 활성화하여 모든 활동을 기록하세요.'
    })
    misconfigs.push('로깅이 비활성화됨')
  }

  // ========== 위험도 계산 (개선) ==========
  const criticalCount = issues.filter(i => i.severity === 'Critical').length
  const highCount = issues.filter(i => i.severity === 'High').length
  const mediumCount = issues.filter(i => i.severity === 'Medium').length
  
  let riskLevel = 'Low'
  if (criticalCount > 0) {
    riskLevel = 'Critical'
  } else if (highCount >= 3) {
    riskLevel = 'High'
  } else if (highCount > 0 || mediumCount >= 5) {
    riskLevel = 'Medium'
  } else if (issues.length > 0) {
    riskLevel = 'Low'
  }

  return {
    issues,
    misconfigs,
    riskLevel,
    totalIssues: issues.length,
    severityBreakdown: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: issues.filter(i => i.severity === 'Low').length
    }
  }
}

// JSON 경로 추적 함수 개선
function findJsonPath(obj, possibleKeys, searchTerm) {
  const paths = []
  
  function traverse(current, path = '') {
    if (typeof current !== 'object' || current === null) {
      return
    }
    
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        traverse(item, `${path}[${index}]`)
      })
    } else {
      for (const key in current) {
        const currentPath = path ? `${path}.${key}` : key
        const value = current[key]
        
        // 검색어와 일치하는지 확인
        if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
          paths.push(currentPath)
        }
        
        // 가능한 키와 일치하는지 확인
        if (possibleKeys.some(pk => key.toLowerCase().includes(pk.toLowerCase()))) {
          paths.push(currentPath)
        }
        
        traverse(value, currentPath)
      }
    }
  }
  
  traverse(obj)
  
  if (paths.length > 0) {
    return paths[0] // 첫 번째 경로 반환
  }
  
  // 경로를 찾지 못한 경우 라인 번호로 대체
  const dataStr = JSON.stringify(obj, null, 2)
  const lines = dataStr.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
      return `Line ${i + 1}`
    }
  }
  
  return 'Unknown'
}


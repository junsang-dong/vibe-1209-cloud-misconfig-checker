// LLM API 서비스 (Vercel Function을 통해 호출)
// API 키는 서버 사이드에서만 사용하여 보안 강화

export async function callLLMAnalysis(policyData, basicAnalysis) {
  // 타임아웃 설정 (25초)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)
  
  try {
    // Vercel Function 엔드포인트 호출
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policyData,
        basicAnalysis
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unknown error',
        message: `HTTP ${response.status}`
      }))
      
      // API 키가 설정되지 않은 경우 null 반환 (기본 분석만 제공)
      if (response.status === 500 && (
        errorData.message?.includes('API 키') || 
        errorData.message?.includes('LLM API key not configured') ||
        errorData.error?.includes('LLM API key not configured')
      )) {
        console.warn('LLM API 키가 서버에 설정되지 않았습니다. 기본 분석만 제공됩니다.')
        return null
      }
      
      // 다른 오류는 무시하고 기본 분석만 제공
      console.warn('LLM API 호출 실패:', errorData.error || errorData.message)
      return null
    }

    const result = await response.json()
    
    // skipLLM 플래그가 있으면 null 반환 (기본 분석만 제공)
    if (result.skipLLM) {
      console.warn('LLM API 키가 서버에 설정되지 않았습니다. 기본 분석만 제공됩니다.')
      return null
    }
    
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    // 네트워크 오류, 타임아웃, 또는 기타 오류 시 null 반환
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('aborted')) {
      console.warn('LLM 분석 타임아웃: 25초 내에 응답을 받지 못했습니다.')
    } else {
      console.error('LLM 분석 호출 실패:', error.message || error)
    }
    console.warn('기본 분석만 제공됩니다.')
    return null
  }
}


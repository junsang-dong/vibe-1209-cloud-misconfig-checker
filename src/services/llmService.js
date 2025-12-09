// GPT API 서비스 (Vercel Function을 통해 호출)
// API 키는 서버 사이드에서만 사용하여 보안 강화

export async function callLLMAnalysis(policyData) {
  // 타임아웃 설정 (30초)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)
  
  try {
    // Vercel Function 엔드포인트 호출
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policyData
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: 'Unknown error',
        message: `HTTP ${response.status}`
      }))
      
      // API 키가 설정되지 않은 경우
      if (response.status === 500 && (
        errorData.message?.includes('API 키') || 
        errorData.message?.includes('LLM API key not configured') ||
        errorData.error?.includes('LLM API key not configured')
      )) {
        throw new Error('GPT API 키가 서버에 설정되지 않았습니다. Vercel 대시보드에서 환경 변수를 설정해주세요.')
      }
      
      throw new Error(errorData.error || errorData.message || `API 오류: ${response.status}`)
    }

    const result = await response.json()
    
    // skipLLM 플래그가 있으면 에러
    if (result.skipLLM) {
      throw new Error('GPT API 키가 서버에 설정되지 않았습니다.')
    }
    
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    // 네트워크 오류, 타임아웃, 또는 기타 오류
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || error.message?.includes('aborted')) {
      throw new Error('GPT 분석 타임아웃: 30초 내에 응답을 받지 못했습니다.')
    }
    
    throw error
  }
}


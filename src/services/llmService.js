// LLM API 서비스 (Vercel Function을 통해 호출)
// API 키는 서버 사이드에서만 사용하여 보안 강화

export async function callLLMAnalysis(policyData, basicAnalysis) {
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
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // API 키가 설정되지 않은 경우 null 반환 (기본 분석만 제공)
      if (response.status === 500 && errorData.message?.includes('API 키')) {
        console.warn('LLM API 키가 서버에 설정되지 않았습니다. 기본 분석만 제공됩니다.')
        return null
      }
      
      throw new Error(errorData.error || `API 오류: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    // 네트워크 오류나 서버 오류 시 기본 분석만 제공
    console.error('LLM 분석 호출 실패:', error)
    console.warn('기본 분석만 제공됩니다.')
    return null
  }
}


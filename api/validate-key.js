// API 키 유효성 검증 엔드포인트
// 클라이언트에서 입력한 API 키의 유효성을 확인합니다.

export default async function handler(req) {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    const { apiKey } = await req.json()

    if (!apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ 
          valid: false,
          message: 'API 키가 제공되지 않았습니다.'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // OpenAI API를 사용하여 키 유효성 검증
    // 간단한 모델 목록 조회로 키 유효성 확인 (비용 최소화)
    const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/models'
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return new Response(
        JSON.stringify({ 
          valid: true,
          message: 'API 키가 유효합니다.'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } else {
      const errorData = await response.json().catch(() => ({}))
      
      let message = 'API 키가 유효하지 않습니다.'
      if (response.status === 401) {
        message = '인증 실패: API 키가 올바르지 않습니다.'
      } else if (response.status === 429) {
        message = 'API 사용량 한도에 도달했습니다.'
      } else if (errorData.error?.message) {
        message = errorData.error.message
      }

      return new Response(
        JSON.stringify({ 
          valid: false,
          message: message
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error) {
    console.error('API 키 검증 오류:', error)
    return new Response(
      JSON.stringify({ 
        valid: false,
        message: 'API 키 검증 중 오류가 발생했습니다: ' + error.message
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}


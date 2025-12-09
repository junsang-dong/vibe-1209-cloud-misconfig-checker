// Vercel Serverless Function for LLM Analysis
// API 키는 서버 사이드에서만 사용하여 보안 강화

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { policyData, basicAnalysis } = req.body

    if (!policyData) {
      return res.status(400).json({ error: 'policyData is required' })
    }

    // 환경 변수에서 API 키 가져오기 (서버 사이드만 접근 가능)
    const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
    const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions'

    // API 키가 없으면 에러 반환
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'LLM API key not configured',
        message: '서버에 LLM API 키가 설정되지 않았습니다.'
      })
    }

    const policyString = typeof policyData === 'string' 
      ? policyData 
      : JSON.stringify(policyData, null, 2)

    const prompt = `다음은 클라우드 인프라 설정 파일입니다. 보안 취약점을 분석하고 개선안을 제시해주세요.

원본 정책:
${policyString}

기본 분석 결과:
- 발견된 문제: ${basicAnalysis?.misconfigs?.join(', ') || '없음'}
- 총 문제 수: ${basicAnalysis?.totalIssues || 0}

다음 JSON 형식으로 응답해주세요:
{
  "riskLevel": "High|Medium|Low",
  "misconfigs": ["문제 1", "문제 2", ...],
  "threats": ["위협 1", "위협 2", ...],
  "improvedPolicy": { 개선된_정책_JSON }
}

위협은 실제 사고로 이어질 수 있는 구체적인 시나리오를 설명해주세요.
개선된 정책은 보안 문제를 수정한 완전한 정책 JSON입니다.`

    // LLM API 호출
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 클라우드 보안 전문가입니다. 설정 파일의 보안 취약점을 분석하고 개선안을 제시합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('LLM API 오류:', response.status, errorData)
      return res.status(response.status).json({ 
        error: `LLM API 오류: ${response.status}`,
        details: errorData
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return res.status(500).json({ error: 'LLM 응답이 비어있습니다.' })
    }

    // JSON 응답 파싱
    let parsedResult = null
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError)
      // JSON이 아닌 경우 텍스트에서 정보 추출
      parsedResult = {
        riskLevel: extractRiskLevel(content),
        misconfigs: extractMisconfigs(content),
        threats: extractThreats(content),
        improvedPolicy: null,
        rawResponse: content
      }
    }

    return res.status(200).json(parsedResult)
  } catch (error) {
    console.error('서버 오류:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

// 텍스트에서 정보 추출 헬퍼 함수
function extractRiskLevel(text) {
  if (text.includes('High') || text.includes('높음') || text.includes('심각')) return 'High'
  if (text.includes('Medium') || text.includes('중간') || text.includes('보통')) return 'Medium'
  return 'Low'
}

function extractMisconfigs(text) {
  const misconfigs = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.includes('문제') || line.includes('misconfig') || line.includes('취약점')) {
      misconfigs.push(line.trim())
    }
  }
  return misconfigs.slice(0, 5)
}

function extractThreats(text) {
  const threats = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.includes('위협') || line.includes('threat') || line.includes('공격') || line.includes('취약')) {
      threats.push(line.trim())
    }
  }
  return threats.slice(0, 5)
}


// Vercel Serverless Function for LLM Analysis
// API 키는 서버 사이드에서만 사용하여 보안 강화

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
    const { policyData, apiKey: clientApiKey } = await req.json()

    if (!policyData) {
      return new Response(
        JSON.stringify({ error: 'policyData is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // API 키 우선순위: 클라이언트에서 입력한 키 > 환경 변수
    const apiKey = clientApiKey?.trim() || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY
    const apiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions'

    // API 키가 없으면 에러 반환
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'LLM API key not configured',
          message: 'GPT API 키를 입력해주세요. API 키 입력 섹션에서 키를 설정하거나, Vercel 대시보드에서 OPENAI_API_KEY 환경 변수를 설정해주세요.',
          skipLLM: true
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const policyString = typeof policyData === 'string' 
      ? policyData 
      : JSON.stringify(policyData, null, 2)

    const prompt = `다음은 클라우드 인프라 설정 파일(정책 문서)입니다. 이 정책을 상세히 분석해주세요.

원본 정책:
${policyString}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "이 정책 문서의 기본적인 의미와 목적을 간단히 설명해주세요.",
  "allowedActions": ["이 정책으로 가능한 작업 1", "가능한 작업 2", ...],
  "deniedActions": ["이 정책으로 불가능한 작업 1", "불가능한 작업 2", ...],
  "securityIssues": [
    {
      "severity": "High|Medium|Low",
      "issue": "보안 이슈 설명",
      "recommendation": "개선 권장사항"
    }
  ],
  "riskLevel": "High|Medium|Low",
  "improvedPolicy": { 개선된_정책_JSON_또는_null }
}

분석 시 다음을 포함해주세요:
1. 정책의 기본 의미: 이 정책이 무엇을 허용하고 제한하는지
2. 가능한 작업: 이 정책 하에서 수행할 수 있는 구체적인 작업들
3. 불가능한 작업: 이 정책으로 차단되거나 제한되는 작업들
4. 보안 이슈: 발견된 보안 취약점과 위험도, 개선 권장사항
5. 개선된 정책: 보안 문제를 수정한 정책 (있는 경우)`

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
      return new Response(
        JSON.stringify({ 
          error: `LLM API 오류: ${response.status}`,
          details: errorData
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'LLM 응답이 비어있습니다.' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // JSON 응답 파싱
    let parsedResult = null
    try {
      // JSON 블록 찾기 (```json ... ``` 또는 { ... } 형식)
      const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
      if (jsonBlockMatch) {
        const jsonString = jsonBlockMatch[1] || jsonBlockMatch[0]
        parsedResult = JSON.parse(jsonString)
      } else {
        // JSON이 없는 경우 텍스트에서 정보 추출 시도
        throw new Error('JSON 형식이 아닙니다')
      }
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError)
      // JSON 파싱 실패 시 기본 구조로 변환 시도
      parsedResult = {
        summary: extractSummary(content),
        allowedActions: extractAllowedActions(content),
        deniedActions: extractDeniedActions(content),
        securityIssues: extractSecurityIssues(content),
        riskLevel: extractRiskLevel(content),
        improvedPolicy: null,
        rawResponse: content
      }
    }

    // 응답 형식 검증 및 기본값 설정
    if (!parsedResult.summary) {
      parsedResult.summary = '정책 문서 분석이 완료되었습니다.'
    }
    if (!parsedResult.allowedActions) {
      parsedResult.allowedActions = []
    }
    if (!parsedResult.deniedActions) {
      parsedResult.deniedActions = []
    }
    if (!parsedResult.securityIssues) {
      parsedResult.securityIssues = []
    }
    if (!parsedResult.riskLevel) {
      parsedResult.riskLevel = parsedResult.securityIssues.length > 0 ? 'Medium' : 'Low'
    }

    return new Response(
      JSON.stringify(parsedResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('서버 오류:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

// 텍스트에서 정보 추출 헬퍼 함수
function extractSummary(text) {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('의미') || lines[i].includes('목적') || lines[i].includes('summary') || lines[i].includes('Summary')) {
      return lines.slice(i, i + 3).join(' ').trim()
    }
  }
  return '정책 문서를 분석했습니다.'
}

function extractAllowedActions(text) {
  const actions = []
  const lines = text.split('\n')
  let inAllowedSection = false
  for (const line of lines) {
    if (line.includes('가능') || line.includes('allowed') || line.includes('Allow')) {
      inAllowedSection = true
      continue
    }
    if (inAllowedSection && (line.includes('-') || line.includes('•') || line.match(/^\d+\./))) {
      const action = line.replace(/^[-•\d.\s]+/, '').trim()
      if (action && !action.includes('불가능') && !action.includes('denied')) {
        actions.push(action)
      }
    }
    if (inAllowedSection && (line.includes('불가능') || line.includes('denied'))) {
      break
    }
  }
  return actions.slice(0, 10)
}

function extractDeniedActions(text) {
  const actions = []
  const lines = text.split('\n')
  let inDeniedSection = false
  for (const line of lines) {
    if (line.includes('불가능') || line.includes('denied') || line.includes('Deny')) {
      inDeniedSection = true
      continue
    }
    if (inDeniedSection && (line.includes('-') || line.includes('•') || line.match(/^\d+\./))) {
      const action = line.replace(/^[-•\d.\s]+/, '').trim()
      if (action) {
        actions.push(action)
      }
    }
  }
  return actions.slice(0, 10)
}

function extractSecurityIssues(text) {
  const issues = []
  const lines = text.split('\n')
  let currentIssue = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 심각도 감지
    if (line.includes('High') || line.includes('높음') || line.includes('심각')) {
      if (currentIssue) issues.push(currentIssue)
      currentIssue = { severity: 'High', issue: '', recommendation: '' }
    } else if (line.includes('Medium') || line.includes('중간')) {
      if (currentIssue) issues.push(currentIssue)
      currentIssue = { severity: 'Medium', issue: '', recommendation: '' }
    } else if (line.includes('Low') || line.includes('낮음')) {
      if (currentIssue) issues.push(currentIssue)
      currentIssue = { severity: 'Low', issue: '', recommendation: '' }
    }
    
    // 이슈 설명
    if (currentIssue && (line.includes('이슈') || line.includes('문제') || line.includes('취약점'))) {
      currentIssue.issue = line.replace(/^[-•\d.\s]+/, '').trim()
    }
    
    // 권장사항
    if (currentIssue && (line.includes('권장') || line.includes('개선') || line.includes('recommendation'))) {
      currentIssue.recommendation = line.replace(/^[-•\d.\s]+/, '').trim()
    }
  }
  
  if (currentIssue) issues.push(currentIssue)
  
  return issues.slice(0, 10)
}

function extractRiskLevel(text) {
  if (text.includes('High') || text.includes('높음') || text.includes('심각')) return 'High'
  if (text.includes('Medium') || text.includes('중간') || text.includes('보통')) return 'Medium'
  return 'Low'
}


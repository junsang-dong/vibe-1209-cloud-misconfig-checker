import * as yaml from 'js-yaml'

export async function parseFile(file) {
  const text = await file.text()
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.json')) {
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new Error('JSON 파싱 실패: ' + error.message)
    }
  }

  if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
    try {
      return yaml.load(text)
    } catch (error) {
      throw new Error('YAML 파싱 실패: ' + error.message)
    }
  }

  throw new Error('지원하지 않는 파일 형식입니다. JSON 또는 YAML 파일을 사용하세요.')
}

// 텍스트를 파싱하는 함수 (파일 없이 직접 텍스트 입력)
export function parseText(text, format = 'auto') {
  if (!text || !text.trim()) {
    throw new Error('텍스트가 비어있습니다.')
  }

  // 자동 형식 감지
  if (format === 'auto') {
    const trimmed = text.trim()
    // JSON 형식인지 확인 (시작이 { 또는 [)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      format = 'json'
    } else {
      format = 'yaml'
    }
  }

  if (format === 'json') {
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new Error('JSON 파싱 실패: ' + error.message)
    }
  }

  if (format === 'yaml' || format === 'yml') {
    try {
      return yaml.load(text)
    } catch (error) {
      throw new Error('YAML 파싱 실패: ' + error.message)
    }
  }

  throw new Error('지원하지 않는 형식입니다. JSON 또는 YAML을 사용하세요.')
}


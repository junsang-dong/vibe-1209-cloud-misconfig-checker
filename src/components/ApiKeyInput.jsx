import { useState, useEffect } from 'react'
import './ApiKeyInput.css'

function ApiKeyInput({ onApiKeySet, onValidationChange }) {
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(null) // null: 미검증, true: 유효, false: 무효
  const [errorMessage, setErrorMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      setIsVisible(true)
      // 저장된 키가 있으면 자동으로 검증
      validateApiKey(savedKey)
    }
  }, [])

  const validateApiKey = async (keyToValidate = apiKey) => {
    if (!keyToValidate.trim()) {
      setIsValid(false)
      setErrorMessage('API 키를 입력해주세요.')
      onValidationChange?.(false)
      return
    }

    setIsValidating(true)
    setErrorMessage('')
    setIsValid(null)

    try {
      // 클라이언트 측 타임아웃 설정 (8초 - 서버 타임아웃 5초보다 여유있게)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: keyToValidate }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok && data.valid) {
        setIsValid(true)
        setErrorMessage('')
        localStorage.setItem('openai_api_key', keyToValidate)
        onApiKeySet?.(keyToValidate)
        onValidationChange?.(true)
      } else {
        setIsValid(false)
        setErrorMessage(data.message || 'API 키가 유효하지 않습니다.')
        localStorage.removeItem('openai_api_key')
        onApiKeySet?.(null)
        onValidationChange?.(false)
      }
    } catch (error) {
      setIsValid(false)
      
      // 타임아웃 오류 처리
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        setErrorMessage('API 키 검증 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.')
      } else {
        setErrorMessage('API 키 검증 중 오류가 발생했습니다: ' + error.message)
      }
      
      localStorage.removeItem('openai_api_key')
      onApiKeySet?.(null)
      onValidationChange?.(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    validateApiKey()
  }

  const handleClear = () => {
    setApiKey('')
    setIsValid(null)
    setErrorMessage('')
    localStorage.removeItem('openai_api_key')
    onApiKeySet?.(null)
    onValidationChange?.(false)
  }

  return (
    <div className="api-key-input-container">
      <div className="api-key-header">
        <button
          type="button"
          className="api-key-toggle"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? '🔽' : '▶️'} GPT API 키 설정
        </button>
        {isValid === true && (
          <span className="api-key-status valid">✓ 유효한 키</span>
        )}
        {isValid === false && (
          <span className="api-key-status invalid">✗ 유효하지 않은 키</span>
        )}
      </div>

      {isVisible && (
        <div className="api-key-form">
          <form onSubmit={handleSubmit}>
            <div className="api-key-input-group">
              <label htmlFor="api-key-input">OpenAI API 키</label>
              <div className="api-key-input-wrapper">
                <input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setIsValid(null)
                    setErrorMessage('')
                  }}
                  placeholder="sk-..."
                  className={`api-key-input ${isValid === true ? 'valid' : isValid === false ? 'invalid' : ''}`}
                  disabled={isValidating}
                />
                {apiKey && (
                  <button
                    type="button"
                    className="clear-button"
                    onClick={handleClear}
                    title="API 키 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              {errorMessage && (
                <p className="error-message">{errorMessage}</p>
              )}
              <p className="api-key-hint">
                💡 API 키는 브라우저에 로컬로 저장되며, 서버를 통해서만 OpenAI API에 전송됩니다.
              </p>
            </div>
            <div className="api-key-actions">
              <button
                type="submit"
                className="validate-button"
                disabled={!apiKey.trim() || isValidating}
              >
                {isValidating ? '검증 중...' : isValid === true ? '재검증' : '키 검증'}
              </button>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="api-key-link"
              >
                API 키 발급받기
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ApiKeyInput


import { useState, useEffect } from 'react'
import FileUploader from './components/FileUploader'
import PolicyViewer from './components/PolicyViewer'
import AnalysisPanel from './components/AnalysisPanel'
import ApiKeyInput from './components/ApiKeyInput'
import { callLLMAnalysis } from './services/llmService'
import './App.css'

function App() {
  const [policyData, setPolicyData] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [apiKey, setApiKey] = useState(null)
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const handleApiKeySet = (key) => {
    setApiKey(key)
  }

  const handleValidationChange = (isValid) => {
    setIsApiKeyValid(isValid)
  }

  const handleFileUpload = async (data, fileName) => {
    setPolicyData({ content: data, fileName })
    setAnalysisResult(null)
    
    // API 키가 없으면 에러 표시
    if (!apiKey || !isApiKeyValid) {
      setAnalysisResult({
        error: 'GPT API 키를 입력하고 검증해주세요. API 키 입력 섹션에서 키를 설정할 수 있습니다.'
      })
      return
    }
    
    // GPT API 기반 분석만 사용
    setIsAnalyzing(true)
    try {
      // 타임아웃 설정 (30초)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GPT 분석 타임아웃')), 30000)
      )
      
      const analysis = await Promise.race([
        callLLMAnalysis(data, apiKey),
        timeoutPromise
      ])
      
      if (analysis) {
        setAnalysisResult(analysis)
      } else {
        setAnalysisResult({
          error: 'GPT API 키가 설정되지 않았거나 분석에 실패했습니다.'
        })
      }
    } catch (error) {
      console.error('GPT 분석 실패:', error)
      setAnalysisResult({
        error: error.message || '분석 중 오류가 발생했습니다.'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>☁️ Cloud Misconfig Checker</h1>
        <p>클라우드 설정 오류 자동 분석 도구</p>
      </header>

      <main className="app-main">
        <div className="upload-section">
          <ApiKeyInput 
            onApiKeySet={handleApiKeySet}
            onValidationChange={handleValidationChange}
          />
          <FileUploader onUpload={handleFileUpload} />
        </div>

        {policyData && (
          <div className="analysis-container">
            <div className="left-panel">
              <PolicyViewer data={policyData.content} fileName={policyData.fileName} />
            </div>
            <div className="right-panel">
              <AnalysisPanel 
                analysis={analysisResult} 
                isAnalyzing={isAnalyzing}
                originalData={policyData.content}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App


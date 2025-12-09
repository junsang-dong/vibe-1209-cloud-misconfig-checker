import { useState } from 'react'
import FileUploader from './components/FileUploader'
import PolicyViewer from './components/PolicyViewer'
import AnalysisPanel from './components/AnalysisPanel'
import { analyzeMisconfig } from './services/misconfigAnalyzer'
import { callLLMAnalysis } from './services/llmService'
import './App.css'

function App() {
  const [policyData, setPolicyData] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = async (data, fileName) => {
    setPolicyData({ content: data, fileName })
    setAnalysisResult(null)

    // 1차 필터링 (브라우저 기반) - 즉시 표시
    const basicAnalysis = analyzeMisconfig(data)
    
    // 기본 분석 결과를 먼저 표시
    setAnalysisResult(basicAnalysis)
    
    // LLM 분석 (API 키가 있는 경우) - 백그라운드에서 진행
    setIsAnalyzing(true)
    try {
      // 타임아웃 설정 (30초)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LLM 분석 타임아웃')), 30000)
      )
      
      const llmAnalysis = await Promise.race([
        callLLMAnalysis(data, basicAnalysis),
        timeoutPromise
      ])
      
      // LLM 분석 결과가 있으면 업데이트
      if (llmAnalysis) {
        setAnalysisResult({
          ...basicAnalysis,
          llmAnalysis
        })
      }
    } catch (error) {
      console.error('LLM 분석 실패:', error)
      // LLM 분석 실패해도 기본 분석 결과는 유지
      // setAnalysisResult는 이미 기본 분석으로 설정되어 있음
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


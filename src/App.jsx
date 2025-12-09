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

    // 1차 필터링 (브라우저 기반)
    const basicAnalysis = analyzeMisconfig(data)
    
    // LLM 분석 (API 키가 있는 경우)
    setIsAnalyzing(true)
    try {
      const llmAnalysis = await callLLMAnalysis(data, basicAnalysis)
      setAnalysisResult({
        ...basicAnalysis,
        llmAnalysis
      })
    } catch (error) {
      console.error('LLM 분석 실패:', error)
      setAnalysisResult(basicAnalysis)
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


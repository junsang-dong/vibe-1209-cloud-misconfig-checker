import { useState } from 'react'
import FileUploader from './components/FileUploader'
import PolicyViewer from './components/PolicyViewer'
import AnalysisPanel from './components/AnalysisPanel'
import { callLLMAnalysis } from './services/llmService'
import './App.css'

function App() {
  const [policyData, setPolicyData] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileUpload = async (data, fileName) => {
    setPolicyData({ content: data, fileName })
    setAnalysisResult(null)
    
    // GPT API 기반 분석만 사용
    setIsAnalyzing(true)
    try {
      // 타임아웃 설정 (30초)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GPT 분석 타임아웃')), 30000)
      )
      
      const analysis = await Promise.race([
        callLLMAnalysis(data),
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


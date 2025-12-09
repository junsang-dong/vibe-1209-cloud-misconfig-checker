import { useState } from 'react'
import RiskCard from './RiskCard'
import ImprovedPolicyCard from './ImprovedPolicyCard'
import './AnalysisPanel.css'

function AnalysisPanel({ analysis, isAnalyzing, originalData }) {
  const [activeTab, setActiveTab] = useState('analysis')

  if (isAnalyzing) {
    return (
      <div className="analysis-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>AI 분석 중...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <div className="empty-state">
          <p>파일을 업로드하면 분석 결과가 표시됩니다</p>
        </div>
      </div>
    )
  }

  const llmAnalysis = analysis.llmAnalysis || {}
  const riskLevel = llmAnalysis.riskLevel || analysis.riskLevel || 'Low'

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2>🔍 보안 분석 결과</h2>
        <div className={`risk-badge risk-${riskLevel.toLowerCase()}`}>
          {riskLevel === 'Critical' ? '🚨 Critical' : riskLevel}
        </div>
      </div>

      <div className="panel-tabs">
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          위험 분석
        </button>
        <button
          className={activeTab === 'improved' ? 'active' : ''}
          onClick={() => setActiveTab('improved')}
        >
          개선안
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'analysis' && (
          <RiskCard 
            analysis={analysis}
            llmAnalysis={llmAnalysis}
          />
        )}
        {activeTab === 'improved' && (
          <ImprovedPolicyCard 
            improvedPolicy={llmAnalysis.improvedPolicy}
            originalData={originalData}
          />
        )}
      </div>
    </div>
  )
}

export default AnalysisPanel


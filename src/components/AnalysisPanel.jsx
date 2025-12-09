import { useState } from 'react'
import RiskCard from './RiskCard'
import ImprovedPolicyCard from './ImprovedPolicyCard'
import './AnalysisPanel.css'

function AnalysisPanel({ analysis, isAnalyzing, originalData }) {
  const [activeTab, setActiveTab] = useState('analysis')

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <div className="empty-state">
          <p>파일을 업로드하면 분석 결과가 표시됩니다</p>
        </div>
      </div>
    )
  }

  // 분석 중일 때는 기본 분석 결과를 보여주고, LLM 분석 중임을 표시
  if (isAnalyzing) {
    return (
      <div className="analysis-panel">
        <div className="panel-header">
          <h2>🔍 보안 분석 결과</h2>
          <div className={`risk-badge risk-${(analysis.riskLevel || 'Low').toLowerCase()}`}>
            {analysis.riskLevel || 'Low'}
          </div>
        </div>
        <div className="panel-tabs">
          <button className="active">위험 분석</button>
          <button disabled>개선안</button>
        </div>
        <div className="panel-content">
          <RiskCard 
            analysis={analysis}
            llmAnalysis={null}
          />
          <div className="llm-loading-indicator">
            <div className="spinner-small"></div>
            <p>AI 심층 분석 중... (기본 분석 결과는 위에 표시됩니다)</p>
          </div>
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


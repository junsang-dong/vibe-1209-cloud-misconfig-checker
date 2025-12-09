import { useState } from 'react'
import PolicyAnalysisCard from './PolicyAnalysisCard'
import ImprovedPolicyCard from './ImprovedPolicyCard'
import './AnalysisPanel.css'

function AnalysisPanel({ analysis, isAnalyzing, originalData }) {
  const [activeTab, setActiveTab] = useState('analysis')

  if (isAnalyzing) {
    return (
      <div className="analysis-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>GPT AI 분석 중...</p>
          <p className="loading-hint">정책 문서를 분석하고 있습니다. 잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <div className="empty-state">
          <p>파일을 업로드하면 GPT AI 분석 결과가 표시됩니다</p>
        </div>
      </div>
    )
  }

  const riskLevel = analysis.riskLevel || 'Low'

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h2>🔍 GPT AI 분석 결과</h2>
        {analysis.riskLevel && (
          <div className={`risk-badge risk-${riskLevel.toLowerCase()}`}>
            {riskLevel === 'Critical' ? '🚨 Critical' : riskLevel}
          </div>
        )}
      </div>

      <div className="panel-tabs">
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          분석 결과
        </button>
        {analysis.improvedPolicy && (
          <button
            className={activeTab === 'improved' ? 'active' : ''}
            onClick={() => setActiveTab('improved')}
          >
            개선안
          </button>
        )}
      </div>

      <div className="panel-content">
        {activeTab === 'analysis' && (
          <PolicyAnalysisCard analysis={analysis} />
        )}
        {activeTab === 'improved' && analysis.improvedPolicy && (
          <ImprovedPolicyCard 
            improvedPolicy={analysis.improvedPolicy}
            originalData={originalData}
          />
        )}
      </div>
    </div>
  )
}

export default AnalysisPanel


import './PolicyAnalysisCard.css'

function PolicyAnalysisCard({ analysis }) {
  if (!analysis || analysis.error) {
    return (
      <div className="policy-analysis-card">
        <div className="error-state">
          <p>❌ {analysis?.error || '분석 결과를 불러올 수 없습니다.'}</p>
          <p className="error-hint">
            GPT API 키가 Vercel 대시보드에 설정되어 있는지 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="policy-analysis-card">
      {/* 정책 요약 */}
      {analysis.summary && (
        <section className="analysis-section">
          <h3>📋 정책 문서의 기본 의미</h3>
          <div className="summary-content">
            <p>{analysis.summary}</p>
          </div>
        </section>
      )}

      {/* 가능한 작업 */}
      {analysis.allowedActions && analysis.allowedActions.length > 0 && (
        <section className="analysis-section">
          <h3>✅ 가능한 작업</h3>
          <ul className="action-list allowed">
            {analysis.allowedActions.map((action, idx) => (
              <li key={idx} className="action-item allowed">
                <span className="action-icon">✓</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 불가능한 작업 */}
      {analysis.deniedActions && analysis.deniedActions.length > 0 && (
        <section className="analysis-section">
          <h3>❌ 불가능한 작업</h3>
          <ul className="action-list denied">
            {analysis.deniedActions.map((action, idx) => (
              <li key={idx} className="action-item denied">
                <span className="action-icon">✗</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 보안 이슈 */}
      {analysis.securityIssues && analysis.securityIssues.length > 0 && (
        <section className="analysis-section">
          <h3>🔒 보안 이슈</h3>
          <ul className="security-issues-list">
            {analysis.securityIssues.map((issue, idx) => (
              <li key={idx} className={`security-issue severity-${issue.severity?.toLowerCase() || 'medium'}`}>
                <div className="issue-header">
                  <span className="issue-severity-badge">
                    {issue.severity === 'High' ? '🔴 High' : 
                     issue.severity === 'Medium' ? '🟡 Medium' : 
                     '🟢 Low'}
                  </span>
                </div>
                <p className="issue-description">{issue.issue}</p>
                {issue.recommendation && (
                  <div className="issue-recommendation">
                    <span className="recommendation-label">💡 권장사항:</span>
                    <p>{issue.recommendation}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 보안 이슈가 없는 경우 */}
      {(!analysis.securityIssues || analysis.securityIssues.length === 0) && (
        <section className="analysis-section">
          <div className="safe-state">
            <p>✅ 현재 정책에서 심각한 보안 문제가 발견되지 않았습니다.</p>
          </div>
        </section>
      )}
    </div>
  )
}

export default PolicyAnalysisCard


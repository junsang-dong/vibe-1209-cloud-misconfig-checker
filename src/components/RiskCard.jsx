import './RiskCard.css'

function RiskCard({ analysis, llmAnalysis }) {
  const issues = analysis.issues || []
  const threats = llmAnalysis?.threats || []
  const misconfigs = llmAnalysis?.misconfigs || analysis.misconfigs || []
  const severityBreakdown = analysis.severityBreakdown || {}

  return (
    <div className="risk-card">
      {/* 심각도 요약 */}
      {analysis.totalIssues > 0 && (
        <section className="risk-section summary">
          <h3>📊 심각도 요약</h3>
          <div className="severity-summary">
            {severityBreakdown.critical > 0 && (
              <div className="severity-item critical">
                <span className="severity-label">Critical</span>
                <span className="severity-count">{severityBreakdown.critical}</span>
              </div>
            )}
            {severityBreakdown.high > 0 && (
              <div className="severity-item high">
                <span className="severity-label">High</span>
                <span className="severity-count">{severityBreakdown.high}</span>
              </div>
            )}
            {severityBreakdown.medium > 0 && (
              <div className="severity-item medium">
                <span className="severity-label">Medium</span>
                <span className="severity-count">{severityBreakdown.medium}</span>
              </div>
            )}
            {severityBreakdown.low > 0 && (
              <div className="severity-item low">
                <span className="severity-label">Low</span>
                <span className="severity-count">{severityBreakdown.low}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="risk-section">
        <h3>🚨 발견된 문제 설정</h3>
        {misconfigs.length > 0 ? (
          <ul className="issue-list">
            {misconfigs.map((misconfig, idx) => (
              <li key={idx} className="issue-item">
                <span className="issue-icon">⚠️</span>
                <span className="issue-text">{misconfig}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-issues">기본 필터링에서 문제가 발견되지 않았습니다.</p>
        )}
      </section>

      {issues.length > 0 && (
        <section className="risk-section">
          <h3>🔍 상세 문제 목록</h3>
          <ul className="issue-list">
            {issues.map((issue, idx) => (
              <li key={idx} className="issue-item detailed">
                <div className="issue-header">
                  <span className="issue-type">{issue.type}</span>
                  <span className={`issue-severity severity-${issue.severity?.toLowerCase() || 'medium'}`}>
                    {issue.severity || 'Medium'}
                  </span>
                </div>
                <p className="issue-description">{issue.description}</p>
                {issue.location && (
                  <p className="issue-location">📍 위치: {issue.location}</p>
                )}
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

      {threats.length > 0 && (
        <section className="risk-section">
          <h3>💥 잠재적 위협</h3>
          <ul className="threat-list">
            {threats.map((threat, idx) => (
              <li key={idx} className="threat-item">
                <span className="threat-icon">🔥</span>
                <p>{threat}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {misconfigs.length === 0 && issues.length === 0 && threats.length === 0 && (
        <div className="safe-state">
          <p>✅ 현재 설정에서 심각한 보안 문제가 발견되지 않았습니다.</p>
        </div>
      )}
    </div>
  )
}

export default RiskCard

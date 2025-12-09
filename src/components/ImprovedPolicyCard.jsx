import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './ImprovedPolicyCard.css'

function ImprovedPolicyCard({ improvedPolicy, originalData }) {
  if (!improvedPolicy) {
    return (
      <div className="improved-policy-card">
        <div className="empty-state">
          <p>개선된 정책이 아직 생성되지 않았습니다.</p>
          <p className="hint">LLM API 키를 설정하면 자동으로 개선안이 생성됩니다.</p>
        </div>
      </div>
    )
  }

  const jsonString = typeof improvedPolicy === 'string'
    ? improvedPolicy
    : JSON.stringify(improvedPolicy, null, 2)

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'improved-policy.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="improved-policy-card">
      <div className="card-header">
        <h3>✨ 개선된 보안 설정</h3>
        <button onClick={handleDownload} className="download-button">
          📥 다운로드
        </button>
      </div>
      <div className="card-content">
        <div className="improvement-note">
          <p>💡 아래는 보안 문제가 수정된 개선된 정책입니다. 검토 후 적용하세요.</p>
        </div>
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 6,
            fontSize: '0.9rem',
            padding: '1.5rem'
          }}
        >
          {jsonString}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default ImprovedPolicyCard


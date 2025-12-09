import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './PolicyViewer.css'

function PolicyViewer({ data, fileName }) {
  const jsonString = typeof data === 'string' 
    ? data 
    : JSON.stringify(data, null, 2)

  return (
    <div className="policy-viewer">
      <div className="viewer-header">
        <h2>📄 원본 정책</h2>
        <span className="file-name">{fileName}</span>
      </div>
      <div className="viewer-content">
        <SyntaxHighlighter
          language="json"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 0,
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

export default PolicyViewer


import { useState } from 'react'
import { parseFile, parseText } from '../utils/fileParser'
import './FileUploader.css'

function FileUploader({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState('file') // 'file' or 'text'
  const [textInput, setTextInput] = useState('')
  const [textFormat, setTextFormat] = useState('auto') // 'auto', 'json', 'yaml'

  const handleFile = async (file) => {
    if (!file) return

    try {
      const data = await parseFile(file)
      onUpload(data, file.name)
    } catch (error) {
      alert(`파일 파싱 오류: ${error.message}`)
    }
  }

  const handleTextSubmit = () => {
    if (!textInput.trim()) {
      alert('텍스트를 입력해주세요.')
      return
    }

    try {
      const data = parseText(textInput, textFormat)
      const fileName = textFormat === 'json' ? 'pasted-config.json' : 'pasted-config.yaml'
      onUpload(data, fileName)
      // 성공 후 텍스트 영역 초기화 (선택사항)
      // setTextInput('')
    } catch (error) {
      alert(`텍스트 파싱 오류: ${error.message}`)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handlePaste = (e) => {
    // Ctrl+V 또는 Cmd+V로 붙여넣기 시 자동으로 텍스트 탭으로 전환
    if (activeTab === 'file' && (e.ctrlKey || e.metaKey) && e.key === 'v') {
      setTimeout(() => {
        setActiveTab('text')
      }, 100)
    }
  }

  return (
    <div className="file-uploader" onKeyDown={handlePaste}>
      {/* 탭 전환 */}
      <div className="upload-tabs">
        <button
          className={`tab-button ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          📁 파일 업로드
        </button>
        <button
          className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📝 텍스트 붙여넣기
        </button>
      </div>

      {/* 파일 업로드 탭 */}
      {activeTab === 'file' && (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h3>설정 파일 업로드</h3>
            <p>JSON 또는 YAML 파일을 드래그하거나 클릭하여 선택하세요</p>
            <p className="upload-hint">
              지원 형식: AWS (S3, IAM), GCP (Service Account), Azure (NSG)
            </p>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-button">
              파일 선택
            </label>
          </div>
        </div>
      )}

      {/* 텍스트 붙여넣기 탭 */}
      {activeTab === 'text' && (
        <div className="text-input-area">
          <div className="text-input-header">
            <h3>📝 설정 텍스트 붙여넣기</h3>
            <div className="format-selector">
              <label htmlFor="format-select">형식:</label>
              <select
                id="format-select"
                value={textFormat}
                onChange={(e) => setTextFormat(e.target.value)}
                className="format-select"
              >
                <option value="auto">자동 감지</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </div>
          </div>
          <textarea
            className="text-input"
            placeholder="JSON 또는 YAML 설정을 여기에 붙여넣으세요...&#10;&#10;예시 JSON:&#10;{&#10;  &quot;Version&quot;: &quot;2012-10-17&quot;,&#10;  &quot;Statement&quot;: [...]&#10;}&#10;&#10;예시 YAML:&#10;bindings:&#10;  - members:&#10;      - allUsers&#10;    role: roles/storage.objectViewer"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={12}
          />
          <div className="text-input-footer">
            <p className="text-hint">
              💡 팁: JSON은 {"{ }"} 또는 [ ]로 시작하고, YAML은 들여쓰기 형식입니다.
            </p>
            <button
              className="submit-button"
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              분석 시작
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader

import { useState } from "react"
import logo from "data-base64:./assets/icon.png"
const GITHUB_RELEASES = "https://github.com/Teofanis/ybdownloader/releases"
const GITHUB_REPO = "https://github.com/Teofanis/ybdownloader"

function Popup() {
  const [urlInput, setUrlInput] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!urlInput.trim()) return

    // Validate YouTube URL
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/.+/
    if (!ytRegex.test(urlInput)) {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
      return
    }

    const encodedUrl = encodeURIComponent(urlInput)
    window.location.href = `ybdownloader://add?url=${encodedUrl}&format=mp3`
    setStatus("success")
    setUrlInput("")
    setTimeout(() => setStatus("idle"), 2000)
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <img src={logo} alt="YBDownloader" style={{ width: 32, height: 32, borderRadius: 6 }} />
        <div>
          <h1 style={titleStyle}>YBDownloader</h1>
          <p style={subtitleStyle}>YouTube Download Helper</p>
        </div>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube URL..."
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Add to Queue
        </button>
      </form>

      {/* Status */}
      {status === "success" && (
        <div style={{ ...statusStyle, background: "#22c55e20", color: "#22c55e" }}>
          ✓ Added to download queue
        </div>
      )}
      {status === "error" && (
        <div style={{ ...statusStyle, background: "#ef444420", color: "#ef4444" }}>
          ✗ Invalid YouTube URL
        </div>
      )}

      {/* Info */}
      <div style={infoStyle}>
        <p>
          Visit any YouTube video and click the <strong>Download</strong> button to add it to your
          queue.
        </p>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          GitHub
        </a>
        <span style={{ color: "#666" }}>•</span>
        <a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Download App
        </a>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  width: 320,
  padding: 16,
  fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
  background: "#1a1a1a",
  color: "#fff"
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: "1px solid #333"
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "#888"
}

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#2a2a2a",
  color: "#fff",
  fontSize: 14,
  outline: "none"
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#ff0000",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer"
}

const statusStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 13,
  textAlign: "center"
}

const infoStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  background: "#2a2a2a",
  borderRadius: 8,
  fontSize: 13,
  color: "#aaa",
  lineHeight: 1.5
}

const footerStyle: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 12,
  borderTop: "1px solid #333",
  display: "flex",
  justifyContent: "center",
  gap: 12,
  fontSize: 12
}

const linkStyle: React.CSSProperties = {
  color: "#888",
  textDecoration: "none"
}

export default Popup

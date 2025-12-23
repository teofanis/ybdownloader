import { useState } from "react"
import logo from "data-base64:./assets/icon.png"

const GITHUB_REPO = "https://github.com/teofanis/ybdownloader"
const GITHUB_RELEASES = "https://github.com/teofanis/ybdownloader/releases"
const SPONSOR_URL = "https://buymeacoffee.com/teofanis"

function Popup() {
  const [urlInput, setUrlInput] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

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
        <div style={{ flex: 1 }}>
          <h1 style={titleStyle}>YBDownloader</h1>
          <p style={subtitleStyle}>YouTube Download Helper</p>
        </div>
        <a
          href={GITHUB_RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          style={downloadBadgeStyle}
          title="Download App"
        >
          ⬇ Get App
        </a>
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
        <p style={{ margin: 0 }}>
          Visit any YouTube video and click the <strong style={{ color: "#fff" }}>Download</strong>{" "}
          button to add it to your queue.
        </p>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          style={iconLinkStyle}
          title="Star on GitHub"
        >
          <GitHubIcon /> Star
        </a>
        <a
          href={SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={iconLinkStyle}
          title="Sponsor"
        >
          <HeartIcon /> Sponsor
        </a>
      </div>
    </div>
  )
}

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const containerStyle: React.CSSProperties = {
  width: 320,
  padding: 16,
  fontFamily: "'Segoe UI', Roboto, sans-serif",
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

const downloadBadgeStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#ff0000",
  color: "#fff",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap"
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
  color: "#888",
  lineHeight: 1.5
}

const footerStyle: React.CSSProperties = {
  marginTop: 16,
  paddingTop: 12,
  borderTop: "1px solid #333",
  display: "flex",
  justifyContent: "center",
  gap: 16,
  fontSize: 12
}

const iconLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "#666",
  textDecoration: "none",
  transition: "color 0.15s"
}

export default Popup

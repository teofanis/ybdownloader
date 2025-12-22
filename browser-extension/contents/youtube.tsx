import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import { useState, useRef, useEffect, type FC } from "react"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.youtube.com/watch*",
    "https://youtube.com/watch*",
    "https://music.youtube.com/watch*"
  ]
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  for (let i = 0; i < 30; i++) {
    const anchor = document.querySelector("#top-level-buttons-computed")
    if (anchor) return anchor as Element
    await new Promise((r) => setTimeout(r, 200))
  }
  const anchor = document.querySelector("#top-level-buttons-computed")
  if (!anchor) throw new Error("Anchor not found")
  return anchor as Element
}

const GITHUB_RELEASES = "https://github.com/teofanis/ybdownloader/releases"

type Format = "mp3" | "mp4" | "webm"
type Status = "idle" | "loading" | "success" | "error"

// Icon components defined before use
const DownloadIcon: FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
)

const ChevronIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 10l5 5 5-5z" />
  </svg>
)

const SpinnerIcon: FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ animation: "ybd-spin 1s linear infinite" }}
  >
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
)

const CheckIcon: FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
)

const ErrorIcon: FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

// Main component
const PlasmoInline: FC = () => {
  const [status, setStatus] = useState<Status>("idle")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click (use bubbling phase, not capture)
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside our container
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    // Use timeout to avoid catching the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen])

  const handleDownload = (format: Format) => {
    const videoUrl = encodeURIComponent(window.location.href)
    const deepLink = `ybdownloader://add?url=${videoUrl}&format=${format}`

    console.log("deepLink", deepLink)
    setStatus("loading")
    setIsOpen(false)

    let appOpened = false

    const onBlur = () => {
      appOpened = true
      setStatus("success")
      setTimeout(() => setStatus("idle"), 2000)
    }

    window.addEventListener("blur", onBlur, { once: true })
    window.location.href = deepLink

    setTimeout(() => {
      window.removeEventListener("blur", onBlur)
      if (!appOpened) {
        setStatus("error")
        const shouldDownload = window.confirm("YBDownloader not found.\n\nDownload from GitHub?")
        if (shouldDownload) {
          window.open(GITHUB_RELEASES, "_blank")
        }
        setTimeout(() => setStatus("idle"), 2000)
      }
    }, 2000)
  }

  const getButtonLabel = () => {
    switch (status) {
      case "loading":
        return "Adding..."
      case "success":
        return "Added!"
      case "error":
        return "Error"
      default:
        return "Download"
    }
  }

  const getButtonBg = () => {
    switch (status) {
      case "loading":
        return "#666"
      case "success":
        return "#22c55e"
      case "error":
        return "#ef4444"
      default:
        return "#ff0000"
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        marginLeft: "8px",
        fontFamily: "Roboto, Arial, sans-serif"
      }}
    >
      <style>{`
        @keyframes ybd-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <button
        onClick={() => status === "idle" && setIsOpen(!isOpen)}
        disabled={status === "loading"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: "36px",
          padding: "0 16px",
          border: "none",
          borderRadius: "18px",
          background: getButtonBg(),
          color: "#fff",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "inherit",
          cursor: status === "loading" ? "wait" : "pointer"
        }}
      >
        {status === "idle" && <DownloadIcon />}
        {status === "loading" && <SpinnerIcon />}
        {status === "success" && <CheckIcon />}
        {status === "error" && <ErrorIcon />}
        <span>{getButtonLabel()}</span>
        {status === "idle" && <ChevronIcon />}
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "8px",
            background: "#282828",
            borderRadius: "12px",
            padding: "8px 0",
            minWidth: "160px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            zIndex: 2147483647
          }}
        >
          <DropdownItem onClick={() => handleDownload("mp3")}>🎵 MP3 (Audio)</DropdownItem>
          <DropdownItem onClick={() => handleDownload("mp4")}>🎬 MP4 (Video)</DropdownItem>
          <DropdownItem onClick={() => handleDownload("webm")}>📦 WebM (Original)</DropdownItem>
        </div>
      )}
    </div>
  )
}

const DropdownItem: FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children
}) => {
  const [hover, setHover] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "10px 16px",
        border: "none",
        background: hover ? "#404040" : "transparent",
        color: "#fff",
        fontSize: "14px",
        fontFamily: "inherit",
        cursor: "pointer",
        textAlign: "left"
      }}
    >
      {children}
    </button>
  )
}

export default PlasmoInline

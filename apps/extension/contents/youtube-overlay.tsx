/**
 * YBDownloader - YouTube Overlay
 * Plasmo Content Script UI entry point
 */
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import styleText from "data-text:./youtube-overlay.module.css"
import { FloatingButton } from "./components"

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://youtube.com/*", "https://music.youtube.com/*"],
  run_at: "document_end"
}

export const getShadowHostId = () => "ybd-overlay-host"

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

export default FloatingButton

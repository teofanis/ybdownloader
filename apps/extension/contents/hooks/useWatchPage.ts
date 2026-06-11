import { useState, useEffect } from "react"
import { isWatchPage } from "../lib/deep-link"

export function useWatchPage() {
  const [isVisible, setIsVisible] = useState(isWatchPage)

  useEffect(() => {
    const check = () => setIsVisible(isWatchPage())
    const onNav = () => setTimeout(check, 150)

    window.addEventListener("yt-navigate-finish", onNav)
    window.addEventListener("popstate", onNav)
    const interval = setInterval(check, 2000)

    return () => {
      window.removeEventListener("yt-navigate-finish", onNav)
      window.removeEventListener("popstate", onNav)
      clearInterval(interval)
    }
  }, [])

  return isVisible
}

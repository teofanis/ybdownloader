import type { FC } from "react"
import type { Status } from "../types"

interface IconProps {
  className?: string
}

export const DownloadIcon: FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
)

export const SpinnerIcon: FC<IconProps> = ({ className }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={className}
  >
    <circle cx="12" cy="12" r="10" opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
)

export const CheckIcon: FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
)

export const ErrorIcon: FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

export const StatusIcon: FC<{ status: Status; className?: string }> = ({ status, className }) => {
  switch (status) {
    case "loading":
      return <SpinnerIcon className={className} />
    case "success":
      return <CheckIcon className={className} />
    case "error":
      return <ErrorIcon className={className} />
    default:
      return <DownloadIcon className={className} />
  }
}

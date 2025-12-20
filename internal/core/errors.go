package core

import (
	"errors"
	"fmt"
)

// Domain errors that can be translated to user-friendly messages.
var (
	ErrInvalidURL          = errors.New("invalid YouTube URL")
	ErrVideoNotFound       = errors.New("video not found")
	ErrVideoUnavailable    = errors.New("video is unavailable")
	ErrDownloadFailed      = errors.New("download failed")
	ErrConversionFailed    = errors.New("conversion failed")
	ErrFFmpegNotFound      = errors.New("ffmpeg not found")
	ErrQueueItemNotFound   = errors.New("queue item not found")
	ErrInvalidFormat       = errors.New("invalid format")
	ErrSavePathNotWritable = errors.New("save path is not writable")
	ErrCancelled           = errors.New("operation cancelled")
)

// AppError wraps an error with additional context for user-facing messages.
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError creates a new application error.
func NewAppError(code, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// Error codes for frontend consumption.
const (
	ErrCodeInvalidURL       = "INVALID_URL"
	ErrCodeVideoNotFound    = "VIDEO_NOT_FOUND"
	ErrCodeDownloadFailed   = "DOWNLOAD_FAILED"
	ErrCodeConversionFailed = "CONVERSION_FAILED"
	ErrCodeFFmpegMissing    = "FFMPEG_MISSING"
	ErrCodeQueueError       = "QUEUE_ERROR"
	ErrCodeSettingsError    = "SETTINGS_ERROR"
	ErrCodeFilesystemError  = "FILESYSTEM_ERROR"
)

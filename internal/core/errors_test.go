package core

import (
	"errors"
	"testing"
)

func TestAppError_Error(t *testing.T) {
	tests := []struct {
		name string
		err  *AppError
		want string
	}{
		{
			name: "without wrapped error",
			err: &AppError{
				Code:    ErrCodeInvalidURL,
				Message: "Invalid URL",
			},
			want: "Invalid URL",
		},
		{
			name: "with wrapped error",
			err: &AppError{
				Code:    ErrCodeDownloadFailed,
				Message: "Download failed",
				Err:     errors.New("network error"),
			},
			want: "Download failed: network error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.want {
				t.Errorf("Error() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAppError_Unwrap(t *testing.T) {
	originalErr := errors.New("original error")
	appErr := &AppError{
		Code:    ErrCodeDownloadFailed,
		Message: "Download failed",
		Err:     originalErr,
	}

	unwrapped := appErr.Unwrap()
	if unwrapped != originalErr {
		t.Errorf("Unwrap() = %v, want %v", unwrapped, originalErr)
	}
}

func TestNewAppError(t *testing.T) {
	err := NewAppError(ErrCodeInvalidURL, "test message", nil)

	if err.Code != ErrCodeInvalidURL {
		t.Errorf("Code = %v, want %v", err.Code, ErrCodeInvalidURL)
	}
	if err.Message != "test message" {
		t.Errorf("Message = %v, want test message", err.Message)
	}
	if err.Err != nil {
		t.Error("Err should be nil")
	}
}

func TestPredefinedErrors(t *testing.T) {
	// Test that predefined errors are properly defined
	predefined := []error{
		ErrInvalidURL,
		ErrVideoNotFound,
		ErrVideoUnavailable,
		ErrDownloadFailed,
		ErrConversionFailed,
		ErrFFmpegNotFound,
		ErrQueueItemNotFound,
		ErrInvalidFormat,
		ErrSavePathNotWritable,
		ErrCancelled,
	}

	for _, err := range predefined {
		if err == nil {
			t.Error("Predefined error should not be nil")
		}
		if err.Error() == "" {
			t.Error("Predefined error should have a message")
		}
	}
}

func TestErrorCodes(t *testing.T) {
	codes := []string{
		ErrCodeInvalidURL,
		ErrCodeVideoNotFound,
		ErrCodeDownloadFailed,
		ErrCodeConversionFailed,
		ErrCodeFFmpegMissing,
		ErrCodeQueueError,
		ErrCodeSettingsError,
		ErrCodeFilesystemError,
	}

	for _, code := range codes {
		if code == "" {
			t.Error("Error code should not be empty")
		}
	}
}

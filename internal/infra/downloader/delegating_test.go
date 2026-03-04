package downloader

import (
	"context"
	"errors"
	"testing"

	"ybdownloader/internal/core"
)

func TestDelegatingDownloader_active(t *testing.T) {
	builtin := &Downloader{}
	ytdlp := &YtDlpDownloader{}

	tests := []struct {
		name        string
		builtin     *Downloader
		ytdlp       *YtDlpDownloader
		getSettings func() (*core.Settings, error)
		wantBuiltin bool
		wantYtdlp   bool
		wantNil     bool
	}{
		{
			name:    "settings say yt-dlp and ytdlp is non-nil",
			builtin: builtin,
			ytdlp:   ytdlp,
			getSettings: func() (*core.Settings, error) {
				return &core.Settings{DownloadBackend: core.BackendYtDlp}, nil
			},
			wantYtdlp: true,
		},
		{
			name:    "settings say yt-dlp but ytdlp is nil",
			builtin: builtin,
			ytdlp:   nil,
			getSettings: func() (*core.Settings, error) {
				return &core.Settings{DownloadBackend: core.BackendYtDlp}, nil
			},
			wantBuiltin: true,
		},
		{
			name:    "settings say builtin",
			builtin: builtin,
			ytdlp:   ytdlp,
			getSettings: func() (*core.Settings, error) {
				return &core.Settings{DownloadBackend: core.BackendBuiltin}, nil
			},
			wantBuiltin: true,
		},
		{
			name:    "settings error falls back to builtin",
			builtin: builtin,
			ytdlp:   ytdlp,
			getSettings: func() (*core.Settings, error) {
				return nil, errors.New("load failed")
			},
			wantBuiltin: true,
		},
		{
			name:    "both backends nil",
			builtin: nil,
			ytdlp:   nil,
			getSettings: func() (*core.Settings, error) {
				return &core.Settings{DownloadBackend: core.BackendBuiltin}, nil
			},
			wantNil: true,
		},
		{
			name:    "only ytdlp available settings say builtin falls back to ytdlp",
			builtin: nil,
			ytdlp:   ytdlp,
			getSettings: func() (*core.Settings, error) {
				return &core.Settings{DownloadBackend: core.BackendBuiltin}, nil
			},
			wantYtdlp: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := &DelegatingDownloader{
				builtin:     tt.builtin,
				ytdlp:       tt.ytdlp,
				getSettings: tt.getSettings,
			}
			got := d.active()

			if tt.wantNil {
				if got != nil {
					t.Errorf("active() = %v, want nil", got)
				}
				return
			}
			if got == nil {
				t.Fatal("active() = nil, want non-nil")
			}
			if tt.wantBuiltin {
				if b, ok := got.(*Downloader); !ok || b != tt.builtin {
					t.Errorf("active() = %v, want builtin", got)
				}
			}
			if tt.wantYtdlp {
				if y, ok := got.(*YtDlpDownloader); !ok || y != tt.ytdlp {
					t.Errorf("active() = %v, want ytdlp", got)
				}
			}
		})
	}
}

func TestDelegatingDownloader_FetchMetadata_nilBackend(t *testing.T) {
	d := NewDelegatingDownloader(nil, nil, func() (*core.Settings, error) {
		return &core.Settings{DownloadBackend: core.BackendBuiltin}, nil
	})

	_, err := d.FetchMetadata(context.Background(), "https://example.com")
	if err == nil {
		t.Fatal("FetchMetadata() expected error, got nil")
	}

	var appErr *core.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("FetchMetadata() error = %v, want *core.AppError", err)
	}
	if appErr.Code != core.ErrCodeDownloadFailed {
		t.Errorf("AppError.Code = %q, want %q", appErr.Code, core.ErrCodeDownloadFailed)
	}
}

func TestDelegatingDownloader_Download_nilBackend(t *testing.T) {
	d := NewDelegatingDownloader(nil, nil, func() (*core.Settings, error) {
		return &core.Settings{DownloadBackend: core.BackendBuiltin}, nil
	})

	item := core.NewQueueItem("id", "https://example.com", core.FormatMP3, "/tmp")
	err := d.Download(context.Background(), item, nil)
	if err == nil {
		t.Fatal("Download() expected error, got nil")
	}

	var appErr *core.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("Download() error = %v, want *core.AppError", err)
	}
	if appErr.Code != core.ErrCodeDownloadFailed {
		t.Errorf("AppError.Code = %q, want %q", appErr.Code, core.ErrCodeDownloadFailed)
	}
}

func TestDelegatingDownloader_settingsError_bothNil_returnsNil(t *testing.T) {
	d := NewDelegatingDownloader(nil, nil, func() (*core.Settings, error) {
		return nil, errors.New("settings error")
	})

	_, err := d.FetchMetadata(context.Background(), "https://example.com")
	if err == nil {
		t.Fatal("FetchMetadata() expected error, got nil")
	}
}

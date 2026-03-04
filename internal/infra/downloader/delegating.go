package downloader

import (
	"context"
	"fmt"
	"log/slog"

	"ybdownloader/internal/core"
)

// DelegatingDownloader implements core.Downloader by routing to the active
// backend based on the current settings. This allows switching backends
// without recreating the queue manager.
type DelegatingDownloader struct {
	builtin     *Downloader
	ytdlp       *YtDlpDownloader
	getSettings func() (*core.Settings, error)
}

// NewDelegatingDownloader creates a downloader that delegates to the backend
// selected in settings.
func NewDelegatingDownloader(
	builtin *Downloader,
	ytdlp *YtDlpDownloader,
	getSettings func() (*core.Settings, error),
) *DelegatingDownloader {
	return &DelegatingDownloader{
		builtin:     builtin,
		ytdlp:       ytdlp,
		getSettings: getSettings,
	}
}

func (d *DelegatingDownloader) active() core.Downloader {
	settings, err := d.getSettings()
	if err != nil {
		slog.Warn("failed to load settings for backend selection, falling back to builtin", "error", err)
		if d.builtin != nil {
			return d.builtin
		}
		if d.ytdlp != nil {
			return d.ytdlp
		}
		return nil
	}

	if settings.DownloadBackend == core.BackendYtDlp && d.ytdlp != nil {
		return d.ytdlp
	}

	if d.builtin != nil {
		return d.builtin
	}

	if d.ytdlp != nil {
		return d.ytdlp
	}

	return nil
}

func (d *DelegatingDownloader) FetchMetadata(ctx context.Context, url string) (*core.VideoMetadata, error) {
	backend := d.active()
	if backend == nil {
		return nil, core.NewAppError(core.ErrCodeDownloadFailed, "No download backend available", nil)
	}
	slog.Debug("delegating FetchMetadata", "backend", fmt.Sprintf("%T", backend))
	return backend.FetchMetadata(ctx, url)
}

func (d *DelegatingDownloader) Download(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
	backend := d.active()
	if backend == nil {
		return core.NewAppError(core.ErrCodeDownloadFailed, "No download backend available", nil)
	}
	slog.Info("delegating Download", "backend", fmt.Sprintf("%T", backend), "itemId", item.ID)
	return backend.Download(ctx, item, onProgress)
}

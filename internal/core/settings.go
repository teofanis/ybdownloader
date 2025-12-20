package core

// Settings represents user-configurable application settings.
type Settings struct {
	Version                int          `json:"version"`
	DefaultSavePath        string       `json:"defaultSavePath"`
	DefaultFormat          Format       `json:"defaultFormat"`
	DefaultAudioQuality    AudioQuality `json:"defaultAudioQuality"`
	DefaultVideoQuality    VideoQuality `json:"defaultVideoQuality"`
	MaxConcurrentDownloads int          `json:"maxConcurrentDownloads"`
	FFmpegPath             string       `json:"ffmpegPath,omitempty"` // empty = auto-detect
}

// SettingsVersion is the current settings schema version.
const SettingsVersion = 1

// DefaultSettings returns settings with sensible defaults.
func DefaultSettings(musicDir string) *Settings {
	return &Settings{
		Version:                SettingsVersion,
		DefaultSavePath:        musicDir,
		DefaultFormat:          FormatMP3,
		DefaultAudioQuality:    AudioQuality192,
		DefaultVideoQuality:    VideoQuality720p,
		MaxConcurrentDownloads: 2,
		FFmpegPath:             "",
	}
}

// Validate checks settings for validity and returns an error if invalid.
func (s *Settings) Validate() error {
	if s.MaxConcurrentDownloads < 1 {
		s.MaxConcurrentDownloads = 1
	}
	if s.MaxConcurrentDownloads > 5 {
		s.MaxConcurrentDownloads = 5
	}
	return nil
}

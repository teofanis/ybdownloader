package core

const SettingsVersion = 1

type Settings struct {
	Version                int          `json:"version"`
	DefaultSavePath        string       `json:"defaultSavePath"`
	DefaultFormat          Format       `json:"defaultFormat"`
	DefaultAudioQuality    AudioQuality `json:"defaultAudioQuality"`
	DefaultVideoQuality    VideoQuality `json:"defaultVideoQuality"`
	MaxConcurrentDownloads int          `json:"maxConcurrentDownloads"`
	FFmpegPath             string       `json:"ffmpegPath,omitempty"`
}

func DefaultSettings(musicDir string) *Settings {
	return &Settings{
		Version:                SettingsVersion,
		DefaultSavePath:        musicDir,
		DefaultFormat:          FormatMP3,
		DefaultAudioQuality:    AudioQuality192,
		DefaultVideoQuality:    VideoQuality720p,
		MaxConcurrentDownloads: 2,
	}
}

func (s *Settings) Validate() error {
	if s.MaxConcurrentDownloads < 1 {
		s.MaxConcurrentDownloads = 1
	}
	if s.MaxConcurrentDownloads > 5 {
		s.MaxConcurrentDownloads = 5
	}
	return nil
}

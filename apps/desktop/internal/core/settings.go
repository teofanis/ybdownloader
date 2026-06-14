package core

const SettingsVersion = 3

type UpdateChannel string

const (
	UpdateChannelStable UpdateChannel = "stable"
	UpdateChannelBeta   UpdateChannel = "beta"
)

type Settings struct {
	Version                int             `json:"version"`
	DefaultSavePath        string          `json:"defaultSavePath"`
	DefaultFormat          Format          `json:"defaultFormat"`
	DefaultAudioQuality    AudioQuality    `json:"defaultAudioQuality"`
	DefaultVideoQuality    VideoQuality    `json:"defaultVideoQuality"`
	MaxConcurrentDownloads int             `json:"maxConcurrentDownloads"`
	FFmpegPath             string          `json:"ffmpegPath,omitempty"`
	FFprobePath            string          `json:"ffprobePath,omitempty"`
	DownloadBackend        DownloadBackend `json:"downloadBackend"`
	YtDlpPath              string          `json:"ytDlpPath,omitempty"`
	YtDlpExtraFlags        []string        `json:"ytDlpExtraFlags,omitempty"`
	Language               string          `json:"language,omitempty"`
	ThemeMode              string          `json:"themeMode,omitempty"`
	AccentColor            string          `json:"accentColor,omitempty"`
	LogLevel               string          `json:"logLevel,omitempty"`
	UpdateChannel          UpdateChannel   `json:"updateChannel,omitempty"`
}

func DefaultSettings(musicDir string) *Settings {
	return &Settings{
		Version:                SettingsVersion,
		DefaultSavePath:        musicDir,
		DefaultFormat:          FormatMP3,
		DefaultAudioQuality:    AudioQuality192,
		DefaultVideoQuality:    VideoQuality720p,
		MaxConcurrentDownloads: 2,
		DownloadBackend:        BackendYtDlp,
		Language:               "en",
		ThemeMode:              "system",
		AccentColor:            "purple",
		LogLevel:               "info",
		UpdateChannel:          UpdateChannelStable,
	}
}

func (s *Settings) Validate() error {
	if s.MaxConcurrentDownloads < 1 {
		s.MaxConcurrentDownloads = 1
	}
	if s.MaxConcurrentDownloads > 5 {
		s.MaxConcurrentDownloads = 5
	}
	switch s.DownloadBackend {
	case BackendBuiltin, BackendYtDlp:
	default:
		s.DownloadBackend = BackendYtDlp
	}
	switch s.UpdateChannel {
	case UpdateChannelStable, UpdateChannelBeta:
	default:
		s.UpdateChannel = UpdateChannelStable
	}
	return nil
}

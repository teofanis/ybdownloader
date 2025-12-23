package core

import "testing"

func TestDefaultSettings(t *testing.T) {
	s := DefaultSettings("/music")

	if s.Version != SettingsVersion {
		t.Errorf("Version = %d, want %d", s.Version, SettingsVersion)
	}
	if s.DefaultSavePath != "/music" {
		t.Errorf("DefaultSavePath = %q, want %q", s.DefaultSavePath, "/music")
	}
	if s.DefaultFormat != FormatMP3 {
		t.Errorf("DefaultFormat = %v, want %v", s.DefaultFormat, FormatMP3)
	}
	if s.DefaultAudioQuality != AudioQuality192 {
		t.Errorf("DefaultAudioQuality = %v, want %v", s.DefaultAudioQuality, AudioQuality192)
	}
	if s.DefaultVideoQuality != VideoQuality720p {
		t.Errorf("DefaultVideoQuality = %v, want %v", s.DefaultVideoQuality, VideoQuality720p)
	}
	if s.MaxConcurrentDownloads != 2 {
		t.Errorf("MaxConcurrentDownloads = %d, want %d", s.MaxConcurrentDownloads, 2)
	}
	if s.Language != "en" {
		t.Errorf("Language = %q, want %q", s.Language, "en")
	}
	if s.ThemeMode != "system" {
		t.Errorf("ThemeMode = %q, want %q", s.ThemeMode, "system")
	}
	if s.AccentColor != "purple" {
		t.Errorf("AccentColor = %q, want %q", s.AccentColor, "purple")
	}
	if s.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", s.LogLevel, "info")
	}
}

func TestSettings_Validate(t *testing.T) {
	tests := []struct {
		name           string
		input          int
		expectedOutput int
	}{
		{"zero", 0, 1},
		{"negative", -5, 1},
		{"one", 1, 1},
		{"three", 3, 3},
		{"five", 5, 5},
		{"six", 6, 5},
		{"hundred", 100, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &Settings{MaxConcurrentDownloads: tt.input}
			err := s.Validate()
			if err != nil {
				t.Errorf("Validate() error = %v", err)
			}
			if s.MaxConcurrentDownloads != tt.expectedOutput {
				t.Errorf("MaxConcurrentDownloads = %d, want %d", s.MaxConcurrentDownloads, tt.expectedOutput)
			}
		})
	}
}

func TestSettings_AllFields(t *testing.T) {
	s := Settings{
		Version:                1,
		DefaultSavePath:        "/custom/path",
		DefaultFormat:          FormatMP4,
		DefaultAudioQuality:    AudioQuality320,
		DefaultVideoQuality:    VideoQuality1080p,
		MaxConcurrentDownloads: 4,
		FFmpegPath:             "/usr/bin/ffmpeg",
		FFprobePath:            "/usr/bin/ffprobe",
		Language:               "de",
		ThemeMode:              "dark",
		AccentColor:            "blue",
		LogLevel:               "debug",
	}

	if s.FFmpegPath != "/usr/bin/ffmpeg" {
		t.Errorf("FFmpegPath = %q, want %q", s.FFmpegPath, "/usr/bin/ffmpeg")
	}
	if s.FFprobePath != "/usr/bin/ffprobe" {
		t.Errorf("FFprobePath = %q, want %q", s.FFprobePath, "/usr/bin/ffprobe")
	}
	if s.ThemeMode != "dark" {
		t.Errorf("ThemeMode = %q, want %q", s.ThemeMode, "dark")
	}
}

func TestSettingsVersion_Constant(t *testing.T) {
	if SettingsVersion < 1 {
		t.Errorf("SettingsVersion = %d, should be at least 1", SettingsVersion)
	}
}

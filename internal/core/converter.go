package core

// ConversionPreset represents a predefined conversion configuration.
type ConversionPreset struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"` // audio, video, gif, etc.
	OutputExt   string                 `json:"outputExt"`
	FFmpegArgs  []string               `json:"ffmpegArgs,omitempty"`
	Options     map[string]interface{} `json:"options,omitempty"`
}

// TrimOptions specifies the start and end time for trimming media.
type TrimOptions struct {
	StartTime float64 `json:"startTime"` // Start time in seconds
	EndTime   float64 `json:"endTime"`   // End time in seconds (0 = end of file)
}

// ConversionJob represents a single file conversion job.
type ConversionJob struct {
	ID          string          `json:"id"`
	InputPath   string          `json:"inputPath"`
	OutputPath  string          `json:"outputPath"`
	PresetID    string          `json:"presetId,omitempty"`
	CustomArgs  []string        `json:"customArgs,omitempty"`
	TrimOptions *TrimOptions    `json:"trimOptions,omitempty"`
	State       ConversionState `json:"state"`
	Progress    float64         `json:"progress"`
	Duration    float64         `json:"duration,omitempty"` // Total duration in seconds
	CurrentTime float64         `json:"currentTime,omitempty"`
	Error       string          `json:"error,omitempty"`
	InputInfo   *MediaInfo      `json:"inputInfo,omitempty"`
}

// ConversionState represents the state of a conversion job.
type ConversionState string

const (
	ConversionQueued     ConversionState = "queued"
	ConversionAnalyzing  ConversionState = "analyzing"
	ConversionConverting ConversionState = "converting"
	ConversionCompleted  ConversionState = "completed"
	ConversionFailed     ConversionState = "failed"
	ConversionCancelled  ConversionState = "cancelled"
)

// MediaInfo contains information about a media file.
type MediaInfo struct {
	Duration    float64      `json:"duration"`
	Format      string       `json:"format"`
	Size        int64        `json:"size"`
	Bitrate     int64        `json:"bitrate"`
	VideoStream *VideoStream `json:"videoStream,omitempty"`
	AudioStream *AudioStream `json:"audioStream,omitempty"`
}

// VideoStream contains video stream information.
type VideoStream struct {
	Codec   string  `json:"codec"`
	Width   int     `json:"width"`
	Height  int     `json:"height"`
	FPS     float64 `json:"fps"`
	Bitrate int64   `json:"bitrate"`
}

// AudioStream contains audio stream information.
type AudioStream struct {
	Codec      string `json:"codec"`
	Channels   int    `json:"channels"`
	SampleRate int    `json:"sampleRate"`
	Bitrate    int64  `json:"bitrate"`
}

// ConversionProgress represents progress update for a conversion.
type ConversionProgress struct {
	JobID       string          `json:"jobId"`
	State       ConversionState `json:"state"`
	Progress    float64         `json:"progress"`
	CurrentTime float64         `json:"currentTime"`
	Speed       float64         `json:"speed"` // Processing speed (e.g., 2.5x)
	Error       string          `json:"error,omitempty"`
}

// GetDefaultPresets returns the built-in conversion presets.
func GetDefaultPresets() []ConversionPreset {
	return []ConversionPreset{
		// Audio Presets
		{
			ID:          "audio-mp3-320",
			Name:        "MP3 High Quality",
			Description: "Convert to MP3 at 320kbps",
			Category:    "audio",
			OutputExt:   "mp3",
			FFmpegArgs:  []string{"-vn", "-codec:a", "libmp3lame", "-b:a", "320k", "-q:a", "0"},
		},
		{
			ID:          "audio-mp3-192",
			Name:        "MP3 Standard",
			Description: "Convert to MP3 at 192kbps",
			Category:    "audio",
			OutputExt:   "mp3",
			FFmpegArgs:  []string{"-vn", "-codec:a", "libmp3lame", "-b:a", "192k"},
		},
		{
			ID:          "audio-mp3-128",
			Name:        "MP3 Compact",
			Description: "Convert to MP3 at 128kbps (smaller file)",
			Category:    "audio",
			OutputExt:   "mp3",
			FFmpegArgs:  []string{"-vn", "-codec:a", "libmp3lame", "-b:a", "128k"},
		},
		{
			ID:          "audio-aac-256",
			Name:        "AAC High Quality",
			Description: "Convert to AAC at 256kbps",
			Category:    "audio",
			OutputExt:   "m4a",
			FFmpegArgs:  []string{"-vn", "-codec:a", "aac", "-b:a", "256k"},
		},
		{
			ID:          "audio-flac",
			Name:        "FLAC Lossless",
			Description: "Convert to lossless FLAC format",
			Category:    "audio",
			OutputExt:   "flac",
			FFmpegArgs:  []string{"-vn", "-codec:a", "flac"},
		},
		{
			ID:          "audio-wav",
			Name:        "WAV Uncompressed",
			Description: "Convert to uncompressed WAV format",
			Category:    "audio",
			OutputExt:   "wav",
			FFmpegArgs:  []string{"-vn", "-codec:a", "pcm_s16le"},
		},
		{
			ID:          "audio-ogg",
			Name:        "OGG Vorbis",
			Description: "Convert to OGG Vorbis at quality 6",
			Category:    "audio",
			OutputExt:   "ogg",
			FFmpegArgs:  []string{"-vn", "-codec:a", "libvorbis", "-q:a", "6"},
		},
		// Video Presets
		{
			ID:          "video-mp4-h264",
			Name:        "MP4 Compatible",
			Description: "H.264 video, widely compatible",
			Category:    "video",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-codec:v", "libx264", "-preset", "medium", "-crf", "23", "-codec:a", "aac", "-b:a", "128k"},
		},
		{
			ID:          "video-mp4-h264-hq",
			Name:        "MP4 High Quality",
			Description: "H.264 video, high quality",
			Category:    "video",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-codec:v", "libx264", "-preset", "slow", "-crf", "18", "-codec:a", "aac", "-b:a", "192k"},
		},
		{
			ID:          "video-mp4-h265",
			Name:        "MP4 HEVC",
			Description: "H.265/HEVC video, smaller file size",
			Category:    "video",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-codec:v", "libx265", "-preset", "medium", "-crf", "28", "-codec:a", "aac", "-b:a", "128k"},
		},
		{
			ID:          "video-webm",
			Name:        "WebM VP9",
			Description: "VP9 video for web",
			Category:    "video",
			OutputExt:   "webm",
			FFmpegArgs:  []string{"-codec:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-codec:a", "libopus", "-b:a", "128k"},
		},
		{
			ID:          "video-avi",
			Name:        "AVI Legacy",
			Description: "AVI format for older devices",
			Category:    "video",
			OutputExt:   "avi",
			FFmpegArgs:  []string{"-codec:v", "mpeg4", "-q:v", "5", "-codec:a", "mp3", "-b:a", "192k"},
		},
		// Resolution Presets
		{
			ID:          "video-1080p",
			Name:        "Scale to 1080p",
			Description: "Scale video to 1920x1080",
			Category:    "resize",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2", "-codec:v", "libx264", "-preset", "medium", "-crf", "23", "-codec:a", "copy"},
		},
		{
			ID:          "video-720p",
			Name:        "Scale to 720p",
			Description: "Scale video to 1280x720",
			Category:    "resize",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2", "-codec:v", "libx264", "-preset", "medium", "-crf", "23", "-codec:a", "copy"},
		},
		{
			ID:          "video-480p",
			Name:        "Scale to 480p",
			Description: "Scale video to 854x480",
			Category:    "resize",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-vf", "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2", "-codec:v", "libx264", "-preset", "medium", "-crf", "23", "-codec:a", "copy"},
		},
		// GIF Presets
		{
			ID:          "gif-standard",
			Name:        "GIF Standard",
			Description: "Animated GIF, 15 FPS, max 480px",
			Category:    "gif",
			OutputExt:   "gif",
			FFmpegArgs:  []string{"-vf", "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0"},
		},
		{
			ID:          "gif-small",
			Name:        "GIF Small",
			Description: "Small GIF, 10 FPS, max 320px",
			Category:    "gif",
			OutputExt:   "gif",
			FFmpegArgs:  []string{"-vf", "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0"},
		},
		// Extract Presets
		{
			ID:          "extract-audio",
			Name:        "Extract Audio",
			Description: "Extract audio track without re-encoding",
			Category:    "extract",
			OutputExt:   "m4a",
			FFmpegArgs:  []string{"-vn", "-codec:a", "copy"},
		},
		// Trim/Cut
		{
			ID:          "trim-copy",
			Name:        "Quick Trim",
			Description: "Trim video without re-encoding (fast)",
			Category:    "trim",
			OutputExt:   "mp4",
			FFmpegArgs:  []string{"-codec", "copy"},
			Options: map[string]interface{}{
				"requiresStartTime": true,
				"requiresEndTime":   true,
			},
		},
	}
}

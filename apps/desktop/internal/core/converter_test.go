package core

import "testing"

func TestGetDefaultPresets(t *testing.T) {
	presets := GetDefaultPresets()

	if len(presets) == 0 {
		t.Fatal("GetDefaultPresets() returned empty slice")
	}

	// Check we have presets for each category
	categories := make(map[string]int)
	for _, p := range presets {
		categories[p.Category]++
	}

	expectedCategories := []string{"audio", "video", "resize", "gif", "extract", "trim"}
	for _, cat := range expectedCategories {
		if categories[cat] == 0 {
			t.Errorf("missing presets for category %q", cat)
		}
	}
}

func TestConversionPreset_AudioPresets(t *testing.T) {
	presets := GetDefaultPresets()

	var mp3Found bool
	for _, p := range presets {
		if p.ID == "audio-mp3-320" {
			mp3Found = true
			if p.Name != "MP3 High Quality" {
				t.Errorf("Name = %q, want %q", p.Name, "MP3 High Quality")
			}
			if p.Category != "audio" {
				t.Errorf("Category = %q, want %q", p.Category, "audio")
			}
			if p.OutputExt != "mp3" {
				t.Errorf("OutputExt = %q, want %q", p.OutputExt, "mp3")
			}
			if len(p.FFmpegArgs) == 0 {
				t.Error("FFmpegArgs is empty")
			}
		}
	}

	if !mp3Found {
		t.Error("audio-mp3-320 preset not found")
	}
}

func TestConversionPreset_VideoPresets(t *testing.T) {
	presets := GetDefaultPresets()

	videoPresetIDs := []string{"video-mp4-h264", "video-mp4-h265", "video-webm"}
	for _, id := range videoPresetIDs {
		found := false
		for _, p := range presets {
			if p.ID == id {
				found = true
				if p.Category != "video" {
					t.Errorf("%s: Category = %q, want %q", id, p.Category, "video")
				}
				break
			}
		}
		if !found {
			t.Errorf("preset %q not found", id)
		}
	}
}

func TestConversionState_Values(t *testing.T) {
	states := []ConversionState{
		ConversionQueued,
		ConversionAnalyzing,
		ConversionConverting,
		ConversionCompleted,
		ConversionFailed,
		ConversionCancelled,
	}

	expectedStrings := []string{
		"queued", "analyzing", "converting", "completed", "failed", "cancelled",
	}

	for i, s := range states {
		if string(s) != expectedStrings[i] {
			t.Errorf("ConversionState = %q, want %q", s, expectedStrings[i])
		}
	}
}

func TestTrimOptions_Struct(t *testing.T) {
	opts := TrimOptions{
		StartTime: 10.5,
		EndTime:   60.0,
	}

	if opts.StartTime != 10.5 {
		t.Errorf("StartTime = %v, want %v", opts.StartTime, 10.5)
	}
	if opts.EndTime != 60.0 {
		t.Errorf("EndTime = %v, want %v", opts.EndTime, 60.0)
	}
}

func TestConversionJob_Struct(t *testing.T) {
	job := ConversionJob{
		ID:          "job-1",
		InputPath:   "/input/video.mp4",
		OutputPath:  "/output/video.mp3",
		PresetID:    "audio-mp3-320",
		State:       ConversionConverting,
		Progress:    50.5,
		Duration:    180.0,
		CurrentTime: 90.0,
	}

	if job.ID != "job-1" {
		t.Errorf("ID = %q, want %q", job.ID, "job-1")
	}
	if job.Progress != 50.5 {
		t.Errorf("Progress = %v, want %v", job.Progress, 50.5)
	}
}

func TestConversionJob_WithTrim(t *testing.T) {
	job := ConversionJob{
		ID:         "job-2",
		InputPath:  "/input/video.mp4",
		OutputPath: "/output/clip.mp4",
		PresetID:   "trim-copy",
		TrimOptions: &TrimOptions{
			StartTime: 30.0,
			EndTime:   45.0,
		},
		State: ConversionQueued,
	}

	if job.TrimOptions == nil {
		t.Fatal("TrimOptions is nil")
	}
	if job.TrimOptions.StartTime != 30.0 {
		t.Errorf("TrimOptions.StartTime = %v, want %v", job.TrimOptions.StartTime, 30.0)
	}
}

func TestMediaInfo_Struct(t *testing.T) {
	info := MediaInfo{
		Duration: 180.5,
		Format:   "mp4",
		Size:     1024 * 1024 * 50, // 50MB
		Bitrate:  2000000,
		VideoStream: &VideoStream{
			Codec:   "h264",
			Width:   1920,
			Height:  1080,
			FPS:     30.0,
			Bitrate: 1800000,
		},
		AudioStream: &AudioStream{
			Codec:      "aac",
			Channels:   2,
			SampleRate: 48000,
			Bitrate:    192000,
		},
	}

	if info.Duration != 180.5 {
		t.Errorf("Duration = %v, want %v", info.Duration, 180.5)
	}
	if info.VideoStream.Width != 1920 {
		t.Errorf("VideoStream.Width = %d, want %d", info.VideoStream.Width, 1920)
	}
	if info.AudioStream.SampleRate != 48000 {
		t.Errorf("AudioStream.SampleRate = %d, want %d", info.AudioStream.SampleRate, 48000)
	}
}

func TestVideoStream_Struct(t *testing.T) {
	stream := VideoStream{
		Codec:   "hevc",
		Width:   3840,
		Height:  2160,
		FPS:     60.0,
		Bitrate: 8000000,
	}

	if stream.Width != 3840 {
		t.Errorf("Width = %d, want %d", stream.Width, 3840)
	}
	if stream.FPS != 60.0 {
		t.Errorf("FPS = %v, want %v", stream.FPS, 60.0)
	}
}

func TestAudioStream_Struct(t *testing.T) {
	stream := AudioStream{
		Codec:      "flac",
		Channels:   6, // 5.1 surround
		SampleRate: 96000,
		Bitrate:    1411000,
	}

	if stream.Channels != 6 {
		t.Errorf("Channels = %d, want %d", stream.Channels, 6)
	}
}

func TestConversionProgress_Struct(t *testing.T) {
	progress := ConversionProgress{
		JobID:       "job-1",
		State:       ConversionConverting,
		Progress:    75.0,
		CurrentTime: 135.0,
		Speed:       2.5,
		Error:       "",
	}

	if progress.Speed != 2.5 {
		t.Errorf("Speed = %v, want %v", progress.Speed, 2.5)
	}
	if progress.Error != "" {
		t.Error("Error should be empty")
	}
}

func TestConversionPreset_WithOptions(t *testing.T) {
	presets := GetDefaultPresets()

	for _, p := range presets {
		if p.ID == "trim-copy" {
			if p.Options == nil {
				t.Fatal("Options is nil for trim-copy preset")
			}
			if val, ok := p.Options["preserveExtension"]; !ok || val != true {
				t.Error("preserveExtension option not set correctly")
			}
			if p.OutputExt != "" {
				t.Errorf("OutputExt = %q, want empty string for trim-copy", p.OutputExt)
			}
			return
		}
	}
	t.Error("trim-copy preset not found")
}

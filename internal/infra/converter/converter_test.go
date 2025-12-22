package converter

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"ybdownloader/internal/core"
)

func TestNew(t *testing.T) {
	emit := func(event string, data interface{}) {}

	service := New("/usr/bin/ffmpeg", emit)
	if service == nil {
		t.Fatal("New() returned nil")
	}

	if service.ffmpegPath != "/usr/bin/ffmpeg" {
		t.Errorf("New() ffmpegPath = %q, want %q", service.ffmpegPath, "/usr/bin/ffmpeg")
	}

	if service.presets == nil {
		t.Error("New() presets is nil")
	}

	if service.jobs == nil {
		t.Error("New() jobs is nil")
	}

	if service.cancelFuncs == nil {
		t.Error("New() cancelFuncs is nil")
	}
}

func TestNew_EmptyPath(t *testing.T) {
	service := New("", nil)
	if service == nil {
		t.Fatal("New() returned nil")
	}

	if service.ffmpegPath != "" {
		t.Errorf("New() ffmpegPath = %q, want empty", service.ffmpegPath)
	}
}

func TestGetPresets(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	presets := service.GetPresets()
	if presets == nil {
		t.Fatal("GetPresets() returned nil")
	}

	if len(presets) == 0 {
		t.Error("GetPresets() returned empty slice")
	}
}

func TestGetPresetsByCategory(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	audioPresets := service.GetPresetsByCategory("audio")
	if audioPresets == nil {
		t.Fatal("GetPresetsByCategory() returned nil")
	}

	for _, p := range audioPresets {
		if p.Category != "audio" {
			t.Errorf("GetPresetsByCategory('audio') returned preset with category %q", p.Category)
		}
	}

	// Test non-existent category
	emptyPresets := service.GetPresetsByCategory("nonexistent")
	if emptyPresets != nil && len(emptyPresets) > 0 {
		t.Error("GetPresetsByCategory('nonexistent') should return empty slice")
	}
}

func TestGetPreset(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Get first preset ID to test with
	presets := service.GetPresets()
	if len(presets) == 0 {
		t.Skip("No presets available")
	}

	firstPresetID := presets[0].ID

	preset, err := service.GetPreset(firstPresetID)
	if err != nil {
		t.Fatalf("GetPreset(%q) error = %v", firstPresetID, err)
	}

	if preset == nil {
		t.Error("GetPreset() returned nil")
	}

	if preset.ID != firstPresetID {
		t.Errorf("GetPreset() ID = %q, want %q", preset.ID, firstPresetID)
	}
}

func TestGetPreset_NotFound(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	_, err := service.GetPreset("nonexistent-preset-id")
	if err == nil {
		t.Error("GetPreset() expected error for nonexistent preset")
	}
}

func TestGetAllJobs_Empty(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	jobs := service.GetAllJobs()
	if jobs == nil {
		t.Fatal("GetAllJobs() returned nil")
	}

	if len(jobs) != 0 {
		t.Errorf("GetAllJobs() returned %d jobs, expected 0", len(jobs))
	}
}

func TestGetJob_NotFound(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	_, err := service.GetJob("nonexistent-job-id")
	if err == nil {
		t.Error("GetJob() expected error for nonexistent job")
	}
}

func TestRemoveJob_NotFound(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	err := service.RemoveJob("nonexistent-job-id")
	if err == nil {
		t.Error("RemoveJob() expected error for nonexistent job")
	}
}

func TestClearCompletedJobs(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add some jobs manually
	service.jobs["job1"] = &core.ConversionJob{ID: "job1", State: core.ConversionCompleted}
	service.jobs["job2"] = &core.ConversionJob{ID: "job2", State: core.ConversionFailed}
	service.jobs["job3"] = &core.ConversionJob{ID: "job3", State: core.ConversionCompleted}

	service.ClearCompletedJobs()

	if len(service.jobs) != 1 {
		t.Errorf("ClearCompletedJobs() left %d jobs, expected 1", len(service.jobs))
	}

	if _, ok := service.jobs["job2"]; !ok {
		t.Error("ClearCompletedJobs() removed non-completed job")
	}
}

func TestCancelConversion_NotFound(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	err := service.CancelConversion("nonexistent-job-id")
	if err == nil {
		t.Error("CancelConversion() expected error for nonexistent job")
	}
}

func TestStartConversion_NoFFmpeg(t *testing.T) {
	service := New("", nil)

	_, err := service.StartConversion("job1", "/input.mp3", "/output.mp4", "preset-id", nil)
	if err == nil {
		t.Error("StartConversion() expected error when ffmpeg not available")
	}
}

func TestStartConversion_NoPresetOrArgs(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	_, err := service.StartConversion("job1", "/input.mp3", "/output.mp4", "", nil)
	if err == nil {
		t.Error("StartConversion() expected error when no preset or args provided")
	}
}

func TestStartConversion_InvalidPreset(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	_, err := service.StartConversion("job1", "/input.mp3", "/output.mp4", "invalid-preset", nil)
	if err == nil {
		t.Error("StartConversion() expected error for invalid preset")
	}
}

func TestAnalyzeFile_NoFFprobe(t *testing.T) {
	service := New("", nil)

	_, err := service.AnalyzeFile(context.Background(), "/some/file.mp3")
	if err == nil {
		t.Error("AnalyzeFile() expected error when ffprobe not available")
	}
}

func TestRemoveJob_ActiveJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add an active job
	service.jobs["active-job"] = &core.ConversionJob{
		ID:    "active-job",
		State: core.ConversionConverting,
	}

	err := service.RemoveJob("active-job")
	if err == nil {
		t.Error("RemoveJob() expected error for active job")
	}
}

func TestRemoveJob_AnalyzingJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add an analyzing job
	service.jobs["analyzing-job"] = &core.ConversionJob{
		ID:    "analyzing-job",
		State: core.ConversionAnalyzing,
	}

	err := service.RemoveJob("analyzing-job")
	if err == nil {
		t.Error("RemoveJob() expected error for analyzing job")
	}
}

func TestRemoveJob_CompletedJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a completed job
	service.jobs["completed-job"] = &core.ConversionJob{
		ID:    "completed-job",
		State: core.ConversionCompleted,
	}

	err := service.RemoveJob("completed-job")
	if err != nil {
		t.Errorf("RemoveJob() error = %v, expected nil", err)
	}

	if _, ok := service.jobs["completed-job"]; ok {
		t.Error("RemoveJob() did not remove the job")
	}
}

func TestRemoveJob_FailedJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a failed job
	service.jobs["failed-job"] = &core.ConversionJob{
		ID:    "failed-job",
		State: core.ConversionFailed,
	}

	err := service.RemoveJob("failed-job")
	if err != nil {
		t.Errorf("RemoveJob() error = %v, expected nil", err)
	}

	if _, ok := service.jobs["failed-job"]; ok {
		t.Error("RemoveJob() did not remove the job")
	}
}

func TestRemoveJob_CancelledJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a cancelled job
	service.jobs["cancelled-job"] = &core.ConversionJob{
		ID:    "cancelled-job",
		State: core.ConversionCancelled,
	}

	err := service.RemoveJob("cancelled-job")
	if err != nil {
		t.Errorf("RemoveJob() error = %v, expected nil", err)
	}
}

func TestParseFrameRate(t *testing.T) {
	tests := []struct {
		input    string
		expected float64
	}{
		{"30/1", 30.0},
		{"24000/1001", 23.976023976023978}, // ~23.976
		{"60/1", 60.0},
		{"0/1", 0.0},
		{"30", 0.0}, // Invalid format
		{"", 0.0},
		{"30/0", 0.0}, // Division by zero
		{"abc/def", 0.0},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := parseFrameRate(tt.input)
			// Use approximate comparison for floating point
			if (tt.expected == 0 && result != 0) || (tt.expected != 0 && (result < tt.expected*0.99 || result > tt.expected*1.01)) {
				t.Errorf("parseFrameRate(%q) = %v, want approximately %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestEmitProgress(t *testing.T) {
	var emittedEvent string
	var emittedData interface{}

	emit := func(event string, data interface{}) {
		emittedEvent = event
		emittedData = data
	}

	service := New("/usr/bin/ffmpeg", emit)

	service.emitProgress("job1", core.ConversionConverting, 50.0, 10.0, 1.5, "")

	if emittedEvent != "conversion:progress" {
		t.Errorf("emitProgress() event = %q, want %q", emittedEvent, "conversion:progress")
	}

	progress, ok := emittedData.(core.ConversionProgress)
	if !ok {
		t.Fatalf("emitProgress() data type = %T, want ConversionProgress", emittedData)
	}

	if progress.JobID != "job1" {
		t.Errorf("emitProgress() JobID = %q, want %q", progress.JobID, "job1")
	}

	if progress.Progress != 50.0 {
		t.Errorf("emitProgress() Progress = %v, want %v", progress.Progress, 50.0)
	}
}

func TestEmitProgress_NilEmit(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Should not panic
	service.emitProgress("job1", core.ConversionConverting, 50.0, 10.0, 1.5, "")
}

func TestUpdateJobState(t *testing.T) {
	var emitted bool
	emit := func(event string, data interface{}) {
		emitted = true
	}

	service := New("/usr/bin/ffmpeg", emit)
	service.jobs["job1"] = &core.ConversionJob{
		ID:    "job1",
		State: core.ConversionQueued,
	}

	service.updateJobState("job1", core.ConversionConverting, 25.0, "")

	job := service.jobs["job1"]
	if job.State != core.ConversionConverting {
		t.Errorf("updateJobState() State = %v, want %v", job.State, core.ConversionConverting)
	}

	if job.Progress != 25.0 {
		t.Errorf("updateJobState() Progress = %v, want %v", job.Progress, 25.0)
	}

	if !emitted {
		t.Error("updateJobState() should emit progress")
	}
}

func TestUpdateJobState_WithError(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)
	service.jobs["job1"] = &core.ConversionJob{
		ID:    "job1",
		State: core.ConversionConverting,
	}

	service.updateJobState("job1", core.ConversionFailed, 0, "some error message")

	job := service.jobs["job1"]
	if job.State != core.ConversionFailed {
		t.Errorf("updateJobState() State = %v, want %v", job.State, core.ConversionFailed)
	}

	if job.Error != "some error message" {
		t.Errorf("updateJobState() Error = %q, want %q", job.Error, "some error message")
	}
}

func TestUpdateJobState_NonexistentJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Should not panic
	service.updateJobState("nonexistent", core.ConversionFailed, 0, "error")
}

// Integration test - requires ffmpeg to be installed
func TestStartConversion_WithCustomArgs(t *testing.T) {
	// Check if ffmpeg is available
	if _, err := os.Stat("/usr/bin/ffmpeg"); os.IsNotExist(err) {
		t.Skip("ffmpeg not available, skipping integration test")
	}

	// Create a test file
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "input.txt")
	if err := os.WriteFile(inputPath, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	outputPath := filepath.Join(tempDir, "output.txt")

	service := New("/usr/bin/ffmpeg", nil)

	// This will fail because it's not a valid media file, but it should create the job
	job, err := service.StartConversion("test-job", inputPath, outputPath, "", []string{"-c", "copy"})
	if err != nil {
		t.Fatalf("StartConversion() error = %v", err)
	}

	if job == nil {
		t.Fatal("StartConversion() returned nil job")
	}

	if job.ID != "test-job" {
		t.Errorf("StartConversion() job.ID = %q, want %q", job.ID, "test-job")
	}

	// Verify job is in the jobs map
	storedJob, err := service.GetJob("test-job")
	if err != nil {
		t.Errorf("GetJob() error = %v", err)
	}

	if storedJob.InputPath != inputPath {
		t.Errorf("GetJob() InputPath = %q, want %q", storedJob.InputPath, inputPath)
	}
}

func TestNew_FindsFFprobe(t *testing.T) {
	// Check if ffprobe exists next to ffmpeg
	if _, err := os.Stat("/usr/bin/ffmpeg"); os.IsNotExist(err) {
		t.Skip("ffmpeg not available, skipping test")
	}

	service := New("/usr/bin/ffmpeg", nil)

	// On most systems, ffprobe should be found
	if service.ffprobePath == "" {
		// Check if ffprobe exists in PATH at least
		if _, err := os.Stat("/usr/bin/ffprobe"); err == nil {
			t.Log("ffprobe exists but was not found by New()")
		}
	}
}

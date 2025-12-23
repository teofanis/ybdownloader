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

func TestStartConversionWithTrim(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "input.mp4")
	if err := os.WriteFile(inputPath, []byte("fake video content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	trim := &core.TrimOptions{
		StartTime: 10.0,
		EndTime:   30.0,
	}

	job, err := service.StartConversionWithTrim("trim-job", inputPath, "", "video-mp4-h264", nil, trim)
	if err != nil {
		t.Fatalf("StartConversionWithTrim() error = %v", err)
	}

	if job == nil {
		t.Fatal("StartConversionWithTrim() returned nil job")
	}

	if job.ID != "trim-job" {
		t.Errorf("job.ID = %q, want %q", job.ID, "trim-job")
	}

	if job.TrimOptions == nil {
		t.Error("job.TrimOptions is nil")
	} else {
		if job.TrimOptions.StartTime != 10.0 {
			t.Errorf("TrimOptions.StartTime = %f, want %f", job.TrimOptions.StartTime, 10.0)
		}
		if job.TrimOptions.EndTime != 30.0 {
			t.Errorf("TrimOptions.EndTime = %f, want %f", job.TrimOptions.EndTime, 30.0)
		}
	}

	// Output path should contain "_trimmed"
	if job.OutputPath == "" {
		t.Error("job.OutputPath is empty")
	} else {
		t.Logf("OutputPath: %s", job.OutputPath)
	}
}

func TestStartConversionWithTrim_NoTrim(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "input.mp4")
	if err := os.WriteFile(inputPath, []byte("fake video content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Pass nil trim options
	job, err := service.StartConversionWithTrim("no-trim-job", inputPath, "", "video-mp4-h264", nil, nil)
	if err != nil {
		t.Fatalf("StartConversionWithTrim() error = %v", err)
	}

	if job.TrimOptions != nil {
		t.Error("job.TrimOptions should be nil when not trimming")
	}

	// Output path should contain "_converted"
	if job.OutputPath == "" {
		t.Error("job.OutputPath is empty")
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		seconds  float64
		expected string
	}{
		{0, "00:00:00.000"},
		{1.5, "00:00:01.500"},
		{60, "00:01:00.000"},
		{61.25, "00:01:01.250"},
		{3661.123, "01:01:01.123"},
		{7322.5, "02:02:02.500"},
	}

	for _, tt := range tests {
		result := formatDuration(tt.seconds)
		if result != tt.expected {
			t.Errorf("formatDuration(%f) = %q, want %q", tt.seconds, result, tt.expected)
		}
	}
}

func TestGenerateWaveform_NoFFmpeg(t *testing.T) {
	service := New("", nil)

	_, err := service.GenerateWaveform(context.Background(), "/some/file.mp3", 100)
	if err == nil {
		t.Error("GenerateWaveform() should fail when ffmpeg is not available")
	}
}

func TestGenerateWaveform_DefaultSamples(t *testing.T) {
	// Skip if ffmpeg not available
	if _, err := os.Stat("/usr/bin/ffmpeg"); os.IsNotExist(err) {
		t.Skip("ffmpeg not available")
	}

	service := New("/usr/bin/ffmpeg", nil)

	// Test with 0 samples (should use default)
	tempDir := t.TempDir()
	testFile := filepath.Join(tempDir, "test.mp3")

	// Write a minimal valid file (this will fail, but we're testing the parameter handling)
	if err := os.WriteFile(testFile, []byte("not real audio"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// This will likely fail because it's not a real audio file, but that's okay
	_, _ = service.GenerateWaveform(context.Background(), testFile, 0)
	// We're just testing it doesn't panic
}

func TestGenerateThumbnails_NoFFmpeg(t *testing.T) {
	service := New("", nil)

	_, err := service.GenerateThumbnails(context.Background(), "/some/file.mp4", 10, "/tmp")
	if err == nil {
		t.Error("GenerateThumbnails() should fail when ffmpeg is not available")
	}
}

func TestCancelConversion_CallsCancelFunc(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a job in converting state with a cancel function
	ctx, cancel := context.WithCancel(context.Background())
	service.jobs["cancel-job"] = &core.ConversionJob{
		ID:    "cancel-job",
		State: core.ConversionConverting,
	}
	service.cancelFuncs["cancel-job"] = cancel

	err := service.CancelConversion("cancel-job")
	if err != nil {
		t.Errorf("CancelConversion() error = %v", err)
	}

	// Check context was cancelled (state update happens in the goroutine)
	select {
	case <-ctx.Done():
		// Expected - cancel func was called
	default:
		t.Error("context should be cancelled")
	}
}

func TestService_Jobs_Concurrency(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add jobs concurrently
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(n int) {
			jobID := "concurrent-job-" + string(rune('0'+n))
			service.mu.Lock()
			service.jobs[jobID] = &core.ConversionJob{
				ID:    jobID,
				State: core.ConversionQueued,
			}
			service.mu.Unlock()
			done <- true
		}(i)
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	// All jobs should be added
	jobs := service.GetAllJobs()
	if len(jobs) < 10 {
		t.Errorf("got %d jobs, want at least 10", len(jobs))
	}
}

func TestService_GetJob_Success(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	service.jobs["test-job"] = &core.ConversionJob{
		ID:        "test-job",
		State:     core.ConversionCompleted,
		InputPath: "/input.mp3",
	}

	job, err := service.GetJob("test-job")
	if err != nil {
		t.Fatalf("GetJob() error = %v", err)
	}

	if job.ID != "test-job" {
		t.Errorf("job.ID = %q, want %q", job.ID, "test-job")
	}
	if job.InputPath != "/input.mp3" {
		t.Errorf("job.InputPath = %q, want %q", job.InputPath, "/input.mp3")
	}
}

func TestNew_WithWindowsPath(t *testing.T) {
	service := New("C:\\Program Files\\ffmpeg\\ffmpeg.exe", nil)

	if service.ffmpegPath != "C:\\Program Files\\ffmpeg\\ffmpeg.exe" {
		t.Errorf("ffmpegPath = %q, want %q", service.ffmpegPath, "C:\\Program Files\\ffmpeg\\ffmpeg.exe")
	}
}

func TestGetPresetsByCategory_AllCategories(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	categories := []string{"audio", "video", "resize", "gif", "extract", "trim"}

	for _, cat := range categories {
		presets := service.GetPresetsByCategory(cat)
		if len(presets) == 0 {
			t.Errorf("GetPresetsByCategory(%q) returned no presets", cat)
		}
	}
}

func TestClearCompletedJobs_MixedStates(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add jobs in various states
	service.jobs["completed1"] = &core.ConversionJob{ID: "completed1", State: core.ConversionCompleted}
	service.jobs["completed2"] = &core.ConversionJob{ID: "completed2", State: core.ConversionCompleted}
	service.jobs["failed1"] = &core.ConversionJob{ID: "failed1", State: core.ConversionFailed}
	service.jobs["cancelled1"] = &core.ConversionJob{ID: "cancelled1", State: core.ConversionCancelled}
	service.jobs["converting1"] = &core.ConversionJob{ID: "converting1", State: core.ConversionConverting}
	service.jobs["queued1"] = &core.ConversionJob{ID: "queued1", State: core.ConversionQueued}

	service.ClearCompletedJobs()

	// Should keep: failed, cancelled, converting, queued
	if len(service.jobs) != 4 {
		t.Errorf("ClearCompletedJobs() left %d jobs, want 4", len(service.jobs))
	}

	if _, ok := service.jobs["completed1"]; ok {
		t.Error("completed1 should be removed")
	}
	if _, ok := service.jobs["converting1"]; !ok {
		t.Error("converting1 should remain")
	}
}

func TestRemoveJob_QueuedJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a queued job
	service.jobs["queued-job"] = &core.ConversionJob{
		ID:    "queued-job",
		State: core.ConversionQueued,
	}

	err := service.RemoveJob("queued-job")
	if err != nil {
		t.Errorf("RemoveJob() error = %v", err)
	}

	if _, ok := service.jobs["queued-job"]; ok {
		t.Error("queued job should be removed")
	}
}

func TestGetPreset_Exists(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Get the first preset from the list to test with a known ID
	allPresets := service.GetPresets()
	if len(allPresets) == 0 {
		t.Skip("No presets available")
	}

	preset, err := service.GetPreset(allPresets[0].ID)
	if err != nil {
		t.Errorf("GetPreset() error = %v", err)
	}
	if preset.ID != allPresets[0].ID {
		t.Errorf("GetPreset() returned wrong preset")
	}
}

func TestRemoveJob_ConvertingJob(t *testing.T) {
	service := New("/usr/bin/ffmpeg", nil)

	// Add a converting job (cannot be removed while active)
	service.jobs["converting-job"] = &core.ConversionJob{
		ID:    "converting-job",
		State: core.ConversionConverting,
	}

	err := service.RemoveJob("converting-job")
	if err == nil {
		t.Error("RemoveJob() should return error for active job")
	}
}

func TestService_EmitFunction_Triggered(t *testing.T) {
	var emitCalled bool
	var emitEvent string

	emit := func(event string, data interface{}) {
		emitCalled = true
		emitEvent = event
	}

	service := New("/usr/bin/ffmpeg", emit)

	// Add a job and trigger an update
	service.jobs["test-job"] = &core.ConversionJob{
		ID:    "test-job",
		State: core.ConversionQueued,
	}

	// The updateJobState method calls emit
	service.updateJobState("test-job", core.ConversionConverting, 0, "")

	if !emitCalled {
		t.Error("emit function should have been called")
	}
	if emitEvent != "conversion:progress" {
		t.Errorf("emitEvent = %q, want %q", emitEvent, "conversion:progress")
	}
}

func TestConversionJob_States(t *testing.T) {
	states := []core.ConversionState{
		core.ConversionQueued,
		core.ConversionAnalyzing,
		core.ConversionConverting,
		core.ConversionCompleted,
		core.ConversionFailed,
		core.ConversionCancelled,
	}

	for _, state := range states {
		job := &core.ConversionJob{State: state}
		if job.State != state {
			t.Errorf("State not set correctly: %v", state)
		}
	}
}

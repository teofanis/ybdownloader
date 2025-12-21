package converter

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"

	"ybdownload/internal/core"
)

// Service handles FFmpeg-based media conversion.
type Service struct {
	ffmpegPath  string
	ffprobePath string
	presets     []core.ConversionPreset
	jobs        map[string]*core.ConversionJob
	cancelFuncs map[string]context.CancelFunc
	mu          sync.RWMutex
	emit        func(event string, data interface{})
}

// New creates a new converter service.
func New(ffmpegPath string, emit func(string, interface{})) *Service {
	// Try to find ffprobe next to ffmpeg
	ffprobePath := ""
	if ffmpegPath != "" {
		dir := filepath.Dir(ffmpegPath)
		probeName := "ffprobe"
		if strings.HasSuffix(ffmpegPath, ".exe") {
			probeName = "ffprobe.exe"
		}
		candidatePath := filepath.Join(dir, probeName)
		if _, err := os.Stat(candidatePath); err == nil {
			ffprobePath = candidatePath
		} else {
			// Try system path
			if path, err := exec.LookPath(probeName); err == nil {
				ffprobePath = path
			}
		}
	}

	return &Service{
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
		presets:     core.GetDefaultPresets(),
		jobs:        make(map[string]*core.ConversionJob),
		cancelFuncs: make(map[string]context.CancelFunc),
		emit:        emit,
	}
}

// GetPresets returns all available conversion presets.
func (s *Service) GetPresets() []core.ConversionPreset {
	return s.presets
}

// GetPresetsByCategory returns presets filtered by category.
func (s *Service) GetPresetsByCategory(category string) []core.ConversionPreset {
	var result []core.ConversionPreset
	for _, p := range s.presets {
		if p.Category == category {
			result = append(result, p)
		}
	}
	return result
}

// GetPreset returns a specific preset by ID.
func (s *Service) GetPreset(id string) (*core.ConversionPreset, error) {
	for _, p := range s.presets {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("preset not found: %s", id)
}

// AnalyzeFile analyzes a media file and returns its information.
func (s *Service) AnalyzeFile(ctx context.Context, filePath string) (*core.MediaInfo, error) {
	if s.ffprobePath == "" {
		return nil, fmt.Errorf("ffprobe not available")
	}

	args := []string{
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		filePath,
	}

	cmd := exec.CommandContext(ctx, s.ffprobePath, args...)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("ffprobe failed: %w", err)
	}

	var probeData struct {
		Format struct {
			Duration   string `json:"duration"`
			Size       string `json:"size"`
			BitRate    string `json:"bit_rate"`
			FormatName string `json:"format_name"`
		} `json:"format"`
		Streams []struct {
			CodecType    string `json:"codec_type"`
			CodecName    string `json:"codec_name"`
			Width        int    `json:"width"`
			Height       int    `json:"height"`
			AvgFrameRate string `json:"avg_frame_rate"`
			BitRate      string `json:"bit_rate"`
			Channels     int    `json:"channels"`
			SampleRate   string `json:"sample_rate"`
		} `json:"streams"`
	}

	if err := json.Unmarshal(output, &probeData); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	info := &core.MediaInfo{
		Format: probeData.Format.FormatName,
	}

	if dur, err := strconv.ParseFloat(probeData.Format.Duration, 64); err == nil {
		info.Duration = dur
	}
	if size, err := strconv.ParseInt(probeData.Format.Size, 10, 64); err == nil {
		info.Size = size
	}
	if br, err := strconv.ParseInt(probeData.Format.BitRate, 10, 64); err == nil {
		info.Bitrate = br
	}

	for _, stream := range probeData.Streams {
		switch stream.CodecType {
		case "video":
			if info.VideoStream == nil {
				info.VideoStream = &core.VideoStream{
					Codec:  stream.CodecName,
					Width:  stream.Width,
					Height: stream.Height,
				}
				if fps := parseFrameRate(stream.AvgFrameRate); fps > 0 {
					info.VideoStream.FPS = fps
				}
				if br, err := strconv.ParseInt(stream.BitRate, 10, 64); err == nil {
					info.VideoStream.Bitrate = br
				}
			}
		case "audio":
			if info.AudioStream == nil {
				info.AudioStream = &core.AudioStream{
					Codec:    stream.CodecName,
					Channels: stream.Channels,
				}
				if sr, err := strconv.Atoi(stream.SampleRate); err == nil {
					info.AudioStream.SampleRate = sr
				}
				if br, err := strconv.ParseInt(stream.BitRate, 10, 64); err == nil {
					info.AudioStream.Bitrate = br
				}
			}
		}
	}

	return info, nil
}

// StartConversion starts a new conversion job.
func (s *Service) StartConversion(id, inputPath, outputPath, presetID string, customArgs []string) (*core.ConversionJob, error) {
	if s.ffmpegPath == "" {
		return nil, fmt.Errorf("ffmpeg not available")
	}

	// Get preset if specified
	var args []string
	switch {
	case presetID != "":
		preset, err := s.GetPreset(presetID)
		if err != nil {
			return nil, err
		}
		args = preset.FFmpegArgs

		// Set output extension based on preset if not already set
		if outputPath == "" {
			dir := filepath.Dir(inputPath)
			base := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))
			outputPath = filepath.Join(dir, base+"_converted."+preset.OutputExt)
		}
	case len(customArgs) > 0:
		args = customArgs
	default:
		return nil, fmt.Errorf("either presetId or customArgs required")
	}

	job := &core.ConversionJob{
		ID:         id,
		InputPath:  inputPath,
		OutputPath: outputPath,
		PresetID:   presetID,
		CustomArgs: customArgs,
		State:      core.ConversionQueued,
	}

	s.mu.Lock()
	s.jobs[id] = job
	s.mu.Unlock()

	go s.runConversion(job, args)

	return job, nil
}

func (s *Service) runConversion(job *core.ConversionJob, ffmpegArgs []string) {
	ctx, cancel := context.WithCancel(context.Background())

	s.mu.Lock()
	s.cancelFuncs[job.ID] = cancel
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.cancelFuncs, job.ID)
		s.mu.Unlock()
	}()

	// Analyze input file first
	s.updateJobState(job.ID, core.ConversionAnalyzing, 0, "")

	info, err := s.AnalyzeFile(ctx, job.InputPath)
	if err != nil {
		s.updateJobState(job.ID, core.ConversionFailed, 0, fmt.Sprintf("Analysis failed: %v", err))
		return
	}

	s.mu.Lock()
	job.InputInfo = info
	job.Duration = info.Duration
	s.mu.Unlock()

	// Build FFmpeg command
	args := []string{
		"-y",                // Overwrite output
		"-i", job.InputPath, // Input
		"-progress", "pipe:1", // Progress to stdout
		"-nostats", // No stats to stderr
	}
	args = append(args, ffmpegArgs...)
	args = append(args, job.OutputPath)

	cmd := exec.CommandContext(ctx, s.ffmpegPath, args...)

	// Capture progress from stdout
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		s.updateJobState(job.ID, core.ConversionFailed, 0, err.Error())
		return
	}

	s.updateJobState(job.ID, core.ConversionConverting, 0, "")

	if err := cmd.Start(); err != nil {
		s.updateJobState(job.ID, core.ConversionFailed, 0, err.Error())
		return
	}

	// Parse progress
	scanner := bufio.NewScanner(stdout)
	progressRegex := regexp.MustCompile(`out_time_ms=(\d+)`)
	speedRegex := regexp.MustCompile(`speed=\s*([\d.]+)x`)

	var currentTimeMs int64
	var speed float64

	for scanner.Scan() {
		line := scanner.Text()

		if matches := progressRegex.FindStringSubmatch(line); len(matches) > 1 {
			if ms, err := strconv.ParseInt(matches[1], 10, 64); err == nil {
				currentTimeMs = ms
			}
		}

		if matches := speedRegex.FindStringSubmatch(line); len(matches) > 1 {
			if s, err := strconv.ParseFloat(matches[1], 64); err == nil {
				speed = s
			}
		}

		if strings.HasPrefix(line, "progress=") {
			// Calculate progress
			currentTime := float64(currentTimeMs) / 1000000.0
			var progress float64
			if job.Duration > 0 {
				progress = (currentTime / job.Duration) * 100
				if progress > 100 {
					progress = 100
				}
			}

			s.mu.Lock()
			job.Progress = progress
			job.CurrentTime = currentTime
			s.mu.Unlock()

			s.emitProgress(job.ID, core.ConversionConverting, progress, currentTime, speed, "")
		}
	}

	// Wait for completion
	err = cmd.Wait()
	if ctx.Err() == context.Canceled {
		s.updateJobState(job.ID, core.ConversionCancelled, 0, "")
		// Clean up partial output
		os.Remove(job.OutputPath)
		return
	}

	if err != nil {
		s.updateJobState(job.ID, core.ConversionFailed, 0, err.Error())
		return
	}

	s.updateJobState(job.ID, core.ConversionCompleted, 100, "")
}

// CancelConversion cancels a running conversion.
func (s *Service) CancelConversion(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	cancel, ok := s.cancelFuncs[id]
	if !ok {
		return fmt.Errorf("conversion not found or not running: %s", id)
	}

	cancel()
	return nil
}

// GetJob returns a specific conversion job.
func (s *Service) GetJob(id string) (*core.ConversionJob, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	job, ok := s.jobs[id]
	if !ok {
		return nil, fmt.Errorf("job not found: %s", id)
	}
	return job, nil
}

// GetAllJobs returns all conversion jobs.
func (s *Service) GetAllJobs() []*core.ConversionJob {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]*core.ConversionJob, 0, len(s.jobs))
	for _, job := range s.jobs {
		result = append(result, job)
	}
	return result
}

// RemoveJob removes a completed/failed/cancelled job.
func (s *Service) RemoveJob(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[id]
	if !ok {
		return fmt.Errorf("job not found: %s", id)
	}

	if job.State == core.ConversionConverting || job.State == core.ConversionAnalyzing {
		return fmt.Errorf("cannot remove active job")
	}

	delete(s.jobs, id)
	return nil
}

// ClearCompletedJobs removes all completed jobs.
func (s *Service) ClearCompletedJobs() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, job := range s.jobs {
		if job.State == core.ConversionCompleted {
			delete(s.jobs, id)
		}
	}
}

func (s *Service) updateJobState(id string, state core.ConversionState, progress float64, errMsg string) {
	s.mu.Lock()
	if job, ok := s.jobs[id]; ok {
		job.State = state
		job.Progress = progress
		if errMsg != "" {
			job.Error = errMsg
		}
	}
	s.mu.Unlock()

	s.emitProgress(id, state, progress, 0, 0, errMsg)
}

func (s *Service) emitProgress(id string, state core.ConversionState, progress, currentTime, speed float64, errMsg string) {
	if s.emit != nil {
		s.emit("conversion:progress", core.ConversionProgress{
			JobID:       id,
			State:       state,
			Progress:    progress,
			CurrentTime: currentTime,
			Speed:       speed,
			Error:       errMsg,
		})
	}
}

func parseFrameRate(fr string) float64 {
	parts := strings.Split(fr, "/")
	if len(parts) == 2 {
		num, err1 := strconv.ParseFloat(parts[0], 64)
		den, err2 := strconv.ParseFloat(parts[1], 64)
		if err1 == nil && err2 == nil && den > 0 {
			return num / den
		}
	}
	return 0
}

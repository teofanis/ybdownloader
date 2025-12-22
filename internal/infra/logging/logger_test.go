package logging

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestNew(t *testing.T) {
	tempDir := t.TempDir()
	cfg := Config{
		Level:      LevelInfo,
		LogDir:     tempDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	}

	logger, err := New(cfg)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	if logger.slogger == nil {
		t.Error("New() slogger is nil")
	}

	// Check that log file was created
	today := time.Now().Format("2006-01-02")
	expectedFile := filepath.Join(tempDir, "ybdownloader-"+today+".log")
	if _, err := os.Stat(expectedFile); os.IsNotExist(err) {
		t.Errorf("Log file not created: %s", expectedFile)
	}
}

func TestParseLevel(t *testing.T) {
	tests := []struct {
		input string
		want  Level
	}{
		{"debug", LevelDebug},
		{"info", LevelInfo},
		{"warn", LevelWarn},
		{"warning", LevelWarn},
		{"error", LevelError},
		{"invalid", LevelInfo}, // default
		{"", LevelInfo},        // default
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := ParseLevel(tt.input)
			if got != tt.want {
				t.Errorf("ParseLevel(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestLevelString(t *testing.T) {
	tests := []struct {
		level Level
		want  string
	}{
		{LevelDebug, "debug"},
		{LevelInfo, "info"},
		{LevelWarn, "warn"},
		{LevelError, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			got := tt.level.String()
			if got != tt.want {
				t.Errorf("Level.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSetLevel(t *testing.T) {
	tempDir := t.TempDir()
	cfg := Config{
		Level:      LevelInfo,
		LogDir:     tempDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	}

	logger, err := New(cfg)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	// Change level
	logger.SetLevel(LevelDebug)

	if logger.config.Level != LevelDebug {
		t.Errorf("SetLevel() level = %v, want %v", logger.config.Level, LevelDebug)
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig("/test/log/dir")

	if cfg.Level != LevelInfo {
		t.Errorf("DefaultConfig().Level = %v, want %v", cfg.Level, LevelInfo)
	}
	if cfg.LogDir != "/test/log/dir" {
		t.Errorf("DefaultConfig().LogDir = %v, want %v", cfg.LogDir, "/test/log/dir")
	}
	if cfg.MaxAgeDays != 7 {
		t.Errorf("DefaultConfig().MaxAgeDays = %v, want %v", cfg.MaxAgeDays, 7)
	}
	if cfg.Console != false {
		t.Errorf("DefaultConfig().Console = %v, want %v", cfg.Console, false)
	}
	if cfg.JSONFormat != false {
		t.Errorf("DefaultConfig().JSONFormat = %v, want %v", cfg.JSONFormat, false)
	}
}

func TestInit(t *testing.T) {
	tempDir := t.TempDir()
	cfg := Config{
		Level:      LevelInfo,
		LogDir:     tempDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	}

	err := Init(cfg)
	if err != nil {
		t.Fatalf("Init() error = %v", err)
	}
	defer Close()

	// Test that L() returns a valid logger
	logger := L()
	if logger == nil {
		t.Error("L() returned nil")
	}

	// Log something - should not panic
	logger.Info("test message", "key", "value")
}

func TestSetGlobalLevel(t *testing.T) {
	tempDir := t.TempDir()
	cfg := Config{
		Level:      LevelInfo,
		LogDir:     tempDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	}

	err := Init(cfg)
	if err != nil {
		t.Fatalf("Init() error = %v", err)
	}
	defer Close()

	SetGlobalLevel(LevelDebug)

	if globalLogger.config.Level != LevelDebug {
		t.Errorf("SetGlobalLevel() level = %v, want %v", globalLogger.config.Level, LevelDebug)
	}
}

func TestJSONFormat(t *testing.T) {
	tempDir := t.TempDir()
	cfg := Config{
		Level:      LevelInfo,
		LogDir:     tempDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: true, // Test JSON format
	}

	logger, err := New(cfg)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	// Log something - should not panic
	logger.Slogger().Info("test message", "key", "value")
}

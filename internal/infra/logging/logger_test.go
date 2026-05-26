package logging

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
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
		name  string
		level Level
		want  string
	}{
		{"debug level", LevelDebug, "debug"},
		{"info level", LevelInfo, "info"},
		{"warn level", LevelWarn, "warn"},
		{"error level", LevelError, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
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

	// Test all log levels
	levels := []Level{LevelDebug, LevelInfo, LevelWarn, LevelError}
	for _, level := range levels {
		logger.SetLevel(level)
		if logger.config.Level != level {
			t.Errorf("SetLevel(%v) level = %v, want %v", level, logger.config.Level, level)
		}
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

func TestCleanOldLogs_ReadDirError(t *testing.T) {
	l := &Logger{
		config: Config{LogDir: "/nonexistent/path", MaxAgeDays: 7},
	}
	l.cleanOldLogs()
}

func TestRotate_SameDayNoOp(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelInfo, LogDir: tmpDir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	if err := logger.rotate(); err != nil {
		t.Fatalf("second rotate() error = %v", err)
	}
}

func TestNew_WithConsole(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelInfo, LogDir: tmpDir, Console: true})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	logger.Slogger().Info("console test")
}

func TestNew_DebugLevel(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelDebug, LogDir: tmpDir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	logger.Slogger().Debug("debug test")
}

func TestNew_InvalidLogDir(t *testing.T) {
	_, err := New(Config{Level: LevelInfo, LogDir: "/dev/null/impossible"})
	if err == nil {
		t.Fatal("New() expected error for invalid log directory")
	}
}

func TestSetGlobalLevel_NilGlobalLogger(t *testing.T) {
	globalMu.Lock()
	saved := globalLogger
	globalLogger = nil
	globalMu.Unlock()
	defer func() {
		globalMu.Lock()
		globalLogger = saved
		globalMu.Unlock()
	}()

	SetGlobalLevel(LevelDebug)
}

func TestCheckRotate_DateChange(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelInfo, LogDir: tmpDir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	logger.mu.Lock()
	logger.currentDate = "2000-01-01"
	logger.mu.Unlock()

	_ = logger.Slogger()

	logger.mu.Lock()
	defer logger.mu.Unlock()
	if logger.currentDate == "2000-01-01" {
		t.Error("checkRotate() did not trigger rotation on date change")
	}
}

func TestSlogger_WarnLevel(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelWarn, LogDir: tmpDir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	s := logger.Slogger()
	if s == nil {
		t.Fatal("Slogger() returned nil")
	}
}

func TestSlogger_ErrorLevel(t *testing.T) {
	tmpDir := t.TempDir()
	logger, err := New(Config{Level: LevelError, LogDir: tmpDir})
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	s := logger.Slogger()
	if s == nil {
		t.Fatal("Slogger() returned nil")
	}
}

func TestCleanOldLogs(t *testing.T) {
	tempDir := t.TempDir()

	now := time.Now()
	for i := 0; i < 12; i++ {
		ts := now.AddDate(0, 0, -i)
		name := fmt.Sprintf("ybdownloader-%s.log", ts.Format("2006-01-02"))
		path := filepath.Join(tempDir, name)
		if err := os.WriteFile(path, []byte("log"), 0600); err != nil {
			t.Fatal(err)
		}
		// Set mod time so ordering is deterministic
		if err := os.Chtimes(path, ts, ts); err != nil {
			t.Fatal(err)
		}
	}

	cfg := Config{Level: LevelInfo, LogDir: tempDir, MaxAgeDays: 7}
	logger, err := New(cfg)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	logger.cleanOldLogs()

	entries, _ := os.ReadDir(tempDir)
	var logFiles []string
	for _, e := range entries {
		if !e.IsDir() {
			logFiles = append(logFiles, e.Name())
		}
	}
	sort.Strings(logFiles)

	// Files older than 7 days should be removed
	for _, name := range logFiles {
		info, _ := os.Stat(filepath.Join(tempDir, name))
		if info.ModTime().Before(now.AddDate(0, 0, -7)) {
			t.Errorf("old log file %s should have been deleted", name)
		}
	}
}

func TestNewLogger_RotatesExistingLog(t *testing.T) {
	tempDir := t.TempDir()

	// Create an existing log file for today
	today := time.Now().Format("2006-01-02")
	existingLog := filepath.Join(tempDir, "ybdownloader-"+today+".log")
	if err := os.WriteFile(existingLog, []byte("old log content"), 0600); err != nil {
		t.Fatal(err)
	}

	cfg := Config{Level: LevelInfo, LogDir: tempDir, MaxAgeDays: 7}
	logger, err := New(cfg)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	defer logger.Close()

	// The log file should still exist (appended, not rotated since same day)
	if _, err := os.Stat(existingLog); os.IsNotExist(err) {
		t.Error("today's log file should still exist")
	}
}

func TestLogger_Close_NoFile(t *testing.T) {
	l := &Logger{}
	err := l.Close()
	if err != nil {
		t.Errorf("Close() on logger with no file should return nil, got %v", err)
	}
}

func TestGlobal_Close_NoInit(t *testing.T) {
	// Ensure global logger is nil
	globalMu.Lock()
	saved := globalLogger
	globalLogger = nil
	globalMu.Unlock()
	defer func() {
		globalMu.Lock()
		globalLogger = saved
		globalMu.Unlock()
	}()

	err := Close()
	if err != nil {
		t.Errorf("Close() with no global logger should return nil, got %v", err)
	}
}

func TestL_NoInit(t *testing.T) {
	globalMu.Lock()
	saved := globalLogger
	globalLogger = nil
	globalMu.Unlock()
	defer func() {
		globalMu.Lock()
		globalLogger = saved
		globalMu.Unlock()
	}()

	logger := L()
	if logger == nil {
		t.Error("L() should return default slog.Logger when not initialized")
	}
}

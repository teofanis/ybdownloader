// Package logging provides structured logging with daily rotation and configurable levels.
package logging

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Level represents logging verbosity.
type Level string

const (
	LevelDebug Level = "debug"
	LevelInfo  Level = "info"
	LevelWarn  Level = "warn"
	LevelError Level = "error"
)

// Config holds logger configuration.
type Config struct {
	Level      Level
	LogDir     string
	MaxAgeDays int  // Days to keep old logs (0 = keep forever)
	Console    bool // Also log to console
	JSONFormat bool // Use JSON format instead of text
}

// DefaultConfig returns sensible defaults.
func DefaultConfig(logDir string) Config {
	return Config{
		Level:      LevelInfo,
		LogDir:     logDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	}
}

// Logger wraps slog with daily rotation.
type Logger struct {
	mu          sync.Mutex
	config      Config
	slogger     *slog.Logger
	currentFile *os.File
	currentDate string
}

var (
	globalLogger *Logger
	globalMu     sync.RWMutex
)

// Init initializes the global logger.
func Init(cfg Config) error {
	logger, err := New(cfg)
	if err != nil {
		return err
	}

	globalMu.Lock()
	defer globalMu.Unlock()
	globalLogger = logger

	// Set as default slog logger
	slog.SetDefault(logger.slogger)

	return nil
}

// New creates a new Logger instance.
func New(cfg Config) (*Logger, error) {
	l := &Logger{config: cfg}

	if err := l.ensureLogDir(); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %w", err)
	}

	if err := l.rotate(); err != nil {
		return nil, fmt.Errorf("failed to initialize log file: %w", err)
	}

	// Clean old logs
	if cfg.MaxAgeDays > 0 {
		go l.cleanOldLogs()
	}

	return l, nil
}

// Close closes the current log file.
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.currentFile != nil {
		return l.currentFile.Close()
	}
	return nil
}

// SetLevel changes the log level at runtime.
func (l *Logger) SetLevel(level Level) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.config.Level = level
	l.rebuildLogger()
}

func (l *Logger) ensureLogDir() error {
	return os.MkdirAll(l.config.LogDir, 0755)
}

func (l *Logger) rotate() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	today := time.Now().Format("2006-01-02")
	if l.currentDate == today && l.currentFile != nil {
		return nil
	}

	// Close previous file
	if l.currentFile != nil {
		_ = l.currentFile.Close()
	}

	// Open new file
	filename := filepath.Join(l.config.LogDir, fmt.Sprintf("ybdownloader-%s.log", today))
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}

	l.currentFile = file
	l.currentDate = today
	l.rebuildLogger()

	return nil
}

func (l *Logger) rebuildLogger() {
	var writers []io.Writer

	if l.currentFile != nil {
		writers = append(writers, l.currentFile)
	}

	if l.config.Console {
		writers = append(writers, os.Stderr)
	}

	if len(writers) == 0 {
		writers = append(writers, os.Stderr)
	}

	var writer io.Writer
	if len(writers) == 1 {
		writer = writers[0]
	} else {
		writer = io.MultiWriter(writers...)
	}

	opts := &slog.HandlerOptions{
		Level:     l.slogLevel(),
		AddSource: l.config.Level == LevelDebug,
	}

	var handler slog.Handler
	if l.config.JSONFormat {
		handler = slog.NewJSONHandler(writer, opts)
	} else {
		handler = slog.NewTextHandler(writer, opts)
	}

	l.slogger = slog.New(handler)
}

func (l *Logger) slogLevel() slog.Level {
	switch l.config.Level {
	case LevelDebug:
		return slog.LevelDebug
	case LevelInfo:
		return slog.LevelInfo
	case LevelWarn:
		return slog.LevelWarn
	case LevelError:
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func (l *Logger) cleanOldLogs() {
	cutoff := time.Now().AddDate(0, 0, -l.config.MaxAgeDays)

	entries, err := os.ReadDir(l.config.LogDir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			_ = os.Remove(filepath.Join(l.config.LogDir, entry.Name()))
		}
	}
}

// checkRotate checks if we need to rotate to a new day's file.
func (l *Logger) checkRotate() {
	today := time.Now().Format("2006-01-02")
	if l.currentDate != today {
		_ = l.rotate()
	}
}

// Slogger returns the underlying slog.Logger.
func (l *Logger) Slogger() *slog.Logger {
	l.checkRotate()
	return l.slogger
}

// Global accessor functions

// L returns the global logger's slog.Logger.
func L() *slog.Logger {
	globalMu.RLock()
	defer globalMu.RUnlock()

	if globalLogger == nil {
		return slog.Default()
	}
	globalLogger.checkRotate()
	return globalLogger.slogger
}

// SetGlobalLevel changes the global logger's level.
func SetGlobalLevel(level Level) {
	globalMu.Lock()
	defer globalMu.Unlock()

	if globalLogger != nil {
		globalLogger.config.Level = level
		globalLogger.rebuildLogger()
	}
}

// Close closes the global logger.
func Close() error {
	globalMu.Lock()
	defer globalMu.Unlock()

	if globalLogger != nil {
		return globalLogger.Close()
	}
	return nil
}

// ParseLevel parses a string into a Level.
func ParseLevel(s string) Level {
	switch s {
	case "debug":
		return LevelDebug
	case "info":
		return LevelInfo
	case "warn", "warning":
		return LevelWarn
	case "error":
		return LevelError
	default:
		return LevelInfo
	}
}

// String returns the string representation of the level.
func (l Level) String() string {
	return string(l)
}

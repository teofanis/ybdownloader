// Package settings provides settings persistence.
package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"

	"ybdownload/internal/core"
)

const settingsFileName = "settings.json"

// Store implements core.SettingsStore with JSON file persistence.
type Store struct {
	fs       core.FileSystem
	mu       sync.RWMutex
	filePath string
	cache    *core.Settings
}

// NewStore creates a new settings store.
func NewStore(fs core.FileSystem) (*Store, error) {
	configDir, err := fs.GetConfigDir()
	if err != nil {
		return nil, err
	}

	if err := fs.EnsureDir(configDir); err != nil {
		return nil, err
	}

	return &Store{
		fs:       fs,
		filePath: filepath.Join(configDir, settingsFileName),
	}, nil
}

// Ensure Store implements core.SettingsStore.
var _ core.SettingsStore = (*Store)(nil)

// Load reads settings from storage. Returns default settings if none exist.
func (s *Store) Load() (*core.Settings, error) {
	s.mu.RLock()
	if s.cache != nil {
		cached := *s.cache
		s.mu.RUnlock()
		return &cached, nil
	}
	s.mu.RUnlock()

	s.mu.Lock()
	defer s.mu.Unlock()

	// Double-check after acquiring write lock
	if s.cache != nil {
		cached := *s.cache
		return &cached, nil
	}

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			// Return defaults
			musicDir, _ := s.fs.GetMusicDir()
			defaults := core.DefaultSettings(musicDir)
			s.cache = defaults
			return defaults, nil
		}
		return nil, err
	}

	var settings core.Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		// Corrupted file, return defaults
		musicDir, _ := s.fs.GetMusicDir()
		defaults := core.DefaultSettings(musicDir)
		s.cache = defaults
		return defaults, nil
	}

	// Migrate if needed
	settings = s.migrate(settings)

	// Validate
	if err := settings.Validate(); err != nil {
		musicDir, _ := s.fs.GetMusicDir()
		defaults := core.DefaultSettings(musicDir)
		s.cache = defaults
		return defaults, nil
	}

	s.cache = &settings
	return &settings, nil
}

// Save persists settings to storage.
func (s *Store) Save(settings *core.Settings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Validate before saving
	if err := settings.Validate(); err != nil {
		return err
	}

	// Ensure version is current
	settings.Version = core.SettingsVersion

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	// Atomic write: write to temp file then rename
	tmpPath := s.filePath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return err
	}

	if err := os.Rename(tmpPath, s.filePath); err != nil {
		os.Remove(tmpPath) // cleanup on failure
		return err
	}

	s.cache = settings
	return nil
}

// Reset removes all saved settings.
func (s *Store) Reset() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.cache = nil

	if err := os.Remove(s.filePath); err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}

// migrate handles settings schema migrations.
func (s *Store) migrate(settings core.Settings) core.Settings {
	// Current version is 1, no migrations needed yet
	// Future migrations would be handled here:
	//
	// if settings.Version < 2 {
	//     // migrate from v1 to v2
	//     settings.NewField = defaultValue
	// }

	settings.Version = core.SettingsVersion
	return settings
}

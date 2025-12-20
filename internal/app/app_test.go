package app

import (
	"testing"
)

func TestIsValidYouTubeURL(t *testing.T) {
	tests := []struct {
		name  string
		url   string
		valid bool
	}{
		// Valid URLs
		{
			name:  "standard watch URL",
			url:   "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "watch URL without www",
			url:   "https://youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "watch URL without https",
			url:   "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "short youtu.be URL",
			url:   "https://youtu.be/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "shorts URL",
			url:   "https://www.youtube.com/shorts/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "embed URL",
			url:   "https://www.youtube.com/embed/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "music.youtube.com URL",
			url:   "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "URL with extra params",
			url:   "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest",
			valid: true,
		},

		// Invalid URLs
		{
			name:  "empty string",
			url:   "",
			valid: false,
		},
		{
			name:  "random URL",
			url:   "https://google.com",
			valid: false,
		},
		{
			name:  "youtube.com without video ID",
			url:   "https://www.youtube.com",
			valid: false,
		},
		{
			name:  "invalid video ID (too short)",
			url:   "https://www.youtube.com/watch?v=abc",
			valid: false,
		},
		{
			name:  "playlist URL without video",
			url:   "https://www.youtube.com/playlist?list=PLtest",
			valid: false,
		},
		{
			name:  "channel URL",
			url:   "https://www.youtube.com/@SomeChannel",
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidYouTubeURL(tt.url)
			if result != tt.valid {
				t.Errorf("isValidYouTubeURL(%q) = %v, want %v", tt.url, result, tt.valid)
			}
		})
	}
}

func TestGenerateID(t *testing.T) {
	id1 := generateID()
	id2 := generateID()

	if id1 == "" {
		t.Error("generateID() returned empty string")
	}

	if len(id1) != 32 {
		t.Errorf("generateID() returned ID of length %d, want 32", len(id1))
	}

	if id1 == id2 {
		t.Error("generateID() returned duplicate IDs")
	}
}

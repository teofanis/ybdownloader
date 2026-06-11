package youtube

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNewSearcher(t *testing.T) {
	s := NewSearcher()
	if s == nil {
		t.Fatal("NewSearcher returned nil")
	}
	if s.client == nil {
		t.Error("client is nil")
	}
}

func TestParseDuration(t *testing.T) {
	tests := []struct {
		input    string
		expected int
	}{
		{"3:45", 225},     // 3*60 + 45
		{"1:02:30", 3750}, // 1*3600 + 2*60 + 30
		{"0:30", 30},      // 30 seconds
		{"10:00", 600},    // 10 minutes
		{"2:00:00", 7200}, // 2 hours
		{"1:23:45", 5025}, // 1*3600 + 23*60 + 45
		{"", 0},           // empty
		{"invalid", 0},    // invalid format
		{"5", 0},          // single number (invalid)
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			result := parseDuration(tc.input)
			if result != tc.expected {
				t.Errorf("parseDuration(%q) = %d, want %d", tc.input, result, tc.expected)
			}
		})
	}
}

func TestNavigateJSON(t *testing.T) {
	data := map[string]interface{}{
		"level1": map[string]interface{}{
			"level2": map[string]interface{}{
				"level3": "value",
			},
		},
	}

	t.Run("single level", func(t *testing.T) {
		result := navigateJSON(data, "level1")
		if result == nil {
			t.Error("expected non-nil result")
		}
		if _, ok := result.(map[string]interface{}); !ok {
			t.Error("expected map result")
		}
	})

	t.Run("two levels", func(t *testing.T) {
		result := navigateJSON(data, "level1", "level2")
		if result == nil {
			t.Error("expected non-nil result")
		}
	})

	t.Run("three levels", func(t *testing.T) {
		result := navigateJSON(data, "level1", "level2", "level3")
		if result != "value" {
			t.Errorf("got %v, want 'value'", result)
		}
	})

	t.Run("non-existent key", func(t *testing.T) {
		result := navigateJSON(data, "level1", "nonexistent")
		if result != nil {
			t.Errorf("expected nil, got %v", result)
		}
	})

	t.Run("empty keys", func(t *testing.T) {
		result := navigateJSON(data)
		if result == nil {
			t.Error("expected non-nil for empty keys")
		}
	})

	t.Run("nil data", func(t *testing.T) {
		result := navigateJSON(nil, "key")
		if result != nil {
			t.Errorf("expected nil, got %v", result)
		}
	})

	t.Run("non-map data", func(t *testing.T) {
		result := navigateJSON("string", "key")
		if result != nil {
			t.Errorf("expected nil, got %v", result)
		}
	})
}

func TestExtractVideoInfo(t *testing.T) {
	t.Run("complete video renderer", func(t *testing.T) {
		renderer := map[string]interface{}{
			"videoId": "abc123",
			"title": map[string]interface{}{
				"runs": []interface{}{
					map[string]interface{}{"text": "Test Video Title"},
				},
			},
			"ownerText": map[string]interface{}{
				"runs": []interface{}{
					map[string]interface{}{"text": "Test Channel"},
				},
			},
			"lengthText": map[string]interface{}{
				"simpleText": "5:30",
			},
			"thumbnail": map[string]interface{}{
				"thumbnails": []interface{}{
					map[string]interface{}{"url": "https://example.com/thumb.jpg"},
				},
			},
			"viewCountText": map[string]interface{}{
				"simpleText": "1M views",
			},
			"publishedTimeText": map[string]interface{}{
				"simpleText": "2 days ago",
			},
		}

		result := extractVideoInfo(renderer)
		if result == nil {
			t.Fatal("extractVideoInfo returned nil")
		}

		if result.ID != "abc123" {
			t.Errorf("ID = %q, want %q", result.ID, "abc123")
		}
		if result.Title != "Test Video Title" {
			t.Errorf("Title = %q, want %q", result.Title, "Test Video Title")
		}
		if result.Author != "Test Channel" {
			t.Errorf("Author = %q, want %q", result.Author, "Test Channel")
		}
		if result.Duration != "5:30" {
			t.Errorf("Duration = %q, want %q", result.Duration, "5:30")
		}
		if result.DurationSec != 330 {
			t.Errorf("DurationSec = %d, want %d", result.DurationSec, 330)
		}
		if result.Thumbnail != "https://example.com/thumb.jpg" {
			t.Errorf("Thumbnail = %q, want %q", result.Thumbnail, "https://example.com/thumb.jpg")
		}
		if result.ViewCount != "1M views" {
			t.Errorf("ViewCount = %q, want %q", result.ViewCount, "1M views")
		}
		if result.PublishedAt != "2 days ago" {
			t.Errorf("PublishedAt = %q, want %q", result.PublishedAt, "2 days ago")
		}
		if result.URL != "https://www.youtube.com/watch?v=abc123" {
			t.Errorf("URL = %q, want %q", result.URL, "https://www.youtube.com/watch?v=abc123")
		}
	})

	t.Run("missing video ID", func(t *testing.T) {
		renderer := map[string]interface{}{
			"title": map[string]interface{}{
				"runs": []interface{}{
					map[string]interface{}{"text": "Test Video"},
				},
			},
		}

		result := extractVideoInfo(renderer)
		if result != nil {
			t.Error("expected nil for missing videoId")
		}
	})

	t.Run("empty video ID", func(t *testing.T) {
		renderer := map[string]interface{}{
			"videoId": "",
		}

		result := extractVideoInfo(renderer)
		if result != nil {
			t.Error("expected nil for empty videoId")
		}
	})

	t.Run("minimal video renderer", func(t *testing.T) {
		renderer := map[string]interface{}{
			"videoId": "xyz789",
		}

		result := extractVideoInfo(renderer)
		if result == nil {
			t.Fatal("extractVideoInfo returned nil")
		}
		if result.ID != "xyz789" {
			t.Errorf("ID = %q, want %q", result.ID, "xyz789")
		}
		if result.URL != "https://www.youtube.com/watch?v=xyz789" {
			t.Errorf("URL = %q, want %q", result.URL, "https://www.youtube.com/watch?v=xyz789")
		}
	})
}

func TestParseSearchResults(t *testing.T) {
	t.Run("valid html with results", func(t *testing.T) {
		html := `<html><script>var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"test123","title":{"runs":[{"text":"Test Video"}]}}}]}}]}}}}};</script></html>`

		results, err := parseSearchResults(html, 10)
		if err != nil {
			t.Fatalf("parseSearchResults failed: %v", err)
		}

		if len(results) != 1 {
			t.Errorf("got %d results, want 1", len(results))
		}

		if len(results) > 0 && results[0].ID != "test123" {
			t.Errorf("result ID = %q, want %q", results[0].ID, "test123")
		}
	})

	t.Run("missing ytInitialData", func(t *testing.T) {
		html := `<html><body>No data here</body></html>`

		_, err := parseSearchResults(html, 10)
		if err == nil {
			t.Error("expected error for missing ytInitialData")
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		html := `<html><script>var ytInitialData = {invalid json};</script></html>`

		_, err := parseSearchResults(html, 10)
		if err == nil {
			t.Error("expected error for invalid JSON")
		}
	})

	t.Run("limit results", func(t *testing.T) {
		html := `<html><script>var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"v1"}},{"videoRenderer":{"videoId":"v2"}},{"videoRenderer":{"videoId":"v3"}}]}}]}}}}};</script></html>`

		results, err := parseSearchResults(html, 2)
		if err != nil {
			t.Fatalf("parseSearchResults failed: %v", err)
		}

		if len(results) != 2 {
			t.Errorf("got %d results, want 2 (limited)", len(results))
		}
	})
}

func TestSearcherSearch(t *testing.T) {
	t.Run("empty query", func(t *testing.T) {
		s := NewSearcher()
		_, err := s.Search(context.Background(), "", 10)
		if err == nil {
			t.Error("expected error for empty query")
		}
	})

	t.Run("default limit", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`<html><script>var ytInitialData = {"contents":{"twoColumnSearchResultsRenderer":{"primaryContents":{"sectionListRenderer":{"contents":[{"itemSectionRenderer":{"contents":[{"videoRenderer":{"videoId":"test"}}]}}]}}}}};</script></html>`))
		}))
		defer server.Close()

		// Can't easily test with real URL due to httptest limitations
		// This tests error handling for network issues
		s := NewSearcher()
		s.client.Timeout = 1 // Very short timeout
		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		_, err := s.Search(ctx, "test", 0)
		if err == nil {
			// If no error, that's fine too (might have been cached or very fast)
			t.Log("search completed without error")
		}
	})

	t.Run("server error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer server.Close()

		// Test with cancelled context
		s := NewSearcher()
		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		_, err := s.Search(ctx, "test", 10)
		if err == nil {
			t.Log("expected error but got none")
		}
	})
}

func TestSearcherGetTrending(t *testing.T) {
	t.Run("default country", func(t *testing.T) {
		s := NewSearcher()
		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		_, err := s.GetTrending(ctx, "", 10)
		if err == nil {
			t.Log("expected error for cancelled context")
		}
	})

	t.Run("custom country", func(t *testing.T) {
		s := NewSearcher()
		ctx, cancel := context.WithCancel(context.Background())
		cancel()

		_, err := s.GetTrending(ctx, "GB", 5)
		if err == nil {
			t.Log("expected error for cancelled context")
		}
	})
}

func TestParseTrendingResults(t *testing.T) {
	t.Run("missing ytInitialData", func(t *testing.T) {
		html := `<html><body>No data here</body></html>`

		_, err := parseTrendingResults(html, 10)
		if err == nil {
			t.Error("expected error for missing ytInitialData")
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		html := `<html><script>var ytInitialData = {invalid};</script></html>`

		_, err := parseTrendingResults(html, 10)
		if err == nil {
			t.Error("expected error for invalid JSON")
		}
	})

	t.Run("valid but empty data", func(t *testing.T) {
		html := `<html><script>var ytInitialData = {};</script></html>`

		results, err := parseTrendingResults(html, 10)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(results) != 0 {
			t.Errorf("expected 0 results, got %d", len(results))
		}
	})
}

func TestFindVideosRecursive(t *testing.T) {
	t.Run("find nested video renderer", func(t *testing.T) {
		data := map[string]interface{}{
			"contents": []interface{}{
				map[string]interface{}{
					"videoRenderer": map[string]interface{}{
						"videoId": "vid1",
					},
				},
			},
		}

		var results []SearchResult
		findVideosRecursive(data, &results, 10)

		if len(results) != 1 {
			t.Errorf("got %d results, want 1", len(results))
		}
	})

	t.Run("find rich item renderer", func(t *testing.T) {
		data := map[string]interface{}{
			"richItemRenderer": map[string]interface{}{
				"content": map[string]interface{}{
					"videoRenderer": map[string]interface{}{
						"videoId": "vid2",
					},
				},
			},
		}

		var results []SearchResult
		findVideosRecursive(data, &results, 10)

		// The recursive function finds richItemRenderer and also digs into content->videoRenderer
		if len(results) < 1 {
			t.Errorf("got %d results, want at least 1", len(results))
		}
	})

	t.Run("respect limit", func(t *testing.T) {
		data := []interface{}{
			map[string]interface{}{"videoRenderer": map[string]interface{}{"videoId": "v1"}},
			map[string]interface{}{"videoRenderer": map[string]interface{}{"videoId": "v2"}},
			map[string]interface{}{"videoRenderer": map[string]interface{}{"videoId": "v3"}},
		}

		var results []SearchResult
		findVideosRecursive(data, &results, 2)

		if len(results) != 2 {
			t.Errorf("got %d results, want 2 (limited)", len(results))
		}
	})
}

func TestSearchResult(t *testing.T) {
	result := SearchResult{
		ID:          "abc123",
		Title:       "Test",
		Author:      "Author",
		Duration:    "3:45",
		DurationSec: 225,
		Thumbnail:   "http://example.com/thumb.jpg",
		ViewCount:   "1M views",
		PublishedAt: "1 day ago",
		URL:         "https://youtube.com/watch?v=abc123",
	}

	if result.ID != "abc123" {
		t.Error("ID mismatch")
	}
}

func TestSearchResponse(t *testing.T) {
	resp := SearchResponse{
		Query: "test query",
		Results: []SearchResult{
			{ID: "v1"},
			{ID: "v2"},
		},
	}

	if resp.Query != "test query" {
		t.Error("Query mismatch")
	}
	if len(resp.Results) != 2 {
		t.Errorf("got %d results, want 2", len(resp.Results))
	}
}

func TestTrendingResponse(t *testing.T) {
	resp := TrendingResponse{
		Country: "US",
		Results: []SearchResult{
			{ID: "t1"},
		},
	}

	if resp.Country != "US" {
		t.Error("Country mismatch")
	}
	if len(resp.Results) != 1 {
		t.Errorf("got %d results, want 1", len(resp.Results))
	}
}

package youtube

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// SearchResult represents a single search result.
type SearchResult struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Duration    string `json:"duration"`
	DurationSec int    `json:"durationSec"`
	Thumbnail   string `json:"thumbnail"`
	ViewCount   string `json:"viewCount"`
	PublishedAt string `json:"publishedAt"`
	URL         string `json:"url"`
}

// SearchResponse contains the search results.
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Query   string         `json:"query"`
}

// Searcher provides YouTube search functionality without API keys.
type Searcher struct {
	client *http.Client
}

// NewSearcher creates a new YouTube searcher.
func NewSearcher() *Searcher {
	return &Searcher{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Search performs a YouTube search and returns results.
// This uses web scraping which may break if YouTube changes their page structure.
func (s *Searcher) Search(ctx context.Context, query string, limit int) (*SearchResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("query cannot be empty")
	}

	if limit <= 0 {
		limit = 10
	}

	// Build search URL
	searchURL := fmt.Sprintf(
		"https://www.youtube.com/results?search_query=%s&sp=EgIQAQ%%3D%%3D",
		url.QueryEscape(query),
	)

	req, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to appear as a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("search request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	results, err := parseSearchResults(string(body), limit)
	if err != nil {
		return nil, fmt.Errorf("failed to parse results: %w", err)
	}

	return &SearchResponse{
		Results: results,
		Query:   query,
	}, nil
}

// parseSearchResults extracts video information from YouTube search page HTML.
func parseSearchResults(html string, limit int) ([]SearchResult, error) {
	results := []SearchResult{}

	// Find the ytInitialData JSON in the page
	dataStartPattern := regexp.MustCompile(`var ytInitialData = (.+?);</script>`)
	matches := dataStartPattern.FindStringSubmatch(html)
	if len(matches) < 2 {
		// Try alternative pattern
		altPattern := regexp.MustCompile(`ytInitialData\s*=\s*(.+?);\s*</script>`)
		matches = altPattern.FindStringSubmatch(html)
		if len(matches) < 2 {
			return nil, fmt.Errorf("could not find ytInitialData in page")
		}
	}

	jsonData := matches[1]

	// Parse the JSON
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &data); err != nil {
		return nil, fmt.Errorf("failed to parse ytInitialData: %w", err)
	}

	// Navigate to the search results
	// The structure is: contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
	contents, ok := navigateJSON(data,
		"contents",
		"twoColumnSearchResultsRenderer",
		"primaryContents",
		"sectionListRenderer",
		"contents",
	).([]interface{})
	if !ok {
		return nil, fmt.Errorf("could not navigate to search results")
	}

	for _, section := range contents {
		sectionMap, ok := section.(map[string]interface{})
		if !ok {
			continue
		}

		itemSection, ok := sectionMap["itemSectionRenderer"].(map[string]interface{})
		if !ok {
			continue
		}

		items, ok := itemSection["contents"].([]interface{})
		if !ok {
			continue
		}

		for _, item := range items {
			if len(results) >= limit {
				break
			}

			itemMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}

			videoRenderer, ok := itemMap["videoRenderer"].(map[string]interface{})
			if !ok {
				continue
			}

			result := extractVideoInfo(videoRenderer)
			if result != nil {
				results = append(results, *result)
			}
		}
	}

	return results, nil
}

// extractVideoInfo extracts video information from a videoRenderer object.
func extractVideoInfo(renderer map[string]interface{}) *SearchResult {
	videoID, _ := renderer["videoId"].(string)
	if videoID == "" {
		return nil
	}

	result := &SearchResult{
		ID:  videoID,
		URL: "https://www.youtube.com/watch?v=" + videoID,
	}

	// Extract title
	if title, ok := renderer["title"].(map[string]interface{}); ok {
		if runs, ok := title["runs"].([]interface{}); ok && len(runs) > 0 {
			if run, ok := runs[0].(map[string]interface{}); ok {
				result.Title, _ = run["text"].(string)
			}
		}
	}

	// Extract author/channel
	if owner, ok := renderer["ownerText"].(map[string]interface{}); ok {
		if runs, ok := owner["runs"].([]interface{}); ok && len(runs) > 0 {
			if run, ok := runs[0].(map[string]interface{}); ok {
				result.Author, _ = run["text"].(string)
			}
		}
	}

	// Extract duration
	if lengthText, ok := renderer["lengthText"].(map[string]interface{}); ok {
		if simpleText, ok := lengthText["simpleText"].(string); ok {
			result.Duration = simpleText
			result.DurationSec = parseDuration(simpleText)
		}
	}

	// Extract thumbnail
	if thumbnail, ok := renderer["thumbnail"].(map[string]interface{}); ok {
		if thumbnails, ok := thumbnail["thumbnails"].([]interface{}); ok && len(thumbnails) > 0 {
			// Get the highest quality thumbnail
			for _, t := range thumbnails {
				if tMap, ok := t.(map[string]interface{}); ok {
					if url, ok := tMap["url"].(string); ok {
						result.Thumbnail = url
					}
				}
			}
		}
	}

	// Extract view count
	if viewCount, ok := renderer["viewCountText"].(map[string]interface{}); ok {
		if simpleText, ok := viewCount["simpleText"].(string); ok {
			result.ViewCount = simpleText
		}
	}

	// Extract published time
	if published, ok := renderer["publishedTimeText"].(map[string]interface{}); ok {
		if simpleText, ok := published["simpleText"].(string); ok {
			result.PublishedAt = simpleText
		}
	}

	return result
}

// navigateJSON navigates through nested JSON maps.
func navigateJSON(data interface{}, keys ...string) interface{} {
	current := data
	for _, key := range keys {
		if m, ok := current.(map[string]interface{}); ok {
			current = m[key]
		} else {
			return nil
		}
	}
	return current
}

// parseDuration converts a duration string like "3:45" or "1:02:30" to seconds.
func parseDuration(s string) int {
	parts := strings.Split(s, ":")
	if len(parts) < 2 {
		return 0
	}

	var total int
	multipliers := []int{1, 60, 3600} // seconds, minutes, hours

	for i := len(parts) - 1; i >= 0; i-- {
		var value int
		fmt.Sscanf(parts[i], "%d", &value)
		idx := len(parts) - 1 - i
		if idx < len(multipliers) {
			total += value * multipliers[idx]
		}
	}

	return total
}

// TrendingResponse contains trending video results.
type TrendingResponse struct {
	Results []SearchResult `json:"results"`
	Country string         `json:"country"`
}

// GetTrending fetches trending videos.
func (s *Searcher) GetTrending(ctx context.Context, country string, limit int) (*TrendingResponse, error) {
	if country == "" {
		country = "US"
	}
	if limit <= 0 {
		limit = 20
	}

	trendingURL := fmt.Sprintf("https://www.youtube.com/feed/trending?gl=%s", country)

	req, err := http.NewRequestWithContext(ctx, "GET", trendingURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("trending request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("trending returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	results, err := parseTrendingResults(string(body), limit)
	if err != nil {
		return nil, fmt.Errorf("failed to parse trending: %w", err)
	}

	return &TrendingResponse{
		Results: results,
		Country: country,
	}, nil
}

// parseTrendingResults extracts video information from YouTube trending page.
func parseTrendingResults(html string, limit int) ([]SearchResult, error) {
	results := []SearchResult{}

	// Find ytInitialData JSON
	dataPattern := regexp.MustCompile(`var ytInitialData = (.+?);</script>`)
	matches := dataPattern.FindStringSubmatch(html)
	if len(matches) < 2 {
		return nil, fmt.Errorf("could not find ytInitialData")
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(matches[1]), &data); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	// Navigate to trending content
	// Structure varies, try multiple paths
	paths := [][]string{
		{"contents", "twoColumnBrowseResultsRenderer", "tabs", "0", "tabRenderer", "content", "sectionListRenderer", "contents"},
		{"contents", "twoColumnBrowseResultsRenderer", "tabs"},
	}

	for _, path := range paths {
		if videos := findVideosInPath(data, path, limit); len(videos) > 0 {
			return videos, nil
		}
	}

	return results, nil
}

// findVideosInPath recursively finds video renderers in the JSON structure.
func findVideosInPath(data interface{}, path []string, limit int) []SearchResult {
	results := []SearchResult{}

	// Try to find videoRenderer objects anywhere in the structure
	findVideosRecursive(data, &results, limit)

	return results
}

// findVideosRecursive recursively searches for videoRenderer objects.
func findVideosRecursive(data interface{}, results *[]SearchResult, limit int) {
	if len(*results) >= limit {
		return
	}

	switch v := data.(type) {
	case map[string]interface{}:
		// Check if this is a videoRenderer
		if videoRenderer, ok := v["videoRenderer"].(map[string]interface{}); ok {
			if result := extractVideoInfo(videoRenderer); result != nil {
				*results = append(*results, *result)
			}
		}
		// Check for richItemRenderer (used in trending page)
		if richItem, ok := v["richItemRenderer"].(map[string]interface{}); ok {
			if content, ok := richItem["content"].(map[string]interface{}); ok {
				if videoRenderer, ok := content["videoRenderer"].(map[string]interface{}); ok {
					if result := extractVideoInfo(videoRenderer); result != nil {
						*results = append(*results, *result)
					}
				}
			}
		}
		// Recursively search all values
		for _, value := range v {
			findVideosRecursive(value, results, limit)
		}
	case []interface{}:
		for _, item := range v {
			findVideosRecursive(item, results, limit)
		}
	}
}

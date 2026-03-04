package downloader

import (
	"bufio"
	"path/filepath"
	"strings"
	"testing"

	"ybdownloader/internal/core"
)

func TestScanLinesOrCR(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []string
	}{
		{
			name:  "newline separated",
			input: "[download]  10%\n[download]  20%\n",
			want:  []string{"[download]  10%", "[download]  20%"},
		},
		{
			name:  "CR separated (yt-dlp progress overwrites)",
			input: "[download]  10%\r[download]  20%\r[download]  30%\n",
			want:  []string{"[download]  10%", "[download]  20%", "[download]  30%"},
		},
		{
			name:  "CRLF separated",
			input: "[download]  10%\r\n[download]  20%\r\n",
			want:  []string{"[download]  10%", "[download]  20%"},
		},
		{
			name:  "mixed CR and LF",
			input: "[download]  5%\r[download]  10%\n[download]  50%\r[download] 100%\n",
			want:  []string{"[download]  5%", "[download]  10%", "[download]  50%", "[download] 100%"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			scanner := bufio.NewScanner(strings.NewReader(tt.input))
			scanner.Split(scanLinesOrCR)

			var got []string
			for scanner.Scan() {
				got = append(got, scanner.Text())
			}

			if len(got) != len(tt.want) {
				t.Fatalf("got %d lines, want %d: %v", len(got), len(tt.want), got)
			}
			for i := range tt.want {
				if got[i] != tt.want[i] {
					t.Errorf("line %d = %q, want %q", i, got[i], tt.want[i])
				}
			}
		})
	}
}

func TestParseYtDlpProgress(t *testing.T) {
	tests := []struct {
		name     string
		line     string
		itemID   string
		wantOK   bool
		wantPct  float64
		wantTot  int64
		wantDown int64
		wantSpd  int64
		wantETA  int64
	}{
		{
			name:     "standard progress",
			line:     "[download]  45.3% of ~  12.50MiB at    1.23MiB/s ETA 00:08",
			itemID:   "item-1",
			wantOK:   true,
			wantPct:  45.3,
			wantTot:  13107200,
			wantDown: 5937561,
			wantSpd:  1289748,
			wantETA:  5,
		},
		{
			name:     "progress at 100%",
			line:     "[download] 100% of   12.50MiB in 00:10 at 1.25MiB/s",
			itemID:   "item-2",
			wantOK:   true,
			wantPct:  100,
			wantTot:  13107200,
			wantDown: 13107200,
			wantSpd:  1310720,
			wantETA:  0,
		},
		{
			name:     "progress with unknown speed",
			line:     "[download]  45.3% of ~  12.50MiB at Unknown speed ETA Unknown",
			itemID:   "item-3",
			wantOK:   true,
			wantPct:  45.3,
			wantTot:  13107200,
			wantDown: 5937561,
			wantSpd:  0,
			wantETA:  0,
		},
		{
			name:     "progress with GiB",
			line:     "[download]  10.0% of ~   2.50GiB at    5.00MiB/s ETA 08:00",
			itemID:   "item-4",
			wantOK:   true,
			wantPct:  10,
			wantTot:  2684354560,
			wantDown: 268435456,
			wantSpd:  5242880,
			wantETA:  460,
		},
		{
			name:     "progress with KiB",
			line:     "[download]  50.0% of ~  500.00KiB at  100.00KiB/s ETA 00:02",
			itemID:   "item-5",
			wantOK:   true,
			wantPct:  50,
			wantTot:  500 * 1024,
			wantDown: 250 * 1024,
			wantSpd:  100 * 1024,
			wantETA:  (250 * 1024) / (100 * 1024),
		},
		{
			name:   "non-matching line",
			line:   "[info] Downloading video...",
			itemID: "item-6",
			wantOK: false,
		},
		{
			name:   "empty line",
			line:   "",
			itemID: "item-7",
			wantOK: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, ok := parseYtDlpProgress(tt.line, tt.itemID)
			if ok != tt.wantOK {
				t.Errorf("parseYtDlpProgress() ok = %v, want %v", ok, tt.wantOK)
				return
			}
			if !tt.wantOK {
				return
			}
			if got.ItemID != tt.itemID {
				t.Errorf("ItemID = %q, want %q", got.ItemID, tt.itemID)
			}
			if got.State != core.StateDownloading {
				t.Errorf("State = %v, want %v", got.State, core.StateDownloading)
			}
			if got.Percent != tt.wantPct {
				t.Errorf("Percent = %v, want %v", got.Percent, tt.wantPct)
			}
			if got.TotalBytes != tt.wantTot {
				t.Errorf("TotalBytes = %v, want %v", got.TotalBytes, tt.wantTot)
			}
			if got.DownloadedBytes != tt.wantDown {
				t.Errorf("DownloadedBytes = %v, want %v", got.DownloadedBytes, tt.wantDown)
			}
			if got.Speed != tt.wantSpd {
				t.Errorf("Speed = %v, want %v", got.Speed, tt.wantSpd)
			}
			if got.ETA != tt.wantETA {
				t.Errorf("ETA = %v, want %v", got.ETA, tt.wantETA)
			}
		})
	}
}

func TestExtractDestinationPath(t *testing.T) {
	tests := []struct {
		name string
		line string
		want string
	}{
		{
			name: "MoveFiles",
			line: "[MoveFiles] Moving file /tmp/test.webm to /home/user/Music/test.mp3",
			want: "/home/user/Music/test.mp3",
		},
		{
			name: "Merger destination",
			line: "[Merger] Destination: /home/user/Music/test.mp4",
			want: "/home/user/Music/test.mp4",
		},
		{
			name: "ExtractAudio destination",
			line: "[ExtractAudio] Destination: /home/user/Music/test.mp3",
			want: "/home/user/Music/test.mp3",
		},
		{
			name: "Download destination",
			line: "[download] Destination: /tmp/test.webm",
			want: "/tmp/test.webm",
		},
		{
			name: "Already downloaded",
			line: "[download] /home/user/Music/test.mp3 has already been downloaded",
			want: "/home/user/Music/test.mp3",
		},
		{
			name: "VideoConvertor",
			line: "[VideoConvertor] Destination: /home/user/test.mp4",
			want: "/home/user/test.mp4",
		},
		{
			name: "VideoRemuxer",
			line: "[VideoRemuxer] Destination: /home/user/test.mp4",
			want: "/home/user/test.mp4",
		},
		{
			name: "non-matching line",
			line: "[info] Writing metadata",
			want: "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractDestinationPath(tt.line)
			if got != tt.want {
				t.Errorf("extractDestinationPath() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestParseSizeToBytes(t *testing.T) {
	tests := []struct {
		name string
		val  float64
		unit string
		want int64
	}{
		{"GiB", 1, "GiB", 1024 * 1024 * 1024},
		{"gib lowercase", 2.5, "gib", 2684354560},
		{"MiB", 12.5, "MiB", 13107200},
		{"mib lowercase", 1, "mib", 1024 * 1024},
		{"KiB", 500, "KiB", 500 * 1024},
		{"kib lowercase", 100, "kib", 100 * 1024},
		{"bytes", 1024, "", 1024},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseSizeToBytes(tt.val, tt.unit)
			if got != tt.want {
				t.Errorf("parseSizeToBytes(%v, %q) = %v, want %v", tt.val, tt.unit, got, tt.want)
			}
		})
	}
}

func TestParseSizeString(t *testing.T) {
	tests := []struct {
		name string
		s    string
		want int64
	}{
		{"MiB", "12.50MiB", 13107200},
		{"KiB", "500.00KiB", 512000},
		{"GiB", "2.50GiB", 2684354560},
		{"bytes only", "1024", 1024},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseSizeString(tt.s)
			if got != tt.want {
				t.Errorf("parseSizeString(%q) = %v, want %v", tt.s, got, tt.want)
			}
		})
	}
}

func TestYtDlpAudioQuality(t *testing.T) {
	tests := []struct {
		name string
		q    core.AudioQuality
		want string
	}{
		{"128", core.AudioQuality128, "128K"},
		{"192", core.AudioQuality192, "192K"},
		{"256", core.AudioQuality256, "256K"},
		{"320", core.AudioQuality320, "320K"},
		{"unknown", core.AudioQuality("unknown"), "192K"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ytDlpAudioQuality(tt.q)
			if got != tt.want {
				t.Errorf("ytDlpAudioQuality(%q) = %q, want %q", tt.q, got, tt.want)
			}
		})
	}
}

func TestYtDlpVideoFormat(t *testing.T) {
	tests := []struct {
		name string
		q    core.VideoQuality
		want string
	}{
		{"360p", core.VideoQuality360p, "bv*[height<=360]+ba/b[height<=360]/b"},
		{"480p", core.VideoQuality480p, "bv*[height<=480]+ba/b[height<=480]/b"},
		{"720p", core.VideoQuality720p, "bv*[height<=720]+ba/b[height<=720]/b"},
		{"1080p", core.VideoQuality1080p, "bv*[height<=1080]+ba/b[height<=1080]/b"},
		{"best", core.VideoQualityBest, "bv*+ba/b"},
		{"default", core.VideoQuality("unknown"), "bv*[height<=720]+ba/b[height<=720]/b"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ytDlpVideoFormat(tt.q)
			if got != tt.want {
				t.Errorf("ytDlpVideoFormat(%q) = %q, want %q", tt.q, got, tt.want)
			}
		})
	}
}

func TestBuildDownloadArgs(t *testing.T) {
	d := &YtDlpDownloader{}
	commonFlags := []string{
		"--newline",
		"--no-colors",
		"--no-playlist",
		"--no-overwrites",
		"--windows-filenames",
		"--print", "after_move:filepath",
	}

	tests := []struct {
		name           string
		item           *core.QueueItem
		settings       *core.Settings
		outputTemplate string
		wantContains   []string
		wantPair       map[string]string
	}{
		{
			name: "MP3 format",
			item: &core.QueueItem{
				ID:       "1",
				Format:   core.FormatMP3,
				SavePath: "/tmp",
			},
			settings: &core.Settings{
				DefaultAudioQuality: core.AudioQuality192,
				DefaultVideoQuality: core.VideoQuality720p,
			},
			outputTemplate: filepath.Join("/tmp", "%(title)s.%(ext)s"),
			wantContains:   append(append([]string{}, commonFlags...), "-x", "--audio-format", "mp3", "--audio-quality", "192K"),
			wantPair: map[string]string{
				"-o":            filepath.Join("/tmp", "%(title)s.%(ext)s"),
				"--format-sort": "acodec:aac",
			},
		},
		{
			name: "M4A format",
			item: &core.QueueItem{
				ID:       "2",
				Format:   core.FormatM4A,
				SavePath: "/tmp",
			},
			settings: &core.Settings{
				DefaultAudioQuality: core.AudioQuality320,
				DefaultVideoQuality: core.VideoQuality720p,
			},
			outputTemplate: filepath.Join("/tmp", "%(title)s.%(ext)s"),
			wantContains:   append(append([]string{}, commonFlags...), "-x", "--audio-format", "m4a", "--audio-quality", "320K"),
			wantPair: map[string]string{
				"-o":            filepath.Join("/tmp", "%(title)s.%(ext)s"),
				"--format-sort": "acodec:aac",
			},
		},
		{
			name: "MP4 format",
			item: &core.QueueItem{
				ID:       "3",
				Format:   core.FormatMP4,
				SavePath: "/home/user",
			},
			settings: &core.Settings{
				DefaultAudioQuality: core.AudioQuality192,
				DefaultVideoQuality: core.VideoQuality1080p,
			},
			outputTemplate: filepath.Join("/home/user", "%(title)s.%(ext)s"),
			wantContains: append(append([]string{}, commonFlags...),
				"-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4", "--remux-video", "mp4"),
			wantPair: map[string]string{
				"-o":            filepath.Join("/home/user", "%(title)s.%(ext)s"),
				"--format-sort": "vcodec:h264,acodec:aac",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			args := d.buildDownloadArgs(tt.item, tt.settings, tt.outputTemplate)
			argsMap := make(map[string]bool)
			for _, a := range args {
				argsMap[a] = true
			}
			for _, s := range tt.wantContains {
				if !argsMap[s] {
					t.Errorf("buildDownloadArgs() missing %q, got %v", s, args)
				}
			}
			for key, val := range tt.wantPair {
				found := false
				for j := 0; j < len(args)-1; j++ {
					if args[j] == key && args[j+1] == val {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("buildDownloadArgs() missing pair %q %q, got %v", key, val, args)
				}
			}
		})
	}
}

func TestScanLinesOrCR_edgeCases(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []string
	}{
		{"empty input", "", nil},
		{"single line with no terminator", "no newline", []string{"no newline"}},
		{"only CR characters", "a\rb\rc\r", []string{"a", "b", "c"}},
		{"very long line", strings.Repeat("x", 100000) + "\n", []string{strings.Repeat("x", 100000)}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			scanner := bufio.NewScanner(strings.NewReader(tt.input))
			scanner.Split(scanLinesOrCR)
			scanner.Buffer(nil, 1024*1024)
			var got []string
			for scanner.Scan() {
				got = append(got, scanner.Text())
			}
			if len(got) != len(tt.want) {
				t.Fatalf("got %d lines, want %d: %v", len(got), len(tt.want), got)
			}
			for i := range tt.want {
				if got[i] != tt.want[i] {
					t.Errorf("line %d = %q, want %q", i, got[i], tt.want[i])
				}
			}
		})
	}
}

func TestParseSizeString_edgeCases(t *testing.T) {
	tests := []struct {
		name string
		s    string
		want int64
	}{
		{"empty string", "", 0},
		{"only spaces", "   ", 0},
		{"0MiB", "0MiB", 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := parseSizeString(tt.s)
			if got != tt.want {
				t.Errorf("parseSizeString(%q) = %v, want %v", tt.s, got, tt.want)
			}
		})
	}
}

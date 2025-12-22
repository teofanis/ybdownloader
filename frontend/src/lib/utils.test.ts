import { describe, it, expect } from "vitest";
import {
  cn,
  formatBytes,
  formatDuration,
  formatETA,
  isValidYouTubeURL,
  extractVideoId,
  truncate,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(10485760)).toBe("10 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("respects decimals parameter", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 3)).toBe("1.5 KB");
  });
});

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("0:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3599)).toBe("59:59");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(7325)).toBe("2:02:05");
  });

  it("pads single digit seconds and minutes", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3665)).toBe("1:01:05");
  });
});

describe("formatETA", () => {
  it("handles negative values", () => {
    expect(formatETA(-1)).toBe("...");
  });

  it("handles infinity", () => {
    expect(formatETA(Infinity)).toBe("...");
  });

  it("formats seconds", () => {
    expect(formatETA(30)).toBe("30s");
    expect(formatETA(59)).toBe("59s");
  });

  it("formats minutes and seconds", () => {
    expect(formatETA(90)).toBe("1m 30s");
    expect(formatETA(300)).toBe("5m 0s");
  });

  it("formats hours and minutes", () => {
    expect(formatETA(3700)).toBe("1h 2m");
    expect(formatETA(7200)).toBe("2h 0m");
  });
});

describe("isValidYouTubeURL", () => {
  it("validates standard watch URLs", () => {
    expect(
      isValidYouTubeURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe(true);
    expect(isValidYouTubeURL("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      true
    );
    expect(
      isValidYouTubeURL("http://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe(true);
  });

  it("validates short URLs", () => {
    expect(isValidYouTubeURL("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  });

  it("validates shorts URLs", () => {
    expect(
      isValidYouTubeURL("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    ).toBe(true);
  });

  it("validates embed URLs", () => {
    expect(isValidYouTubeURL("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      true
    );
  });

  it("validates music.youtube.com URLs", () => {
    expect(
      isValidYouTubeURL("https://music.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidYouTubeURL("")).toBe(false);
    expect(isValidYouTubeURL("https://google.com")).toBe(false);
    expect(isValidYouTubeURL("https://youtube.com")).toBe(false);
    expect(isValidYouTubeURL("https://youtube.com/watch?v=abc")).toBe(false); // Too short
    expect(isValidYouTubeURL("not a url")).toBe(false);
  });
});

describe("extractVideoId", () => {
  it("extracts from standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts from short URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts from shorts URL", () => {
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts from embed URL", () => {
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts from music URL", () => {
    expect(
      extractVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid URLs", () => {
    expect(extractVideoId("")).toBe(null);
    expect(extractVideoId("https://google.com")).toBe(null);
    expect(extractVideoId("invalid")).toBe(null);
  });
});

describe("truncate", () => {
  it("returns original string if shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns original string if equal to max", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("handles very short max values", () => {
    expect(truncate("hello", 4)).toBe("h...");
  });
});

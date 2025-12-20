import { describe, it, expect } from 'vitest';
import {
  cn,
  isValidYouTubeURL,
  extractVideoId,
  formatBytes,
  formatDuration,
  formatETA,
  truncate,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('isValidYouTubeURL', () => {
  it('validates standard watch URLs', () => {
    expect(isValidYouTubeURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeURL('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('validates youtu.be short URLs', () => {
    expect(isValidYouTubeURL('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('validates shorts URLs', () => {
    expect(isValidYouTubeURL('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });

  it('validates music URLs', () => {
    expect(isValidYouTubeURL('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidYouTubeURL('https://vimeo.com/123456')).toBe(false);
    expect(isValidYouTubeURL('not a url')).toBe(false);
    expect(isValidYouTubeURL('')).toBe(false);
  });
});

describe('extractVideoId', () => {
  it('extracts from watch URLs', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from short URLs', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts from shorts URLs', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URLs', () => {
    expect(extractVideoId('https://vimeo.com/123456')).toBeNull();
    expect(extractVideoId('not a url')).toBeNull();
  });
});

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('formats hours correctly', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});

describe('formatETA', () => {
  it('formats ETA correctly', () => {
    expect(formatETA(0)).toBe('0s');
    expect(formatETA(59)).toBe('59s');
    expect(formatETA(60)).toBe('1m 0s');
    expect(formatETA(125)).toBe('2m 5s');
    expect(formatETA(3661)).toBe('1h 1m');
  });
});

describe('truncate', () => {
  it('returns short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles edge cases', () => {
    expect(truncate('', 10)).toBe('');
    expect(truncate('abc', 3)).toBe('abc');
  });
});


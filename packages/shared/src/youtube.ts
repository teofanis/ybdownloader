const YT_PATTERNS = [
  /youtube\.com\/watch\?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
  /music\.youtube\.com\/watch\?v=([\w-]{11})/,
];

export function extractVideoId(url: string): string | null {
  for (const pattern of YT_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function isValidYouTubeURL(url: string): boolean {
  return extractVideoId(url) !== null;
}

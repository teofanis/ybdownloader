/**
 * Sample video URLs by provider.
 * Extend when the app supports more sites than YouTube.
 */
export const VIDEO_SAMPLES = {
  youtube: {
    valid: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    validShort: "https://youtu.be/dQw4w9WgXcQ",
    invalid: "https://example.com/not-a-video",
    malformed: "not-a-url",
  },
} as const;

export type VideoProvider = keyof typeof VIDEO_SAMPLES;

export function sampleVideoUrl(provider: VideoProvider = "youtube"): string {
  return VIDEO_SAMPLES[provider].valid;
}

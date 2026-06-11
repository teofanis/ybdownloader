export interface AudioStream {
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate: number;
}

export interface VideoStream {
  codec: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

export interface MediaInfo {
  duration: number;
  format: string;
  size: number;
  bitrate: number;
  videoStream?: VideoStream;
  audioStream?: AudioStream;
}

export interface TrimOptions {
  startTime: number;
  endTime: number;
}

export interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  outputExt: string;
  ffmpegArgs?: string[];
  options?: Record<string, unknown>;
}

export interface ConversionJob {
  id: string;
  inputPath: string;
  outputPath: string;
  presetId?: string;
  customArgs?: string[];
  trimOptions?: TrimOptions;
  state: string;
  progress: number;
  duration?: number;
  currentTime?: number;
  error?: string;
  inputInfo?: MediaInfo;
}

export interface ConversionProgress {
  jobId: string;
  state: string;
  progress: number;
  speed: number;
  error?: string;
}

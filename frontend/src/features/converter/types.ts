export interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  outputExt: string;
}

export interface MediaInfo {
  duration: number;
  format: string;
  size: number;
  bitrate: number;
  videoStream?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
  };
  audioStream?: {
    codec: string;
    channels: number;
    sampleRate: number;
  };
}

export interface ConversionJob {
  id: string;
  inputPath: string;
  outputPath: string;
  presetId?: string;
  state: string;
  progress: number;
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

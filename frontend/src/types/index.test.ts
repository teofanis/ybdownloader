import { describe, it, expect } from 'vitest';
import {
  isTerminalState,
  isActiveState,
  isAudioFormat,
} from './index';
import type { DownloadState, Format } from './index';

describe('isTerminalState', () => {
  it('returns true for terminal states', () => {
    const terminalStates: DownloadState[] = ['completed', 'failed', 'cancelled'];
    terminalStates.forEach((state) => {
      expect(isTerminalState(state)).toBe(true);
    });
  });

  it('returns false for non-terminal states', () => {
    const nonTerminalStates: DownloadState[] = [
      'queued',
      'fetching_metadata',
      'ready',
      'downloading',
      'converting',
      'cancel_requested',
    ];
    nonTerminalStates.forEach((state) => {
      expect(isTerminalState(state)).toBe(false);
    });
  });
});

describe('isActiveState', () => {
  it('returns true for active states', () => {
    const activeStates: DownloadState[] = ['fetching_metadata', 'downloading', 'converting'];
    activeStates.forEach((state) => {
      expect(isActiveState(state)).toBe(true);
    });
  });

  it('returns false for inactive states', () => {
    const inactiveStates: DownloadState[] = [
      'queued',
      'ready',
      'completed',
      'failed',
      'cancelled',
    ];
    inactiveStates.forEach((state) => {
      expect(isActiveState(state)).toBe(false);
    });
  });

  it('returns true for cancel_requested (still active)', () => {
    expect(isActiveState('cancel_requested')).toBe(true);
  });
});

describe('isAudioFormat', () => {
  it('returns true for audio formats', () => {
    const audioFormats: Format[] = ['mp3', 'm4a'];
    audioFormats.forEach((format) => {
      expect(isAudioFormat(format)).toBe(true);
    });
  });

  it('returns false for video formats', () => {
    expect(isAudioFormat('mp4')).toBe(false);
  });
});


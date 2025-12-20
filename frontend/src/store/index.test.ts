import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';
import type { QueueItemWithProgress } from '@/types';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      queue: [],
      urlInput: '',
      selectedFormat: 'mp3',
      isAddingToQueue: false,
      settings: null,
      isSettingsLoading: false,
      activeTab: 'downloads',
      isInitialized: false,
    });
  });

  describe('queue management', () => {
    const mockItem: QueueItemWithProgress = {
      id: 'test-1',
      url: 'https://youtube.com/watch?v=test',
      state: 'queued',
      format: 'mp3',
      savePath: '/downloads',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('adds items to queue', () => {
      const { setQueue } = useAppStore.getState();
      setQueue([mockItem]);
      expect(useAppStore.getState().queue).toHaveLength(1);
      expect(useAppStore.getState().queue[0].id).toBe('test-1');
    });

    it('removes items from queue', () => {
      const { setQueue, removeQueueItem } = useAppStore.getState();
      setQueue([mockItem]);
      removeQueueItem('test-1');
      expect(useAppStore.getState().queue).toHaveLength(0);
    });

    it('updates queue items', () => {
      const { setQueue, updateQueueItem } = useAppStore.getState();
      setQueue([mockItem]);
      updateQueueItem('test-1', { state: 'downloading' });
      expect(useAppStore.getState().queue[0].state).toBe('downloading');
    });
  });

  describe('URL input', () => {
    it('sets URL input', () => {
      const { setUrlInput } = useAppStore.getState();
      setUrlInput('https://youtube.com/watch?v=test');
      expect(useAppStore.getState().urlInput).toBe('https://youtube.com/watch?v=test');
    });

    it('resets URL input', () => {
      const { setUrlInput, resetUrlInput } = useAppStore.getState();
      setUrlInput('https://youtube.com/watch?v=test');
      resetUrlInput();
      expect(useAppStore.getState().urlInput).toBe('');
    });
  });

  describe('format selection', () => {
    it('sets selected format', () => {
      const { setSelectedFormat } = useAppStore.getState();
      setSelectedFormat('mp4');
      expect(useAppStore.getState().selectedFormat).toBe('mp4');
    });
  });

  describe('settings', () => {
    it('sets settings', () => {
      const { setSettings } = useAppStore.getState();
      const mockSettings = {
        version: 1,
        defaultSavePath: '/downloads',
        defaultFormat: 'mp3' as const,
        defaultAudioQuality: '192' as const,
        defaultVideoQuality: '720p' as const,
        maxConcurrentDownloads: 2,
      };
      setSettings(mockSettings);
      expect(useAppStore.getState().settings?.defaultSavePath).toBe('/downloads');
    });
  });

  describe('tab navigation', () => {
    it('sets active tab', () => {
      const { setActiveTab } = useAppStore.getState();
      setActiveTab('settings');
      expect(useAppStore.getState().activeTab).toBe('settings');
    });
  });
});


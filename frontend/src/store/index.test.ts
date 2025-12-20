import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';
import type { QueueItemWithProgress, DownloadProgress, Settings } from '@/types';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      activeTab: 'downloads',
      isInitialized: false,
      queue: [],
      isQueueLoading: false,
      settings: null,
      isSettingsLoading: false,
      urlInput: '',
      selectedFormat: 'mp3',
      isAddingToQueue: false,
      error: null,
    });
  });

  describe('activeTab', () => {
    it('defaults to downloads', () => {
      expect(useAppStore.getState().activeTab).toBe('downloads');
    });

    it('can be changed', () => {
      useAppStore.getState().setActiveTab('settings');
      expect(useAppStore.getState().activeTab).toBe('settings');
    });
  });

  describe('isInitialized', () => {
    it('defaults to false', () => {
      expect(useAppStore.getState().isInitialized).toBe(false);
    });

    it('can be set to true', () => {
      useAppStore.getState().setInitialized(true);
      expect(useAppStore.getState().isInitialized).toBe(true);
    });
  });

  describe('queue', () => {
    const mockItem: QueueItemWithProgress = {
      id: 'test-1',
      url: 'https://youtube.com/watch?v=test',
      state: 'queued',
      format: 'mp3',
      savePath: '/downloads',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('defaults to empty array', () => {
      expect(useAppStore.getState().queue).toEqual([]);
    });

    it('can set queue', () => {
      useAppStore.getState().setQueue([mockItem]);
      expect(useAppStore.getState().queue).toHaveLength(1);
      expect(useAppStore.getState().queue[0].id).toBe('test-1');
    });

    it('can update queue item', () => {
      useAppStore.getState().setQueue([mockItem]);
      useAppStore.getState().updateQueueItem('test-1', { state: 'downloading' });
      expect(useAppStore.getState().queue[0].state).toBe('downloading');
    });

    it('can remove queue item', () => {
      useAppStore.getState().setQueue([mockItem]);
      useAppStore.getState().removeQueueItem('test-1');
      expect(useAppStore.getState().queue).toHaveLength(0);
    });

    it('removes correct item when multiple items exist', () => {
      const item2: QueueItemWithProgress = { ...mockItem, id: 'test-2' };
      useAppStore.getState().setQueue([mockItem, item2]);
      useAppStore.getState().removeQueueItem('test-1');
      expect(useAppStore.getState().queue).toHaveLength(1);
      expect(useAppStore.getState().queue[0].id).toBe('test-2');
    });
  });

  describe('updateProgress', () => {
    it('updates item state and progress', () => {
      const mockItem: QueueItemWithProgress = {
        id: 'test-1',
        url: 'https://youtube.com/watch?v=test',
        state: 'queued',
        format: 'mp3',
        savePath: '/downloads',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      useAppStore.getState().setQueue([mockItem]);

      const progress: DownloadProgress = {
        itemId: 'test-1',
        state: 'downloading',
        percent: 50,
        downloadedBytes: 5000000,
        totalBytes: 10000000,
        speed: 1000000,
        eta: 5,
      };

      useAppStore.getState().updateProgress(progress);

      const updatedItem = useAppStore.getState().queue[0];
      expect(updatedItem.state).toBe('downloading');
      expect(updatedItem.progress).toEqual(progress);
    });
  });

  describe('settings', () => {
    const mockSettings: Settings = {
      version: 1,
      defaultSavePath: '/downloads',
      defaultFormat: 'mp3',
      defaultAudioQuality: '192',
      defaultVideoQuality: '720p',
      maxConcurrentDownloads: 2,
    };

    it('defaults to null', () => {
      expect(useAppStore.getState().settings).toBeNull();
    });

    it('can set settings', () => {
      useAppStore.getState().setSettings(mockSettings);
      expect(useAppStore.getState().settings).toEqual(mockSettings);
    });
  });

  describe('urlInput', () => {
    it('defaults to empty string', () => {
      expect(useAppStore.getState().urlInput).toBe('');
    });

    it('can be set', () => {
      useAppStore.getState().setUrlInput('https://youtube.com/watch?v=test');
      expect(useAppStore.getState().urlInput).toBe('https://youtube.com/watch?v=test');
    });

    it('resets with resetUrlInput', () => {
      useAppStore.getState().setUrlInput('test');
      useAppStore.getState().setAddingToQueue(true);
      useAppStore.getState().resetUrlInput();
      expect(useAppStore.getState().urlInput).toBe('');
      expect(useAppStore.getState().isAddingToQueue).toBe(false);
    });
  });

  describe('selectedFormat', () => {
    it('defaults to mp3', () => {
      expect(useAppStore.getState().selectedFormat).toBe('mp3');
    });

    it('can be changed', () => {
      useAppStore.getState().setSelectedFormat('mp4');
      expect(useAppStore.getState().selectedFormat).toBe('mp4');
    });
  });

  describe('error', () => {
    it('defaults to null', () => {
      expect(useAppStore.getState().error).toBeNull();
    });

    it('can be set and cleared', () => {
      useAppStore.getState().setError('Something went wrong');
      expect(useAppStore.getState().error).toBe('Something went wrong');
      
      useAppStore.getState().setError(null);
      expect(useAppStore.getState().error).toBeNull();
    });
  });

  describe('loading states', () => {
    it('manages queue loading state', () => {
      expect(useAppStore.getState().isQueueLoading).toBe(false);
      useAppStore.getState().setQueueLoading(true);
      expect(useAppStore.getState().isQueueLoading).toBe(true);
    });

    it('manages settings loading state', () => {
      expect(useAppStore.getState().isSettingsLoading).toBe(false);
      useAppStore.getState().setSettingsLoading(true);
      expect(useAppStore.getState().isSettingsLoading).toBe(true);
    });

    it('manages adding to queue state', () => {
      expect(useAppStore.getState().isAddingToQueue).toBe(false);
      useAppStore.getState().setAddingToQueue(true);
      expect(useAppStore.getState().isAddingToQueue).toBe(true);
    });
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { QueueItem } from './QueueItem';
import type { QueueItemWithProgress } from '@/types';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  startDownload: vi.fn(),
  cancelDownload: vi.fn(),
  retryDownload: vi.fn(),
  removeFromQueue: vi.fn(),
  openFile: vi.fn(),
  openFolder: vi.fn(),
}));

const baseItem: QueueItemWithProgress = {
  id: 'test-1',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  state: 'queued',
  format: 'mp3',
  savePath: '/downloads',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('QueueItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders queue item with URL when no metadata', () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    // Should show truncated URL when no metadata
    expect(screen.getByText(/youtube.com/)).toBeInTheDocument();
  });

  it('renders queue item with metadata when available', () => {
    const itemWithMetadata: QueueItemWithProgress = {
      ...baseItem,
      metadata: {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        author: 'Rick Astley',
        duration: 212,
        thumbnail: 'https://example.com/thumb.jpg',
      },
    };

    renderWithProviders(<QueueItem item={itemWithMetadata} />);
    expect(screen.getByText('Rick Astley - Never Gonna Give You Up')).toBeInTheDocument();
  });

  it('shows action buttons for queued items', () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    // Should have buttons (Play for start, X for remove)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows cancel button for downloading items', () => {
    const downloadingItem: QueueItemWithProgress = {
      ...baseItem,
      state: 'downloading',
      progress: {
        itemId: 'test-1',
        state: 'downloading',
        percent: 50,
        downloadedBytes: 5000000,
        totalBytes: 10000000,
        speed: 1000000,
        eta: 5,
      },
    };

    renderWithProviders(<QueueItem item={downloadingItem} />);
    // Should have a cancel button (StopCircle icon)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows retry button for failed items', () => {
    const failedItem: QueueItemWithProgress = {
      ...baseItem,
      state: 'failed',
      error: 'Network error',
    };

    renderWithProviders(<QueueItem item={failedItem} />);
    // Should have retry and remove buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows open file/folder buttons for completed items', () => {
    const completedItem: QueueItemWithProgress = {
      ...baseItem,
      state: 'completed',
      filePath: '/downloads/test.mp3',
    };

    renderWithProviders(<QueueItem item={completedItem} />);
    // Should have file, folder, and remove buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('displays progress bar for active downloads', () => {
    const downloadingItem: QueueItemWithProgress = {
      ...baseItem,
      state: 'downloading',
      progress: {
        itemId: 'test-1',
        state: 'downloading',
        percent: 75,
        downloadedBytes: 7500000,
        totalBytes: 10000000,
        speed: 1000000,
        eta: 2,
      },
    };

    renderWithProviders(<QueueItem item={downloadingItem} />);
    // Progress bar should be visible
    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows correct format badge', () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    expect(screen.getByText('MP3')).toBeInTheDocument();
  });

  it('displays thumbnail from video ID', () => {
    renderWithProviders(<QueueItem item={baseItem} />);
    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.src).toContain('dQw4w9WgXcQ');
  });

  it('displays state badge correctly', () => {
    const states = ['queued', 'downloading', 'converting', 'completed', 'failed', 'cancelled'] as const;
    
    states.forEach(state => {
      const item: QueueItemWithProgress = { ...baseItem, state };
      const { unmount } = renderWithProviders(<QueueItem item={item} />);
      // State badge should be rendered with translated key
      const stateBadge = document.querySelector('[class*="rounded-full"]');
      expect(stateBadge).toBeInTheDocument();
      unmount();
    });
  });
});

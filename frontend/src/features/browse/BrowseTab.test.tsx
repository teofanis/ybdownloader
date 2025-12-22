import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

// Default mock state for the store
const createMockState = (overrides = {}) => ({
  selectedFormat: "mp3",
  setSelectedFormat: vi.fn(),
  browseSearchQuery: "",
  setBrowseSearchQuery: vi.fn(),
  browseResults: [],
  setBrowseResults: vi.fn(),
  browseActiveTab: "search" as const,
  setBrowseActiveTab: vi.fn(),
  ...overrides,
});

let mockState = createMockState();

// Mock zustand store with browse state
vi.mock("@/store", () => ({
  useAppStore: vi.fn((selector) => selector(mockState)),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Wails runtime (uses path from test file location)
vi.mock("../../../wailsjs/runtime/runtime", () => ({
  BrowserOpenURL: vi.fn(),
}));

const mockSearchResults = [
  {
    id: "video1",
    title: "Test Video 1",
    author: "Test Author 1",
    duration: "3:45",
    durationSec: 225,
    thumbnail: "https://example.com/thumb1.jpg",
    viewCount: "1.2M views",
    publishedAt: "2 days ago",
    url: "https://www.youtube.com/watch?v=video1",
  },
  {
    id: "video2",
    title: "Test Video 2",
    author: "Test Author 2",
    duration: "10:30",
    durationSec: 630,
    thumbnail: "https://example.com/thumb2.jpg",
    viewCount: "500K views",
    publishedAt: "1 week ago",
    url: "https://www.youtube.com/watch?v=video2",
  },
];

// Mock API
vi.mock("@/lib/api", () => ({
  searchYouTube: vi.fn(() =>
    Promise.resolve({ results: mockSearchResults, query: "test" })
  ),
  getTrendingVideos: vi.fn(() =>
    Promise.resolve({ results: mockSearchResults, query: "trending" })
  ),
  addToQueue: vi.fn(() => Promise.resolve({ id: "queue-1" })),
}));

// Import after mocks
import { BrowseTab } from "./BrowseTab";
import * as api from "@/lib/api";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

describe("BrowseTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = createMockState();
  });

  it("renders browse tab with search input", () => {
    renderWithProviders(<BrowseTab />);
    expect(
      screen.getByPlaceholderText("browse.searchPlaceholder")
    ).toBeInTheDocument();
  });

  it("loads trending videos on mount", async () => {
    renderWithProviders(<BrowseTab />);

    await waitFor(() => {
      expect(api.getTrendingVideos).toHaveBeenCalledWith("US", 20);
    });
  });

  it("displays search results after searching", async () => {
    mockState = createMockState({
      browseSearchQuery: "test query",
      browseResults: mockSearchResults,
      browseActiveTab: "search",
    });

    renderWithProviders(<BrowseTab />);

    await waitFor(() => {
      expect(screen.getByText("Test Video 1")).toBeInTheDocument();
      expect(screen.getByText("Test Video 2")).toBeInTheDocument();
    });
  });

  it("displays video cards with correct information", async () => {
    mockState = createMockState({
      browseResults: mockSearchResults,
      browseActiveTab: "trending",
    });

    renderWithProviders(<BrowseTab />);

    // Check video card content
    expect(screen.getByText("Test Video 1")).toBeInTheDocument();
    expect(screen.getByText("Test Author 1")).toBeInTheDocument();
    expect(screen.getByText("3:45")).toBeInTheDocument();
    expect(screen.getByText("1.2M views")).toBeInTheDocument();
  });

  it("shows add to queue buttons on video cards", async () => {
    mockState = createMockState({
      browseResults: mockSearchResults,
      browseActiveTab: "trending",
    });

    renderWithProviders(<BrowseTab />);

    // Video cards should have add buttons (visible on hover, but in DOM)
    const addButtons = screen.getAllByRole("button");
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it("calls addToQueue when add button is clicked", async () => {
    mockState = createMockState({
      browseResults: mockSearchResults,
      browseActiveTab: "trending",
    });

    renderWithProviders(<BrowseTab />);

    // Find the first add button (Plus icon button)
    const cards = document.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThan(0);

    // The add button should be inside the card overlay
    const firstCard = cards[0];
    const addButton = firstCard.querySelector("button");

    if (addButton) {
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(api.addToQueue).toHaveBeenCalled();
      });
    }
  });

  it("calls BrowserOpenURL when open in browser button is clicked", async () => {
    mockState = createMockState({
      browseResults: mockSearchResults,
      browseActiveTab: "trending",
    });

    renderWithProviders(<BrowseTab />);

    // Find the second button in first card (external link)
    const cards = document.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThan(0);

    const firstCard = cards[0];
    const buttons = firstCard.querySelectorAll("button");
    const openButton = buttons[1]; // Second button is open in browser

    if (openButton) {
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(BrowserOpenURL).toHaveBeenCalledWith(mockSearchResults[0].url);
      });
    }
  });

  it("shows trending tab button", () => {
    renderWithProviders(<BrowseTab />);
    expect(screen.getByText("browse.trending")).toBeInTheDocument();
  });

  it("shows search results tab button", () => {
    renderWithProviders(<BrowseTab />);
    expect(screen.getByText("browse.searchResults")).toBeInTheDocument();
  });

  it("shows format selector", () => {
    renderWithProviders(<BrowseTab />);
    // Format selector should be present
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("disables search button when input is empty", () => {
    renderWithProviders(<BrowseTab />);
    const searchButton = screen.getByRole("button", {
      name: /browse.openYoutube/i,
    });
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when input has text", async () => {
    mockState = createMockState({
      browseSearchQuery: "test",
    });

    renderWithProviders(<BrowseTab />);

    const searchButton = screen.getByRole("button", {
      name: /browse.openYoutube/i,
    });
    expect(searchButton).not.toBeDisabled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { mockToast } from "@/test/mocks";
import { UrlInput } from "./UrlInput";
import * as api from "@/lib/api";
let mockUrlInput = "";
const setUrlInput = vi.fn((value: string) => {
  mockUrlInput = value;
});
const resetUrlInput = vi.fn(() => {
  mockUrlInput = "";
});

vi.mock("@/store", () => ({
  useAppStore: vi.fn(
    (
      selector: (state: {
        urlInput: string;
        setUrlInput: typeof setUrlInput;
        selectedFormat: string;
        setSelectedFormat: ReturnType<typeof vi.fn>;
        isAddingToQueue: boolean;
        setAddingToQueue: ReturnType<typeof vi.fn>;
        resetUrlInput: typeof resetUrlInput;
      }) => unknown
    ) =>
      selector({
        urlInput: mockUrlInput,
        setUrlInput,
        selectedFormat: "mp3",
        setSelectedFormat: vi.fn(),
        isAddingToQueue: false,
        setAddingToQueue: vi.fn(),
        resetUrlInput,
      })
  ),
}));

vi.mock("@/lib/api", () => ({
  addToQueue: vi.fn(),
  importURLs: vi.fn(),
}));

describe("UrlInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUrlInput = "";
    vi.mocked(api.addToQueue).mockResolvedValue(undefined);
  });

  it("shows validation error for invalid url", async () => {
    mockUrlInput = "not-a-url";
    renderWithProviders(<UrlInput />);

    fireEvent.click(
      screen.getByRole("button", { name: /downloads.addToQueue/ })
    );

    await waitFor(() => {
      expect(screen.getByText("toasts.invalidUrlDesc")).toBeInTheDocument();
    });
    expect(api.addToQueue).not.toHaveBeenCalled();
  });

  it("adds valid youtube url to queue", async () => {
    mockUrlInput = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    renderWithProviders(<UrlInput />);

    fireEvent.click(
      screen.getByRole("button", { name: /downloads.addToQueue/ })
    );

    await waitFor(() => {
      expect(api.addToQueue).toHaveBeenCalledWith(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "mp3"
      );
    });
    expect(mockToast).toHaveBeenCalledWith({ title: "toasts.addedToQueue" });
  });

  it("rejects empty input", async () => {
    mockUrlInput = "   ";
    renderWithProviders(<UrlInput />);

    fireEvent.keyDown(screen.getByLabelText("YouTube URL"), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(screen.getByText("toasts.invalidUrlDesc")).toBeInTheDocument();
    });
  });

  it("submits on enter key", async () => {
    mockUrlInput = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    renderWithProviders(<UrlInput />);

    fireEvent.keyDown(screen.getByLabelText("YouTube URL"), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(api.addToQueue).toHaveBeenCalled();
    });
  });

  it("imports urls from a text file", async () => {
    vi.mocked(api.importURLs).mockResolvedValue({
      added: 2,
      skipped: 0,
      invalid: 0,
    });

    renderWithProviders(<UrlInput />);
    const file = new File(
      ["https://www.youtube.com/watch?v=a\nhttps://www.youtube.com/watch?v=b"],
      "urls.txt",
      { type: "text/plain" }
    );

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.importURLs).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "downloads.importSuccess",
        description: undefined,
      });
    });
  });

  it("shows skipped and invalid counts after import", async () => {
    vi.mocked(api.importURLs).mockResolvedValue({
      added: 1,
      skipped: 2,
      invalid: 1,
    });

    renderWithProviders(<UrlInput />);
    const file = new File(["https://www.youtube.com/watch?v=a"], "urls.txt", {
      type: "text/plain",
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "downloads.importSuccess",
        description: "downloads.importSkipped",
      });
    });
  });

  it("reports duplicate-only imports", async () => {
    vi.mocked(api.importURLs).mockResolvedValue({
      added: 0,
      skipped: 3,
      invalid: 0,
    });

    renderWithProviders(<UrlInput />);
    const file = new File(["https://www.youtube.com/watch?v=a"], "urls.txt", {
      type: "text/plain",
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "downloads.importEmpty",
        description: "downloads.importAllDuplicates",
      });
    });
  });

  it("reports when no valid urls were imported", async () => {
    vi.mocked(api.importURLs).mockResolvedValue({
      added: 0,
      skipped: 0,
      invalid: 2,
    });

    renderWithProviders(<UrlInput />);
    const file = new File(["not-valid"], "urls.txt", { type: "text/plain" });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "downloads.importEmpty",
        description: "downloads.importNoValid",
        variant: "destructive",
      });
    });
  });

  it("rejects empty import files", async () => {
    renderWithProviders(<UrlInput />);
    const file = new File(["\n  \n"], "urls.txt", { type: "text/plain" });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.importURLs).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "downloads.importEmpty",
        variant: "destructive",
      });
    });
  });

  it("handles import failures", async () => {
    vi.mocked(api.importURLs).mockRejectedValue(new Error("import failed"));

    renderWithProviders(<UrlInput />);
    const file = new File(["https://www.youtube.com/watch?v=a"], "urls.txt", {
      type: "text/plain",
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "errors.generic",
        variant: "destructive",
      });
    });
  });

  it("surfaces add-to-queue failures", async () => {
    vi.mocked(api.addToQueue).mockRejectedValue(new Error("queue full"));
    mockUrlInput = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    renderWithProviders(<UrlInput />);

    fireEvent.click(
      screen.getByRole("button", { name: /downloads.addToQueue/ })
    );

    await waitFor(() => {
      expect(screen.getByText("queue full")).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith({
        title: "errors.generic",
        description: "queue full",
        variant: "destructive",
      });
    });
  });

  it("updates url input on change", () => {
    renderWithProviders(<UrlInput />);
    fireEvent.change(screen.getByLabelText("YouTube URL"), {
      target: { value: "https://youtu.be/abc" },
    });
    expect(setUrlInput).toHaveBeenCalledWith("https://youtu.be/abc");
  });

  it("opens file picker from import button", () => {
    renderWithProviders(<UrlInput />);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.click(screen.getByRole("button", { name: "" }));

    expect(clickSpy).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@/test/test-utils";
import { mockUpdateInfo } from "@/test/fixtures";
import { AboutTab } from "./AboutTab";
import * as api from "@/lib/api";
import { useAppStore } from "@/store";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

const mockSettings = {
  version: 3,
  defaultSavePath: "/music",
  defaultFormat: "mp3",
  defaultAudioQuality: "192",
  defaultVideoQuality: "720p",
  maxConcurrentDownloads: 2,
  downloadBackend: "yt-dlp" as const,
  updateChannel: "stable" as const,
};

vi.mock("@/lib/api", () => ({
  getAppVersion: vi.fn(),
  checkForUpdate: vi.fn(),
  downloadUpdate: vi.fn(),
  getUpdateInfo: vi.fn(),
  installUpdate: vi.fn(),
  openReleasePage: vi.fn(),
  saveSettings: vi.fn(),
}));

describe("AboutTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ updateInfo: null, settings: mockSettings });
    vi.mocked(api.getAppVersion).mockResolvedValue("1.2.3");
    vi.mocked(api.getUpdateInfo).mockResolvedValue(
      mockUpdateInfo({ status: "idle" })
    );
    vi.mocked(api.checkForUpdate).mockResolvedValue(mockUpdateInfo());
  });

  it("loads and displays app version", async () => {
    renderWithProviders(<AboutTab />);

    await waitFor(() => {
      expect(screen.getAllByText("v1.2.3").length).toBeGreaterThan(0);
    });
  });

  it("checks for updates", async () => {
    renderWithProviders(<AboutTab />);

    fireEvent.click(
      screen.getByRole("button", { name: "about.update.checkNow" })
    );

    await waitFor(() => {
      expect(api.checkForUpdate).toHaveBeenCalled();
    });
  });

  it("shows download actions when update info is already in the store", async () => {
    useAppStore.setState({
      updateInfo: mockUpdateInfo({
        status: "available",
        latestVersion: "2.0.0",
        releaseNotes: "Bug fixes",
      }),
    });

    renderWithProviders(<AboutTab />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "about.update.downloadNow" })
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "about.update.checkNow" })
    ).not.toBeInTheDocument();
  });

  it("falls back to opening release page in browser", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(
      mockUpdateInfo({
        status: "available",
        latestVersion: "2.0.0",
        releaseNotes: "Bug fixes",
      })
    );
    vi.mocked(api.openReleasePage).mockRejectedValue(new Error("no handler"));

    renderWithProviders(<AboutTab />);
    fireEvent.click(
      screen.getByRole("button", { name: "about.update.checkNow" })
    );

    const releaseButton = await screen.findByRole("button", {
      name: "about.update.viewRelease",
    });
    fireEvent.click(releaseButton);

    await waitFor(() => {
      expect(BrowserOpenURL).toHaveBeenCalled();
    });
  });
});

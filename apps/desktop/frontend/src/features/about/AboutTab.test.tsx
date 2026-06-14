import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from "@/test/test-utils";
import { mockUpdateInfo } from "@/test/fixtures";
import { mockToast } from "@/test/mocks";
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

  it("hydrates update info from the backend when the store is idle", async () => {
    const cached = mockUpdateInfo({
      status: "available",
      latestVersion: "2.0.0",
    });
    vi.mocked(api.getUpdateInfo).mockResolvedValue(cached);

    renderWithProviders(<AboutTab />);

    await waitFor(() => {
      expect(useAppStore.getState().updateInfo).toEqual(cached);
    });
  });

  it("skips backend hydration when update info is already cached", async () => {
    useAppStore.setState({
      updateInfo: mockUpdateInfo({
        status: "available",
        latestVersion: "2.0.0",
      }),
    });

    renderWithProviders(<AboutTab />);

    await waitFor(() => {
      expect(api.getAppVersion).toHaveBeenCalled();
    });
    expect(api.getUpdateInfo).not.toHaveBeenCalled();
  });

  it("shows a toast when the app is up to date", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(
      mockUpdateInfo({ status: "up_to_date" })
    );

    renderWithProviders(<AboutTab />);
    fireEvent.click(
      screen.getByRole("button", { name: "about.update.checkNow" })
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "about.update.upToDate",
        })
      );
    });
  });

  it("shows a toast when an update is available after checking", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(
      mockUpdateInfo({ status: "available", latestVersion: "2.0.0" })
    );

    renderWithProviders(<AboutTab />);
    fireEvent.click(
      screen.getByRole("button", { name: "about.update.checkNow" })
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "about.update.available",
        })
      );
    });
  });

  it("saves the beta channel and rechecks for updates", async () => {
    renderWithProviders(<AboutTab />);

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ updateChannel: "beta" })
      );
      expect(api.checkForUpdate).toHaveBeenCalled();
    });
  });

  it("downloads and installs updates from the about tab", async () => {
    useAppStore.setState({
      updateInfo: mockUpdateInfo({
        status: "available",
        latestVersion: "2.0.0",
      }),
    });
    vi.mocked(api.getUpdateInfo).mockResolvedValue(
      mockUpdateInfo({ status: "ready", latestVersion: "2.0.0" })
    );

    renderWithProviders(<AboutTab />);

    fireEvent.click(
      screen.getByRole("button", { name: "about.update.downloadNow" })
    );

    await waitFor(() => {
      expect(api.downloadUpdate).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "about.update.downloadComplete",
        })
      );
    });

    fireEvent.click(
      screen.getByRole("button", { name: "about.update.installNow" })
    );

    await waitFor(() => {
      expect(api.installUpdate).toHaveBeenCalled();
    });
  });

  it("shows an error toast when update checks fail", async () => {
    vi.mocked(api.checkForUpdate).mockRejectedValue(new Error("network down"));

    renderWithProviders(<AboutTab />);
    fireEvent.click(
      screen.getByRole("button", { name: "about.update.checkNow" })
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "errors.generic",
          variant: "destructive",
        })
      );
    });
  });
});

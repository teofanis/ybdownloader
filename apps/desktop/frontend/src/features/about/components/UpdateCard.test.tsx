import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/test-utils";
import { mockUpdateInfo } from "@/test/fixtures";
import { UpdateCard } from "./UpdateCard";

const defaultProps = {
  version: "1.0.0",
  updateInfo: null,
  updateChannel: "stable" as const,
  isChecking: false,
  isDownloading: false,
  isSavingChannel: false,
  onCheck: vi.fn(),
  onDownload: vi.fn(),
  onInstall: vi.fn(),
  onOpenReleasePage: vi.fn(),
  onUpdateChannelChange: vi.fn(),
};

describe("UpdateCard", () => {
  it("reflects the beta channel toggle state", () => {
    renderWithProviders(<UpdateCard {...defaultProps} updateChannel="beta" />);

    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("requests a channel change when the beta toggle is clicked", () => {
    const onUpdateChannelChange = vi.fn();
    renderWithProviders(
      <UpdateCard
        {...defaultProps}
        onUpdateChannelChange={onUpdateChannelChange}
      />
    );

    fireEvent.click(screen.getByRole("switch"));
    expect(onUpdateChannelChange).toHaveBeenCalledWith("beta");
  });

  it("shows a prerelease badge for beta updates", () => {
    renderWithProviders(
      <UpdateCard
        {...defaultProps}
        updateInfo={mockUpdateInfo({
          status: "available",
          latestVersion: "2.0.0-beta.1",
          prerelease: true,
        })}
      />
    );

    expect(
      screen.getByText("about.update.prereleaseBadge")
    ).toBeInTheDocument();
  });

  it("shows download progress while downloading", () => {
    renderWithProviders(
      <UpdateCard
        {...defaultProps}
        updateInfo={mockUpdateInfo({
          status: "downloading",
          progress: 42,
        })}
      />
    );

    expect(screen.getByText("about.update.downloading")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("shows install and release-note actions for ready and available states", () => {
    const { rerender } = renderWithProviders(
      <UpdateCard
        {...defaultProps}
        updateInfo={mockUpdateInfo({
          status: "available",
          latestVersion: "2.0.0",
          releaseNotes: "## Fixes",
        })}
      />
    );

    expect(
      screen.getByRole("button", { name: "about.update.downloadNow" })
    ).toBeInTheDocument();
    expect(screen.getByText("about.update.releaseNotes")).toBeInTheDocument();

    rerender(
      <UpdateCard
        {...defaultProps}
        updateInfo={mockUpdateInfo({ status: "ready", latestVersion: "2.0.0" })}
      />
    );

    expect(
      screen.getByRole("button", { name: "about.update.installNow" })
    ).toBeInTheDocument();
  });
});

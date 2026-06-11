import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { AboutTab } from "./AboutTab";
import * as api from "@/lib/api";
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";

vi.mock("@/lib/api", () => ({
  getAppVersion: vi.fn(),
  checkForUpdate: vi.fn(),
  downloadUpdate: vi.fn(),
  getUpdateInfo: vi.fn(),
  installUpdate: vi.fn(),
  openReleasePage: vi.fn(),
}));

describe("AboutTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAppVersion).mockResolvedValue("1.2.3");
    vi.mocked(api.checkForUpdate).mockResolvedValue({
      status: "up_to_date",
      latestVersion: "1.2.3",
    });
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

  it("falls back to opening release page in browser", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue({
      status: "available",
      latestVersion: "2.0.0",
      releaseNotes: "Bug fixes",
    });
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

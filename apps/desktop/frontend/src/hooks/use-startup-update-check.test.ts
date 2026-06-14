import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStartupUpdateCheck } from "./use-startup-update-check";
import { useAppStore } from "@/store";
import { mockToast } from "@/test/mocks";
import { mockUpdateInfo } from "@/test/fixtures";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  checkForUpdate: vi.fn(),
}));

describe("useStartupUpdateCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ activeTab: "downloads", updateInfo: null });
    vi.mocked(api.checkForUpdate).mockResolvedValue(mockUpdateInfo());
  });

  it("checks for updates once when enabled", async () => {
    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(api.checkForUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("does not check when disabled", async () => {
    renderHook(() => useStartupUpdateCheck(false));

    await waitFor(() => {
      expect(api.checkForUpdate).not.toHaveBeenCalled();
    });
  });

  it("shows a toast when an update is available", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(
      mockUpdateInfo({ status: "available", latestVersion: "2.0.0" })
    );

    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "about.update.available",
          description: expect.any(String),
          action: expect.anything(),
        })
      );
    });
  });

  it("does not show a toast when up to date", async () => {
    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(api.checkForUpdate).toHaveBeenCalled();
    });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it("stores update info in global state", async () => {
    const info = mockUpdateInfo({
      status: "available",
      latestVersion: "2.0.0",
    });
    vi.mocked(api.checkForUpdate).mockResolvedValue(info);

    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(useAppStore.getState().updateInfo).toEqual(info);
    });
  });

  it("navigates to the about tab when the toast action is clicked", async () => {
    vi.mocked(api.checkForUpdate).mockResolvedValue(
      mockUpdateInfo({ status: "available", latestVersion: "2.0.0" })
    );

    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    const toastCall = mockToast.mock.calls[0]?.[0];
    expect(toastCall?.action?.props.onClick).toBeTypeOf("function");
    toastCall.action.props.onClick();

    expect(useAppStore.getState().activeTab).toBe("about");
  });

  it("logs failures without showing a toast", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.checkForUpdate).mockRejectedValue(new Error("offline"));

    renderHook(() => useStartupUpdateCheck(true));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Startup update check failed:",
        expect.any(Error)
      );
    });
    expect(mockToast).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("ignores late results after unmount", async () => {
    let resolve!: (value: ReturnType<typeof mockUpdateInfo>) => void;
    vi.mocked(api.checkForUpdate).mockReturnValue(
      new Promise((res) => {
        resolve = res;
      })
    );

    const { unmount } = renderHook(() => useStartupUpdateCheck(true));
    unmount();
    resolve(mockUpdateInfo({ status: "available", latestVersion: "2.0.0" }));

    await waitFor(() => {
      expect(api.checkForUpdate).toHaveBeenCalled();
    });
    expect(mockToast).not.toHaveBeenCalled();
  });
});

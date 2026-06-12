import { test, expect } from "../../fixtures/extension-test";
import { VIDEO_SAMPLES } from "../../helpers/data";

test.describe("Extension popup", { tag: "@extension" }, () => {
  test("popup renders core UI", async ({ popup }) => {
    await expect(
      popup.getByRole("heading", { name: "YBDownloader" }),
    ).toBeVisible();
    await expect(popup.getByText("YouTube Download Helper")).toBeVisible();
    await expect(popup.getByPlaceholder("Paste YouTube URL...")).toBeVisible();
    await expect(
      popup.getByRole("button", { name: "Add to Queue" }),
    ).toBeVisible();
  });

  test("invalid URL shows error state", async ({ popup }) => {
    await popup
      .getByPlaceholder("Paste YouTube URL...")
      .fill(VIDEO_SAMPLES.youtube.invalid);
    await popup.getByRole("button", { name: "Add to Queue" }).click();
    await expect(popup.getByText("Invalid YouTube URL")).toBeVisible();
  });
});

import { test, expect } from "../../fixtures/test";
import {
  getMockedSettings,
  getMockedUpdateInfo,
} from "../../helpers/mock-runtime";
import { AboutPage } from "../../pages/about.page";

const availableUpdate = {
  status: "available",
  currentVersion: "0.0.0-e2e",
  latestVersion: "9.9.9",
  releaseNotes: "## E2E update",
  releaseUrl: "https://github.com/example/releases/tag/v9.9.9",
  downloadUrl: "https://github.com/example/releases/download/v9.9.9/app",
  downloadSize: 42_000_000,
  progress: 0,
  prerelease: false,
};

const upToDateUpdate = {
  status: "up_to_date",
  currentVersion: "0.0.0-e2e",
  latestVersion: "0.0.0-e2e",
  releaseNotes: "",
  releaseUrl: "",
  downloadUrl: "",
  downloadSize: 0,
  progress: 0,
  prerelease: false,
};

const betaAvailableUpdate = {
  status: "available",
  currentVersion: "0.0.0-e2e",
  latestVersion: "2.0.0-beta.1",
  releaseNotes: "## Beta build",
  releaseUrl: "https://github.com/example/releases/tag/v2.0.0-beta.1",
  downloadUrl: "https://github.com/example/releases/download/v2.0.0-beta.1/app",
  downloadSize: 40_000_000,
  progress: 0,
  prerelease: true,
};

test.describe("Updates", { tag: "@full" }, () => {
  test.describe("startup notification", () => {
    test.use({
      wailsMock: {
        checkForUpdate: availableUpdate,
      },
    });

    test("U01: shows update toast and navigates to About", async ({
      app,
      page,
    }) => {
      await app.goto();

      const about = new AboutPage(page);
      await expect(about.updateAvailableToast()).toBeVisible();
      await expect(about.updateAvailableDescription("9.9.9")).toBeVisible();

      await about.downloadUpdateToastAction().click();
      await app.expectActiveTab("About");
    });
  });

  test.describe("up to date", () => {
    test.use({
      wailsMock: {
        checkForUpdate: upToDateUpdate,
      },
    });

    test("U02: does not show a startup update toast", async ({ app, page }) => {
      await app.goto();
      await app.waitForReady();

      const about = new AboutPage(page);
      await expect(about.updateAvailableToast()).toHaveCount(0);
    });
  });

  test.describe("beta channel", () => {
    test.use({
      wailsMock: {
        checkForUpdate: upToDateUpdate,
        checkForUpdateBeta: betaAvailableUpdate,
      },
    });

    test("U03: toggle saves beta channel and shows prerelease update", async ({
      app,
      page,
    }) => {
      await app.goto();
      await app.openTab("About");

      const about = new AboutPage(page);
      await expect(about.betaUpdatesSwitch()).not.toBeChecked();

      await about.betaUpdatesSwitch().click();

      await expect
        .poll(async () => (await getMockedSettings(page)).updateChannel)
        .toBe("beta");

      await expect
        .poll(async () => (await getMockedUpdateInfo(page))?.latestVersion)
        .toBe("2.0.0-beta.1");

      await expect(about.prereleaseBadge()).toBeVisible();
      await expect(about.downloadUpdateButton()).toBeVisible();
      await expect(
        page.getByRole("tabpanel").getByText("v2.0.0-beta.1", { exact: true }),
      ).toBeVisible();
    });
  });
});

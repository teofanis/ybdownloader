import { test, expect } from "../../fixtures/test";
import {
  SAMPLE_CONVERSION_JOB,
  SAMPLE_CONVERSION_PRESETS,
} from "../../helpers/fixtures";
import { ConverterPage } from "../../pages/converter.page";

test.describe("Converter", { tag: "@full" }, () => {
  test.beforeEach(async ({ app }) => {
    await app.goto();
    await app.openTab("Converter");
  });

  test("C01: convert disabled without file and preset", async ({ page }) => {
    const converter = new ConverterPage(page);
    await expect(converter.emptyQueueMessage()).toBeVisible();
    await expect(converter.startConversionButton()).toBeDisabled();
  });

  test.describe("with mocked presets", () => {
    test.use({
      wailsMock: {
        conversionPresets: [...SAMPLE_CONVERSION_PRESETS],
      },
    });

    test("C02: preset browser expands category", async ({ page }) => {
      const converter = new ConverterPage(page);
      await expect(converter.presetButton("MP3 High Quality")).toBeVisible();
      await expect(converter.presetButton("MP4 Compatible")).toBeHidden();

      await converter.expandCategory("Video Formats");
      await expect(converter.presetButton("MP4 Compatible")).toBeVisible();
    });

    test("C03: file and preset enable convert", async ({ page }) => {
      const converter = new ConverterPage(page);
      await expect(converter.startConversionButton()).toBeDisabled();

      await converter.selectMediaFile();
      await expect(page.getByText("e2e-sample.mp4")).toBeVisible();
      await expect(page.getByText("2:00")).toBeVisible();

      await converter.selectPreset("MP3 High Quality");
      await expect(converter.startConversionButton()).toBeEnabled();
    });
  });

  test.describe("with mocked jobs", () => {
    test.use({
      wailsMock: {
        conversionPresets: [...SAMPLE_CONVERSION_PRESETS],
        conversionJobs: [SAMPLE_CONVERSION_JOB],
      },
    });

    test("C04: job list shows progress", async ({ page }) => {
      const converter = new ConverterPage(page);
      await expect(converter.jobProgressBar()).toBeVisible();
      await expect(converter.jobProgressText(45)).toBeVisible();
      await expect(page.getByText("Converting")).toBeVisible();
    });
  });
});

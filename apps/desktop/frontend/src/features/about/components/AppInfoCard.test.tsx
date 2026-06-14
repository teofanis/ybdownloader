import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { AppInfoCard } from "./AppInfoCard";

describe("AppInfoCard", () => {
  it("renders the current version", () => {
    renderWithProviders(<AppInfoCard version="1.2.3" hasUpdate={false} />);

    expect(screen.getByText("v1.2.3")).toBeInTheDocument();
  });

  it("shows a prerelease badge for beta versions", () => {
    renderWithProviders(
      <AppInfoCard version="2.0.0-beta.1" hasUpdate={false} />
    );

    expect(
      screen.getByText("about.update.prereleaseBadge")
    ).toBeInTheDocument();
  });

  it("shows a new-version badge when an update is available", () => {
    renderWithProviders(
      <AppInfoCard version="1.2.3" hasUpdate={true} latestVersion="2.0.0" />
    );

    expect(screen.getByText("about.update.newVersion")).toBeInTheDocument();
  });
});

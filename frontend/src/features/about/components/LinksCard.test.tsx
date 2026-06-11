import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/test-utils";
import { LinksCard } from "./LinksCard";
import { BrowserOpenURL } from "../../../../wailsjs/runtime/runtime";

describe("LinksCard", () => {
  it("renders project links", () => {
    renderWithProviders(<LinksCard />);

    expect(screen.getByText("about.links.title")).toBeInTheDocument();
    expect(screen.getByText("about.links.github")).toBeInTheDocument();
    expect(screen.getByText("about.links.releases")).toBeInTheDocument();
  });

  it("opens external links in the browser", () => {
    renderWithProviders(<LinksCard />);

    fireEvent.click(screen.getByText("about.links.github"));
    expect(BrowserOpenURL).toHaveBeenCalledWith(
      "https://github.com/teofanis/ybdownloader"
    );
  });
});

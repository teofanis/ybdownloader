import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ResultsPanel } from "./ResultsPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

describe("ResultsPanel", () => {
  it("shows pointer cursor on browse tab toggles", () => {
    render(
      <ResultsPanel
        activeTab="search"
        isLoading={false}
        results={[]}
        addingIds={new Set()}
        onTabChange={vi.fn()}
        onRefresh={vi.fn()}
        onAddToQueue={vi.fn()}
        onOpenInBrowser={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /browse.searchResults/i })
    ).toHaveClass("cursor-pointer");
    expect(
      screen.getByRole("button", { name: /browse.trending/i })
    ).toHaveClass("cursor-pointer");
  });
});

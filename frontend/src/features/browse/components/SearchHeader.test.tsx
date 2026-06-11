import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { SearchHeader } from "./SearchHeader";

describe("SearchHeader", () => {
  it("renders search controls", () => {
    renderWithProviders(
      <SearchHeader
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        selectedFormat="mp3"
        onFormatChange={vi.fn()}
        onSearch={vi.fn()}
        isSearching={false}
      />
    );

    expect(screen.getByText("browse.title")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("browse.searchPlaceholder")
    ).toBeInTheDocument();
  });

  it("submits search on button click and enter key", () => {
    const onSearch = vi.fn();
    const onSearchQueryChange = vi.fn();

    renderWithProviders(
      <SearchHeader
        searchQuery="lofi beats"
        onSearchQueryChange={onSearchQueryChange}
        selectedFormat="mp3"
        onFormatChange={vi.fn()}
        onSearch={onSearch}
        isSearching={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /browse.openYoutube/ }));
    expect(onSearch).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText("browse.searchPlaceholder"), {
      target: { value: "jazz" },
    });
    expect(onSearchQueryChange).toHaveBeenCalledWith("jazz");

    fireEvent.keyDown(screen.getByPlaceholderText("browse.searchPlaceholder"), {
      key: "Enter",
    });
    expect(onSearch).toHaveBeenCalledTimes(2);
  });

  it("disables search button while searching or when query is empty", () => {
    const { rerender } = renderWithProviders(
      <SearchHeader
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        selectedFormat="mp3"
        onFormatChange={vi.fn()}
        onSearch={vi.fn()}
        isSearching={false}
      />
    );

    expect(
      screen.getByRole("button", { name: /browse.openYoutube/ })
    ).toBeDisabled();

    rerender(
      <SearchHeader
        searchQuery="query"
        onSearchQueryChange={vi.fn()}
        selectedFormat="mp3"
        onFormatChange={vi.fn()}
        onSearch={vi.fn()}
        isSearching={true}
      />
    );

    expect(
      screen.getByRole("button", { name: /browse.openYoutube/ })
    ).toBeDisabled();
  });
});

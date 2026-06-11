import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./theme-provider";

function ThemeConsumer() {
  const { mode, accentTheme, setMode, setAccentTheme, resetToDefaults } =
    useTheme();

  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="accent">{accentTheme}</span>
      <button type="button" onClick={() => setMode("dark")}>
        set-dark
      </button>
      <button type="button" onClick={() => setAccentTheme("blue")}>
        set-blue
      </button>
      <button type="button" onClick={resetToDefaults}>
        reset
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-accent");
  });

  it("provides stored theme values to children", () => {
    localStorage.setItem("ybdownloader-theme-mode", "light");
    localStorage.setItem("ybdownloader-accent-theme", "green");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(screen.getByTestId("accent")).toHaveTextContent("green");
  });

  it("updates mode and accent theme", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "set-dark" }));
    fireEvent.click(screen.getByRole("button", { name: "set-blue" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("accent")).toHaveTextContent("blue");
    expect(localStorage.getItem("ybdownloader-theme-mode")).toBe("dark");
    expect(localStorage.getItem("ybdownloader-accent-theme")).toBe("blue");
  });

  it("resets theme values to defaults", () => {
    localStorage.setItem("ybdownloader-theme-mode", "dark");
    localStorage.setItem("ybdownloader-accent-theme", "red");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "reset" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    expect(screen.getByTestId("accent")).toHaveTextContent("purple");
  });

  it("throws when useTheme is used outside the provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );

    consoleError.mockRestore();
  });
});

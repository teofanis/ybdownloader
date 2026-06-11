import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { MarqueeText } from "@ybdownload/ui/marquee-text";

describe("MarqueeText", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    render(<MarqueeText>Scrolling label</MarqueeText>);
    expect(screen.getByText("Scrolling label")).toBeInTheDocument();
  });

  it("handles hover without overflowing text", () => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return 200;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 200;
      },
    });

    render(<MarqueeText>Short text</MarqueeText>);
    const container =
      screen.getByText("Short text").parentElement?.parentElement;

    expect(container).toBeTruthy();
    fireEvent.mouseEnter(container!);
    fireEvent.mouseLeave(container!);
  });

  it("recalculates overflow on window resize", () => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return 50;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get() {
        return 200;
      },
    });

    render(<MarqueeText>Very long overflowing text</MarqueeText>);
    fireEvent(window, new Event("resize"));
    expect(screen.getByText("Very long overflowing text")).toBeInTheDocument();
  });
});

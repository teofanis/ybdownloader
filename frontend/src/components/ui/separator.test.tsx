import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders horizontal separator by default", () => {
    const { container } = render(<Separator data-testid="separator" />);
    const separator = container.querySelector('[data-testid="separator"]');

    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    expect(separator).toHaveClass("h-[1px]", "w-full");
  });

  it("renders vertical separator when requested", () => {
    const { container } = render(
      <Separator orientation="vertical" data-testid="separator" />
    );
    const separator = container.querySelector('[data-testid="separator"]');

    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveClass("h-full", "w-[1px]");
  });
});

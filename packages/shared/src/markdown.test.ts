import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders basic markdown", () => {
    const html = renderMarkdown("## Hello\n\n- one");
    expect(html).toContain("<h2");
    expect(html).toContain("Hello");
    expect(html).toContain("<li>");
  });
});

import { vi } from "vitest";

/** Shared toast spy — reset in each test's beforeEach via vi.clearAllMocks(). */
export const mockToast = vi.fn();

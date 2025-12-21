import { render, RenderOptions } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Wrapper component that includes all necessary providers for tests.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

/**
 * Custom render function that wraps components with all necessary providers.
 * Use this instead of @testing-library/react's render when testing components
 * that use Tooltip or other context-dependent features.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };


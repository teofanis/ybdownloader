import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define:
    mode === "showcase"
      ? { "import.meta.env.VITE_SHOWCASE": JSON.stringify("1") }
      : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Keep each @ybdownload/ui subpath as a separate module until Rollup tree-shakes the prod bundle.
    exclude: ["@ybdownload/ui"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        showcase: path.resolve(__dirname, "showcase.html"),
      },
    },
  },
  server: {
    strictPort: true,
  },
}));

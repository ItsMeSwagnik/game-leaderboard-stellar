import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist"),
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
    // Allow Vite to resolve packages hoisted to the workspace root
    preserveSymlinks: false,
  },
  server: {
    fs: {
      // Allow serving files from the workspace root node_modules
      allow: [path.resolve(__dirname, "../../")],
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "@creit.tech/stellar-wallets-kit",
      "@creit.tech/stellar-wallets-kit/modules/freighter",
      "@creit.tech/stellar-wallets-kit/modules/xbull",
      "@creit.tech/stellar-wallets-kit/modules/lobstr",
    ],
  },
});

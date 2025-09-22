import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional Replit plugins - only load if available and in Replit environment
const getOptionalReplitPlugins = async () => {
  const plugins: any[] = [];
  
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
    try {
      // Try to load Replit-specific plugins if available
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").catch(() => null);
      if (runtimeErrorOverlay) {
        plugins.push(runtimeErrorOverlay.default());
      }

      const cartographer = await import("@replit/vite-plugin-cartographer").catch(() => null);
      if (cartographer) {
        plugins.push(cartographer.cartographer());
      }

      const devBanner = await import("@replit/vite-plugin-dev-banner").catch(() => null);
      if (devBanner) {
        plugins.push(devBanner.devBanner());
      }
    } catch (error) {
      console.log("Replit plugins not available - running in standard environment");
    }
  }
  
  return plugins;
};

export default defineConfig(async () => {
  const replitPlugins = await getOptionalReplitPlugins();

  return {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { timelinePlugin } from "./src/vite-plugin-timeline";

// Subapps served as static HTML at their own subpaths
const STATIC_SUBAPPS = ["ambientspace", "tltr", "dotword"];

/** Vite plugin: serve static subapp index.html at /ambientspace, /tltr, /dotword */
function staticSubappsPlugin() {
  return {
    name: "static-subapps",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const matched = STATIC_SUBAPPS.find(
          (app) => url === `/${app}` || url === `/${app}/`,
        );
        if (matched) {
          const htmlPath = path.resolve(
            __dirname,
            `public/${matched}/index.html`,
          );
          if (fs.existsSync(htmlPath)) {
            res.setHeader("Content-Type", "text/html");
            res.end(fs.readFileSync(htmlPath, "utf-8"));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), timelinePlugin(), staticSubappsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @ts-ignore - vitest extends vite config
  test: {
    environment: "jsdom",
    globals: true,
  },
});

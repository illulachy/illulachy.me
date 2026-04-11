import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { timelinePlugin } from "./src/vite-plugin-timeline";

// Serve public sub-path directories as standalone pages in dev
// e.g. /dotword → public/dotword/index.html
function staticSubpathPlugin(subpaths: string[]) {
  return {
    name: "static-subpath",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url?.split("?")[0];
        for (const sub of subpaths) {
          if (url === `/${sub}` || url === `/${sub}/`) {
            const file = path.resolve(__dirname, `public/${sub}/index.html`);
            if (fs.existsSync(file)) {
              res.setHeader("Content-Type", "text/html");
              res.end(fs.readFileSync(file, "utf-8"));
              return;
            }
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    timelinePlugin(),
    staticSubpathPlugin(["dotword", "tltr", "ambientspace", "voi"]),
  ],
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

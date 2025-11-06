import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  publicDir: "public",
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "routes/*": path.resolve(__dirname, "./src/routes/*"),
      routes: path.resolve(__dirname, "./src/routes"),
      "components/*": path.resolve(__dirname, "./src/components/*"),
      components: path.resolve(__dirname, "./src/components"),
      "configs/*": path.resolve(__dirname, "./src/configs/*"),
      configs: path.resolve(__dirname, "./src/configs"),
      "context/*": path.resolve(__dirname, "./src/context/*"),
      context: path.resolve(__dirname, "./src/context"),
      "hooks/*": path.resolve(__dirname, "./src/hooks/*"),
      hooks: path.resolve(__dirname, "./src/hooks"),
      "layout/*": path.resolve(__dirname, "./src/layout/*"),
      layout: path.resolve(__dirname, "./src/layout"),
      "mock/*": path.resolve(__dirname, "./src/mock/*"),
      mock: path.resolve(__dirname, "./src/mock"),
      "pages/*": path.resolve(__dirname, "./src/pages/*"),
      pages: path.resolve(__dirname, "./src/pages"),
      "resources/*": path.resolve(__dirname, "./src/resources/*"),
      resources: path.resolve(__dirname, "./src/resources"),
      "schemas/*": path.resolve(__dirname, "./src/schemas/*"),
      schemas: path.resolve(__dirname, "./src/schemas"),
      "services/*": path.resolve(__dirname, "./src/services/*"),
      services: path.resolve(__dirname, "./src/services"),
      "shared/*": path.resolve(__dirname, "./src/shared/*"),
      shared: path.resolve(__dirname, "./src/shared"),
      "types/*": path.resolve(__dirname, "./src/types/*"),
      types: path.resolve(__dirname, "./src/types"),
      "utils/*": path.resolve(__dirname, "./src/utils/*"),
      utils: path.resolve(__dirname, "./src/utils"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
});

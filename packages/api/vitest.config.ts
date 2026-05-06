import path from "node:path";
import { defineConfig } from "vitest/config";

const src = path.resolve(__dirname, "src");

export default defineConfig({
  resolve: {
    alias: {
      "@application": path.join(src, "application"),
      "@domain": path.join(src, "domain"),
      "@infrastructure": path.join(src, "infrastructure"),
      "@presentation": path.join(src, "presentation"),
      tests: path.join(src, "tests"),
    },
  },
  test: {
    globalSetup: "./src/tests/globalSetup.ts",
    setupFiles: ["./src/tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 10000,
  },
});

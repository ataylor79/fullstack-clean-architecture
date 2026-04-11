import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/tests/globalSetup.ts",
    setupFiles: ["./src/tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 10000,
  },
});

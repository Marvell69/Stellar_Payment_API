import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    locale: "en-US",
    timezoneId: "UTC",
    viewport: {
      width: 1440,
      height: 1200,
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

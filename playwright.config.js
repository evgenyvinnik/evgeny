const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 75_000,        // a glass or macOS capture can take two seconds
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    deviceScaleFactor: 1,
    // the page paints its own world in every era; never inherit a host theme
    colorScheme: 'dark',
  },

  expect: {
    toHaveScreenshot: {
      // backdrop-filter and gradient dithering vary by a hair between runs
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Liquid Glass and macOS stack backdrop-filters over a gradient mesh
      // and take up to 1.8s to composite; two captures need real headroom
      timeout: 25_000,
    },
  },

  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile',  use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],

  webServer: {
    command: 'node scripts/build.mjs .testbuild && python3 -m http.server 4173 --directory .testbuild --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
  },
});

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:5174',
    viewport: { width: 1440, height: 900 },
    video: { mode: 'on', size: { width: 1440, height: 900 } },
    screenshot: 'off',
    locale: 'zh-TW',
    ignoreHTTPSErrors: true,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  workers: 1,
})

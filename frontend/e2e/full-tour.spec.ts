import { test, Page } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const SS = path.resolve(__dirname, '../../docs/screenshots')

// ── helpers ──────────────────────────────────────────────────────────────────
async function waitReady(page: Page, ms = 2500) {
  await page.waitForTimeout(ms)
}

/** Bypass the mandatory tour overlay via JS */
async function bypassTour(page: Page) {
  await page.addInitScript(() => {
    (window as any).__BYPASS_TOUR__ = true
  })
}

/** Navigate to a route without tour, wait for content, screenshot */
async function snap(page: Page, route: string, filename: string, waitMs = 3000) {
  await page.goto(route)
  await waitReady(page, waitMs)
  await page.screenshot({ path: `${SS}/${filename}`, fullPage: false })
}

/** Scroll down by px then screenshot */
async function snapScrolled(page: Page, filename: string, scrollY: number, waitMs = 1000) {
  await page.evaluate((y) => window.scrollTo(0, y), scrollY)
  await waitReady(page, waitMs)
  await page.screenshot({ path: `${SS}/${filename}`, fullPage: false })
}

// ── TEST 1: Mandatory Tour — 22 steps ─────────────────────────────────────────
test('01 · Pipeline Journey Tour', async ({ page }) => {
  await page.goto('/')
  // Wait for tour fullscreen overlay to appear (400ms delay + render)
  await page.waitForSelector('.fixed.inset-0', { timeout: 5000 })
  await waitReady(page, 500)

  const TOTAL = 22
  for (let i = 0; i < TOTAL; i++) {
    const step = String(i + 1).padStart(2, '0')
    await page.screenshot({ path: `${SS}/tour-step-${step}.png` })
    await waitReady(page, 200)

    // Scope clicks to the fullscreen overlay (avoid floating TourPanel duplicate)
    const overlay = page.locator('.fixed.inset-0').first()
    if (i < TOTAL - 1) {
      await overlay.getByRole('button', { name: /下一步|Next →/ }).click()
      await waitReady(page, 300)
    } else {
      await overlay.getByRole('button', { name: /進入平台|Enter Platform/ }).click()
      await waitReady(page, 800)
    }
  }
  // Final state — on the app (tour closed)
  await page.screenshot({ path: `${SS}/tour-completed.png` })
})

// ── TEST 2: Core Pages ────────────────────────────────────────────────────────
test('02 · Homepage', async ({ page }) => {
  await bypassTour(page)
  await page.goto('/')
  await waitReady(page, 3000)
  await page.screenshot({ path: `${SS}/page-home.png` })
  await snapScrolled(page, 'page-home-scroll.png', 600)
})

test('03 · Search — keyword query', async ({ page }) => {
  await bypassTour(page)
  await page.goto('/search')
  await waitReady(page, 2000)
  await page.screenshot({ path: `${SS}/page-search.png` })
  // Type a query
  const input = page.getByRole('textbox').first()
  await input.fill('rock')
  await waitReady(page, 2000)
  await page.screenshot({ path: `${SS}/page-search-results.png` })
})

test('04 · Similar Tracks', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/similar', 'page-similar.png', 2500)
})

test('05 · Recommendations', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/recommend', 'page-recommend.png', 2500)
})

test('06 · Evaluation + Model Profiles', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/evaluation', 'page-evaluation.png', 3000)
  await snapScrolled(page, 'page-evaluation-profiles.png', 900)
})

test('07 · Upload / Pipeline Runner', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/upload', 'page-upload.png', 2000)
})

test('08 · Pipeline Node Graph', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/pipeline', 'page-pipeline.png', 2000)
})

test('09 · Artist Network', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/artists', 'page-artists.png', 4000)
})

test('10 · Genre Dashboard', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/genres', 'page-genres.png', 3500)
})

// ── TEST 3: Analytics Pages ───────────────────────────────────────────────────
test('11 · User DNA', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/dna', 'page-dna.png', 3500)
})

test('12 · Model Disagreement', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/disagreement', 'page-disagreement.png', 3500)
})

test('13 · Popularity Bias', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/popularity', 'page-popularity.png', 3500)
})

test('14 · Catalog Timeline', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/timeline', 'page-timeline.png', 3500)
})

test('15 · Model Tradeoff', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/tradeoff', 'page-tradeoff.png', 3500)
})

test('16 · Feature Correlation', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/correlation', 'page-correlation.png', 3500)
})

test('17 · Listening Patterns', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/patterns', 'page-patterns.png', 3500)
})

test('18 · Cohort Taste Map', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/cohorts', 'page-cohorts.png', 3500)
})

test('19 · Geography', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/geography', 'page-geography.png', 3500)
})

test('20 · Decision Tree + Random Forest', async ({ page }) => {
  await bypassTour(page)
  await snap(page, '/analytics/tree', 'page-tree.png', 8000)
  await snapScrolled(page, 'page-tree-rf.png', 400)
})

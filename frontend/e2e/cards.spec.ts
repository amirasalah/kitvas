import { test, expect } from '@playwright/test';

test.describe('Dashboard cards', () => {
  test('overview topic cards have expected content', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for either data or empty state
    await expect(
      page.getByText('Trending Topics').or(page.getByText('No trending data yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasTrending = await page.getByText('Trending Topics').isVisible().catch(() => false);
    if (!hasTrending) {
      test.skip();
      return;
    }

    // Summary section should have stat cards
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByText('Total Topics')).toBeVisible();
  });

  test('YouTube video cards have thumbnails and titles', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /YouTube/ }).click();

    await expect(
      page.locator('h4').first().or(page.getByText('No trending videos yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasVideos = await page.locator('img[alt]').first().isVisible().catch(() => false);
    if (!hasVideos) {
      test.skip();
      return;
    }

    // Video cards should have image thumbnails
    const images = page.locator('img[alt]');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    // Cards should have title elements
    const titles = page.locator('h4');
    const titleCount = await titles.count();
    expect(titleCount).toBeGreaterThan(0);
  });

  test('Website article cards have source badge and title', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Websites/ }).click();

    await expect(
      page.locator('h4').first().or(page.getByText('No articles yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasArticles = await page.locator('h4').first().isVisible().catch(() => false);
    if (!hasArticles) {
      test.skip();
      return;
    }

    // Article cards should have titles
    const titles = page.locator('h4');
    const titleCount = await titles.count();
    expect(titleCount).toBeGreaterThan(0);

    // Article cards should link to external URLs
    const externalLinks = page.locator('a[target="_blank"]');
    const linkCount = await externalLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('overview summary shows stat cards when data exists', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(
      page.getByText('Trending Topics').or(page.getByText('No trending data yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasData = await page.getByText('Summary').isVisible().catch(() => false);
    if (!hasData) {
      test.skip();
      return;
    }

    // Stat cards should be present
    await expect(page.getByText('Total Topics')).toBeVisible();
    await expect(page.getByText('Breakouts')).toBeVisible();
  });
});

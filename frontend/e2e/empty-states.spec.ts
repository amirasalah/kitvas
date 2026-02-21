import { test, expect } from '@playwright/test';

test.describe('Empty states and loading', () => {
  test('dashboard overview shows data or empty state', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for either data or empty state (not animate-pulse which persists in navbar)
    await expect(
      page.getByText('Trending Topics').or(page.getByText('No trending data yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasData = await page.getByText('Trending Topics').isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No trending data yet').isVisible().catch(() => false);
    expect(hasData || hasEmpty).toBe(true);
  });

  test('YouTube tab shows videos or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /YouTube/ }).click();

    await expect(
      page.locator('h4').first().or(page.getByText('No trending videos yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasVideos = await page.locator('h4').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No trending videos yet').isVisible().catch(() => false);
    expect(hasVideos || hasEmpty).toBe(true);
  });

  test('Websites tab shows articles or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Websites/ }).click();

    await expect(
      page.locator('h4').first().or(page.getByText('No articles yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasArticles = await page.locator('h4').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No articles yet').isVisible().catch(() => false);
    expect(hasArticles || hasEmpty).toBe(true);
  });

  test('search page shows hero content before searching', async ({ page }) => {
    await page.goto('/');

    // Pre-search state should show hero elements
    await expect(page.getByRole('heading', { name: /Discover Recipe/ })).toBeVisible();
    await expect(page.getByText('Demand Signals')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Food Trend Dashboard' })).toBeVisible();
  });

  test('shows subtitle text', async ({ page }) => {
    await expect(page.getByText('Real-time trending food content across YouTube and food publications')).toBeVisible();
  });

  test('displays all three tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Overview/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /YouTube/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Websites/ })).toBeVisible();
  });

  test('Overview tab is active by default', async ({ page }) => {
    const overviewBtn = page.getByRole('button', { name: /Overview/ });
    await expect(overviewBtn).toHaveClass(/bg-white/);
  });

  test('shows period selector with all options', async ({ page }) => {
    await expect(page.getByRole('button', { name: '1H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '24H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30D' })).toBeVisible();
  });

  test('overview shows trending topics or empty state', async ({ page }) => {
    // Wait for either data or empty state to appear
    await expect(
      page.getByText('Trending Topics').or(page.getByText('No trending data yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasTrending = await page.getByText('Trending Topics').isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No trending data yet').isVisible().catch(() => false);
    expect(hasTrending || hasEmpty).toBe(true);
  });

  test('clicking YouTube tab shows video content', async ({ page }) => {
    await page.getByRole('button', { name: /YouTube/ }).click();

    // Wait for either video content or empty state
    await expect(
      page.locator('h4').first().or(page.getByText('No trending videos yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasVideos = await page.locator('img[alt]').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No trending videos yet').isVisible().catch(() => false);
    expect(hasVideos || hasEmpty).toBe(true);
  });

  test('clicking Websites tab shows article content', async ({ page }) => {
    await page.getByRole('button', { name: /Websites/ }).click();

    // Wait for either article content or empty state
    await expect(
      page.locator('h4').first().or(page.getByText('No articles yet'))
    ).toBeVisible({ timeout: 15_000 });

    const hasArticles = await page.locator('h4').first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText('No articles yet').isVisible().catch(() => false);
    expect(hasArticles || hasEmpty).toBe(true);
  });

  test('period selector changes active state', async ({ page }) => {
    const btn7d = page.getByRole('button', { name: '7D' });
    await btn7d.click();
    await expect(btn7d).toHaveClass(/bg-white/);
  });
});

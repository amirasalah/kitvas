import { test, expect } from '@playwright/test';

test.describe('Search filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('filter toggle button opens filter panel', async ({ page }) => {
    // The filter button is the funnel icon button (SVG, no text)
    // It's the button with the funnel SVG path
    const filterBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M3 4a1"]') });
    await filterBtn.click();

    await expect(page.getByText('Filters', { exact: true })).toBeVisible();
  });

  test('filter panel shows all three categories', async ({ page }) => {
    const filterBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M3 4a1"]') });
    await filterBtn.click();

    await expect(page.getByText('Cooking Method')).toBeVisible();
    await expect(page.getByText('Dietary')).toBeVisible();
    await expect(page.getByText('Cuisine')).toBeVisible();
  });

  test('clicking a filter option activates it', async ({ page }) => {
    const filterBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M3 4a1"]') });
    await filterBtn.click();

    const veganBtn = page.getByRole('button', { name: 'vegan', exact: true });
    await veganBtn.click();

    // Active state: bg-emerald-600 text-white
    await expect(veganBtn).toHaveClass(/bg-emerald-600/);
  });

  test('Clear all filters resets selections', async ({ page }) => {
    const filterBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M3 4a1"]') });
    await filterBtn.click();

    // Select a filter
    await page.getByRole('button', { name: 'vegan', exact: true }).click();

    // Clear all
    await page.getByText('Clear all filters').click();

    // vegan should be inactive now
    const veganBtn = page.getByRole('button', { name: 'vegan', exact: true });
    await expect(veganBtn).not.toHaveClass(/bg-emerald-600/);
  });

  test('active filter shows as tag pill when panel closed', async ({ page }) => {
    const filterBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M3 4a1"]') });
    await filterBtn.click();

    // Select a filter
    await page.getByRole('button', { name: 'keto', exact: true }).click();

    // Close filter panel
    await filterBtn.click();

    // Tag pill should be visible below input
    await expect(page.getByText('Filters:')).toBeVisible();
    await expect(page.getByRole('button', { name: /keto/ })).toBeVisible();
  });
});

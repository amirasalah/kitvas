import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navbar is visible with logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Kitvas').first()).toBeVisible();
  });

  test('Dashboard link navigates to /dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Search link navigates to /', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Search' }).click();
    await expect(page).toHaveURL('/');
  });

  test('Search link is active on / route', async ({ page }) => {
    await page.goto('/');
    const searchLink = page.getByRole('link', { name: 'Search' });
    await expect(searchLink).toHaveClass(/bg-white\/60/);
  });

  test('Dashboard link is active on /dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    const dashLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashLink).toHaveClass(/bg-white\/60/);
  });

  test('Sign in link is visible when logged out', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('Sign in link navigates to /auth/signin', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/auth/signin');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Auth sign-in page', () => {
  test('loads with correct heading', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows Continue with Google button', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('shows Kitvas logo linking to home', async ({ page }) => {
    await page.goto('/auth/signin');
    const logo = page.getByText('Kitvas').first();
    await expect(logo).toBeVisible();
  });

  test('shows tagline text', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByText('Intelligence for Food Creators')).toBeVisible();
  });

  test('shows benefits list with 4 items', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByText('Unlimited searches with full analytics')).toBeVisible();
    await expect(page.getByText('Ingredient gap analysis & content angles')).toBeVisible();
    await expect(page.getByText('Trending ingredients & search insights')).toBeVisible();
    await expect(page.getByText('Email alerts for breakout trending ingredients')).toBeVisible();
  });

  test('shows error banner with OAuthSignin error', async ({ page }) => {
    await page.goto('/auth/signin?error=OAuthSignin');
    await expect(page.getByText('Error starting sign in flow')).toBeVisible();
  });

  test('shows error banner with OAuthCallback error', async ({ page }) => {
    await page.goto('/auth/signin?error=OAuthCallback');
    await expect(page.getByText('Error during sign in')).toBeVisible();
  });

  test('shows footer with Terms and Privacy links', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./); // Has any title
  });

  test('page is accessible', async ({ page }) => {
    await page.goto('/');
    // Check for main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

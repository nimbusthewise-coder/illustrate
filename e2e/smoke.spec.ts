import { test, expect } from '@playwright/test';

/**
 * Smoke tests - basic app functionality
 * These run first to verify the app is operational
 */
test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/illustrate/i);
  });

  test('can see tool panel', async ({ page }) => {
    await page.goto('/');
    
    // Check for tool panel
    const toolPanel = page.locator('text=Tools').first();
    await expect(toolPanel).toBeVisible();
  });

  test('can see create canvas form', async ({ page }) => {
    await page.goto('/');
    
    // Check for canvas creation UI
    const createButton = page.locator('text=Create').first();
    await expect(createButton).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test('homepage has expected title', async ({ page }) => {
  await page.goto('/');

  // Assuming it's a banking app, let's just make sure the page loads and has a title 
  // or checks for login redirect.
  // Next.js default title when loading or logging in
  await expect(page).toHaveTitle(/IDP Bank|Sign In|Log In/i);
});

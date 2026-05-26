import { test, expect } from '@playwright/test';
import { FE_URL } from './helpers';
import { login } from './ui-helpers';

test.describe('UI Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('view subscription plans', async ({ page }) => {
    await page.goto(`${FE_URL}/tabs/subscriptions`);

    // Plan cards load async after page load — wait for all three plan titles
    await expect(page.locator('ion-card-title').filter({ hasText: 'Free' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('ion-card-title').filter({ hasText: 'Premium' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('ion-card-title').filter({ hasText: 'Pro' }).first()).toBeVisible({ timeout: 15000 });
  });

  test('upgrade button opens payment flow', async ({ page }) => {
    await page.goto(`${FE_URL}/tabs/subscriptions`);

    // Wait for plan cards to load
    await expect(page.locator('ion-card-title').filter({ hasText: 'Premium' }).first()).toBeVisible({ timeout: 15000 });

    // Click Upgrade on the Premium card using :has() to scope to the right card
    const premiumCard = page.locator('ion-card:has(ion-card-title:text-is("Premium"))');
    await premiumCard.locator('ion-button').filter({ hasText: /upgrade/i }).click();

    // Verify payment UI appears (Stripe element or paywall modal)
    await expect(
      page.locator('iframe[name*="stripe"]').or(page.locator('app-paywall-modal, ion-modal'))
    ).toBeVisible({ timeout: 15000 });
  });
});

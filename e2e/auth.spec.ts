import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  const testEmail = `e2e-${Date.now()}@test.com`;
  const testPassword = 'E2eTest!ng123';

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('register and login flow', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    const clinicNameInput = page.getByLabel(/clinic/i);
    if (await clinicNameInput.isVisible()) {
      await clinicNameInput.fill('E2E Test Clinic');
    }
    await page.getByRole('button', { name: /register|sign up|create/i }).click();

    // Should redirect to dashboard or onboarding
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Logout if possible, then login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    await page.waitForURL(/\/(dashboard|onboarding|sessions)/, { timeout: 10000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nonexistent@test.com');
    await page.getByLabel(/password/i).fill('Wrong!Pass123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Should show an error message and stay on login page
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/some-nonexistent-route');
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });
});

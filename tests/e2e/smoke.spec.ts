import { expect, test } from '@playwright/test';

test.describe('Admin-driven market app smoke', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Satta Matka DLBOSS.COM Kalyan Matka Result')).toBeVisible();
  });

  test('admin login loads', async ({ page }) => {
    const response = await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Admin Login')).toBeVisible();
  });

  test('non-chart php route is blocked', async ({ page }) => {
    const response = await page.goto('/about.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  });
});

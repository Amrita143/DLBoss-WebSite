import { expect, test } from '@playwright/test';

test.describe('Admin-driven market app smoke', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Satta Matka DLBOSS.COM Kalyan Matka Result')).toBeVisible();
    await expect(page.getByText('Market Details')).toHaveCount(0);
  });

  test('admin login loads', async ({ page }) => {
    const response = await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Admin Login')).toBeVisible();
  });

  test('jodi chart hides date column', async ({ page }) => {
    const response = await page.goto('/jodi-chart-record/doller.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('DOLLER JODI CHART')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Date' })).toHaveCount(0);
  });

  test('panel chart shows formatted dates', async ({ page }) => {
    const response = await page.goto('/panel-chart-record/doller.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('DOLLER PANEL CHART')).toBeVisible();
    await expect(page.locator('body')).toContainText(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('non-chart php route is blocked', async ({ page }) => {
    const response = await page.goto('/about.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  });
});

import { expect, test } from '@playwright/test';

test.describe('Admin-driven market app smoke', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByText('Satta Matka DLBOSS.COM Kalyan Matka Result')).toBeVisible();
    await expect(page.getByText('PANNA PATTI CHART RECORD')).toBeVisible();
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

  test('chart tables fit mobile width without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const panelResponse = await page.goto('/panel-chart-record/shivansh.php', { waitUntil: 'domcontentloaded' });
    expect(panelResponse?.status()).toBe(200);

    const panelViewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(panelViewport.scrollWidth).toBeLessThanOrEqual(panelViewport.clientWidth + 1);

    const jodiResponse = await page.goto('/jodi-chart-record/shivansh.php', { waitUntil: 'domcontentloaded' });
    expect(jodiResponse?.status()).toBe(200);

    const jodiViewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(jodiViewport.scrollWidth).toBeLessThanOrEqual(jodiViewport.clientWidth + 1);
  });

  test('panel table uses gold headers and tan body styling', async ({ page }) => {
    const response = await page.goto('/panel-chart-record/shivansh.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const headerBackground = await page.locator('thead th').first().evaluate((element) => getComputedStyle(element).backgroundColor);
    const bodyBackground = await page.locator('tbody td').first().evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(headerBackground).toBe('rgb(247, 191, 20)');
    expect(bodyBackground).toBe('rgb(244, 199, 155)');
  });

  test('panel cell styling colors the full value and keeps center digits larger', async ({ page }) => {
    const response = await page.goto('/panel-chart-record/shivansh.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const styledPanel = page.locator('.panel-value[style*="color:#ff0000"]').first();
    await expect(styledPanel).toBeVisible();

    const styles = await styledPanel.evaluate((element) => {
      const center = element.querySelector('.panel-center');
      const left = element.querySelector('.panel-side-left');
      const right = element.querySelector('.panel-side-right');

      if (!center || !left || !right) {
        throw new Error('Expected full panel structure to be rendered');
      }

      return {
        wrapperColor: getComputedStyle(element).color,
        centerColor: getComputedStyle(center).color,
        leftColor: getComputedStyle(left).color,
        rightColor: getComputedStyle(right).color,
        centerFontSize: Number.parseFloat(getComputedStyle(center).fontSize),
        sideFontSize: Number.parseFloat(getComputedStyle(left).fontSize),
        leftAlign: getComputedStyle(left).textAlign,
        rightAlign: getComputedStyle(right).textAlign
      };
    });

    expect(styles.wrapperColor).toBe('rgb(255, 0, 0)');
    expect(styles.centerColor).toBe('rgb(255, 0, 0)');
    expect(styles.leftColor).toBe('rgb(255, 0, 0)');
    expect(styles.rightColor).toBe('rgb(255, 0, 0)');
    expect(styles.centerFontSize).toBeGreaterThan(styles.sideFontSize);
    expect(styles.leftAlign).toBe('left');
    expect(styles.rightAlign).toBe('right');
  });

  test('non-chart php route is blocked', async ({ page }) => {
    const response = await page.goto('/about.php', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(404);
  });
});

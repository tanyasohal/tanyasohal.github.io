import { test, expect } from '@playwright/test';

const sections = [
  { id: 'hero', name: 'hero' },
  { id: 'about', name: 'about' },
  { id: 'work', name: 'work' },
  { id: 'skills', name: 'skills' },
  { id: 'writing', name: 'writing' },
  { id: 'contact', name: 'contact' },
] as const;

test.describe('visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Wait for web fonts so screenshots are stable
    await page.evaluate(() => document.fonts.ready);
  });

  test('homepage light theme', async ({ page }) => {
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    });
  });

  test('homepage dark theme', async ({ page }) => {
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    });
  });

  for (const section of sections) {
    test(`section: ${section.name}`, async ({ page }) => {
      const el = page.locator(`#${section.id}`);
      await el.scrollIntoViewIfNeeded();
      await expect(el).toHaveScreenshot(`${section.name}.png`);
    });
  }
});

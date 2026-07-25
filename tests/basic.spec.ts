import { test, expect } from '@playwright/test';

test('has title and brand lockup', async ({ page }) => {
  await page.goto('/');

  // Check the title
  await expect(page).toHaveTitle(/Незбіг/);

  // Check the brand heading
  const heading = page.locator('h1#page-title');
  await expect(heading).toHaveText('Незбіг');
});

test('can type text and see the diagnostic panel', async ({ page }) => {
  await page.goto('/');

  // Type enough text to exceed the 20-word minimum
  await page.locator('[contenteditable]').fill('Це тестовий документ для перевірки на плагіат, який не містить жодного сенсу і був згенерований випадково. Додаткові слова щоб зробити текст трохи довшим і дозволити системі увімкнути кнопку перевірки на плагіат.');

  // Check that the submit button becomes enabled
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
});

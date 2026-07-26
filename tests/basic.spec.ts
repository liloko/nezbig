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

test('full scan flow with mock API', async ({ page }) => {
  // Mock the scan endpoints
  await page.route('/api/scan/jobs', async route => {
    const json = { jobId: 'mocked-job-id' };
    await route.fulfill({ json });
  });

  await page.route('/api/scan-status/mocked-job-id', async route => {
    const json = {
      status: 'completed',
      result: {
        id: 'mocked-report-id',
        fileName: 'Вставлений текст',
        checkedAt: new Date().toISOString(),
        wordCount: 120,
        chunksChecked: 1,
        plagiarismScore: 45,
        aiProbability: 10,
        aiVerdict: 'low',
        aiReliability: { score: 90, level: 'high', reason: '', segmentCount: 1, segmentSpread: 0 },
        aiLanguage: { code: 'uk', supportedPercent: 100 },
        aiExclusions: { codeWords: 0, referenceWords: 0, quotedWords: 0, analyzedWords: 120 },
        aiSuspiciousSegments: [],
        aiProvider: 'local',
        scanNotes: [],
        searchDiagnostics: { providers: [], pages: { attempted: 0, verified: 0, unavailable: 0, cacheHits: 0, negativeCacheHits: 0 } },
        matches: [],
        aiSignals: [],
        summary: 'Оригінальний текст.'
      }
    };
    await route.fulfill({ json });
  });

  await page.route('/api/ai-opinion', async route => {
    await route.fulfill({
      json: {
        aiProbability: 12,
        aiModel: 'Mocked LLM',
        aiNote: '',
        aiSignals: []
      }
    });
  });

  await page.goto('/');

  // Type text
  const longText = 'Цей текст достатньо довгий, щоб запустити перевірку. '.repeat(15);
  await page.locator('[contenteditable]').fill(longText);

  // Click submit
  await page.locator('button[type="submit"]').click();

  // Check report summary visibility
  const reportSection = page.locator('.report');
  await expect(reportSection).toBeVisible({ timeout: 10000 });
  
  const plagiarismScore = page.locator('.metrics article:first-child strong');
  await expect(plagiarismScore).toHaveText('45%');
});

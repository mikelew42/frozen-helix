import { test, expect } from '@playwright/test';

// Pages that run Test1.View suites — all must pass with zero .t1-suite.fail
const TEST_PAGES = [
    '/framework/core/Item/0/',
    '/framework/core/Item/1/',
    '/framework/core/Item/2/',
    '/framework/core/Item/3/',
    '/framework/core/Item/4/',
    '/framework/core/Item/5/',
    '/framework/core/Item/6/',
    '/framework/core/Item/7/',
    '/framework/core/Item/8/',
    '/framework/core/Item/9/',
    '/framework/core/List/0/',
    '/framework/core/List/1/',
    '/framework/core/List/2/',
    '/framework/core/List/3/',
    '/framework/core/List/4/',
    '/framework/core/List/5/',
    '/framework/core/List/6/',
    '/framework/core/List/7/',
    '/framework/core/List/8/',
    '/framework/ext/Notes/',
    '/framework/ext/Todo/',
];

for (const path of TEST_PAGES) {
    test(path, async ({ page }) => {
        await page.goto(path);
        // Wait for the test view to render (tests run before render, so this means all done)
        await page.waitForSelector('.t1-suite', { timeout: 15000 });
        const failures = page.locator('.t1-suite.fail');
        await expect(failures).toHaveCount(0);
    });
}

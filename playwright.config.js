import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/browser',
    use: {
        baseURL: 'http://localhost:3131',
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
    webServer: {
        command: 'node server.js',
        url: 'http://localhost:3131',
        reuseExistingServer: true,
        env: { PORT: '3131' },
    },
});

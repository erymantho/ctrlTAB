const { chromium } = require('playwright');
const path = require('path');

const THEMES = [
    { html: 'light-theme.html', out: 'light-theme.png' },
    // Voeg hier later toe:
    // { html: 'dark-theme.html',  out: 'dark-theme.png' },
    // { html: 'cyberpunk.html',   out: 'cyberpunk.png' },
    // { html: 'batman.html',      out: 'batman.png' },
];

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });

    for (const theme of THEMES) {
        const filePath = path.resolve(__dirname, theme.html);
        await page.goto(`file://${filePath}`);

        // Wacht op webfonts (Press Start 2P via Google Fonts)
        await page.waitForFunction(() => document.fonts.ready);
        await page.waitForTimeout(300);

        const app = await page.$('.app');
        await app.screenshot({
            path: path.resolve(__dirname, theme.out),
            type: 'png',
        });

        console.log(`✓ ${theme.out}`);
    }

    await browser.close();
})();

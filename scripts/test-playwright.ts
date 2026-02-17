import { chromium } from 'playwright';

async function test() {
    console.log('Testing Playwright launch...');
    try {
        const browser = await chromium.launch();
        console.log('Browser launched successfully');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('Page title:', await page.title());
        await browser.close();
        console.log('Test finished successfully');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();

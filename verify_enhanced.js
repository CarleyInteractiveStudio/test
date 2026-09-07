import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function captureEnhanced() {
    const outputDir = path.resolve('verification_screenshots_v2');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    const htmlPath = 'file://' + path.resolve('index.html');
    await page.goto(htmlPath);

    // Fast-forward animation timeline by jumping startTime
    await page.evaluate(() => {
        // Jump to 3D phase: Sun glow (t = 25s)
        window.jumpToTime = function(targetSec) {
            window.startTime = performance.now() - (targetSec * 1000);
        };
    });

    // 1. Sun Glow
    await page.evaluate(() => window.jumpToTime(25.0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, '1_sun_glow.png') });

    // 2. Black Hole close-up
    await page.evaluate(() => window.jumpToTime(46.0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, '2_black_hole_lensing.png') });

    // 3. Extreme Zoom-out to Dense Galaxy
    await page.evaluate(() => window.jumpToTime(58.0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, '3_extreme_galaxy_zoomout.png') });

    // 4. Infinity Symbol Morph
    await page.evaluate(() => window.jumpToTime(65.0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, '4_infinity_morph.png') });

    await browser.close();
    console.log('Screenshots captured successfully in verification_screenshots_v2!');
}

captureEnhanced().catch(console.error);

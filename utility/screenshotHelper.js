const path = require('path');

class ScreenshotHelper {

    static async capture(page, fileName) {

        const screenshotPath = path.resolve(
            __dirname,
            '../screenshots',
            `${fileName}_${Date.now()}.png`
        );

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }
}

module.exports = ScreenshotHelper;
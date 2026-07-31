async function navigateAndWait(page, relativeUrl) {
  await page.goto(relativeUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
}

module.exports = { navigateAndWait };

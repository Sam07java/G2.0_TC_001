class DashboardPage {
  constructor(page) {
    this.page = page;
    this.schoolAdminLabel = page.getByText('School Admin', { exact: true });
  }

  async isLoaded() {
    return this.schoolAdminLabel.isVisible();
  }

  async navigate(relativeUrl) {
    await this.page.goto(relativeUrl, { waitUntil: 'domcontentloaded' });
  }
}

module.exports = { DashboardPage };

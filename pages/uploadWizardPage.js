const path = require('path');

class UploadWizardPage {
  constructor(page) {
    this.page = page;
  }

  async openImport(labels = ['Import']) {
    for (const label of labels) {
      const button = this.page.getByRole('button', { name: label, exact: true }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        return;
      }
    }
    throw new Error(`Import button not found. Tried: ${labels.join(', ')}`);
  }

  async upload(filePath) {
    const input = this.page.locator('input[type="file"]').first();
    await input.setInputFiles(path.resolve(filePath));
  }

  async submit() {
    const candidates = [
      this.page.getByRole('button', { name: /validate|next|import|submit|upload/i }).last(),
      this.page.locator('button[type="submit"]').last()
    ];
    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        return;
      }
    }
    throw new Error('Import wizard submit button not found');
  }
}

module.exports = { UploadWizardPage };

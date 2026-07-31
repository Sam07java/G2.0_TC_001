const { UploadWizardPage } = require('./uploadWizardPage');

class ModuleImportPage {
  constructor(page, moduleConfig) {
    this.page = page;
    this.module = moduleConfig;
    this.wizard = new UploadWizardPage(page);
  }

  async open() {
    await this.page.goto(this.module.url, { waitUntil: 'domcontentloaded' });
  }

  async importFile(filePath) {
    await this.open();
    await this.wizard.openImport(this.module.import_labels || ['Import']);
    await this.wizard.upload(filePath);
    await this.wizard.submit();
  }
}

module.exports = { ModuleImportPage };

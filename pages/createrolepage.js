import { expect } from '@playwright/test';

export default class adcreateRolePage {
    constructor(page) {
        this.page = page;
        this.createrolemenu = 'Create Roles', { exact: true };
        this.createsubadminoption = 'Create Sub-Admin', { exact: true };
        this.searchoption='Fill from teacher directory (optional)';
        this.privilegeCheckbox = (privilege) =>
        this.page.locator(`label:has(span:text-is("${privilege}")) input[type="checkbox"]`);
        this.createsubadmin=`button:has-text("Create Sub-Admin")`;
        this.subadminpassword1='Their password';
}
async navigatetocreaterolemenu() {
    await this.page.getByText(this.createrolemenu).click();
}
async navigatetocreatesubadminoption() {
    await this.page.getByText(this.createsubadminoption).first().click();       
}
async navigatetosearchoption() {
    await this.page.getByLabel(this.searchoption).click();
    await this.page.getByLabel(this.searchoption).fill('Arathi Shiva Prasad');
    await this.page
        .getByText('Arathi Shiva Prasad', { exact: false })
        .first()
        .waitFor();
    await this.page
        .getByText('Arathi Shiva Prasad', { exact: false })
        .first()
        .click();

}

async selectPrivileges(data) {
    for (const privilege of data.privileges) {
        await this.privilegeCheckbox(privilege).check();
    }
}
async subadminpassword(){
    await this.page.getByPlaceholder(this.subadminpassword1).fill('password123')
}

async clickcreatesubadmin(){
    const button = this.page.locator('button:has-text("Create Sub-Admin")').last();

    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await button.click();
    await this.page.waitForTimeout(3000);
}

}
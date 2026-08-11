import { expect } from "@playwright/test";
export class TransferCertificatePage {

    constructor(page) {
        this.page = page;
        this.createButtonElement = 'Generate New Certificate'

        this.admissionNumberInput = 'Exact admission no.'
        this.searchButtonElement = 'Search'
    }

    async clickOnCreateButton() {
        await this.page.getByText(this.createButtonElement).click()
    }

    async entertheAdmission(admissionNumber) {
        await this.page.getByPlaceholder(this.admissionNumberInput).fill(admissionNumber)
    }

    async clickOnSearchButton() {
        await this.page.getByText(this.searchButtonElement).last().click()
    }


    async verifyStudentDetailsFetched() {
        // const studentNameField = this.page
        // .locator('div')
        // .filter({ hasText: 'Full Name' })
        // .locator('input');
        // return studentNameField;
        // console.log('Student Name Field:', studentNameField);

        
    }


    async fillTransferCertificateForm() {}

    async verify_TC_Creation_Success() {
        const successMessage = await this.page.locator('text=Transfer Certificate created successfully').isVisible();
        expect(successMessage).toBeTruthy();
    }

}
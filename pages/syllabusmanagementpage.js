import { expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export default class subjectmanagement {
    constructor(page) {
        this.page = page;
        this.adminstrationoption='Administration', { exact: true };
        this.syllabusmanagementoption='Syllabus Management', { exact: true };
        this.clickonmanagesubjects='Click to manage subjects', { exact: true };
        this.templatebutton='Template', { exact: true };
        this.bulkimportbutton = this.page.getByRole('button', { name: 'Bulk Import' });
        this.choosefileoption='textbox';
        this.importsubjectbutton='Import Subjects';
        
       
}
async navigatetoadminstration(){
    await this.page.getByText(this.adminstrationoption).click();
}
async navigatetosyllabusmanagement(){
    await this.page.getByText(this.syllabusmanagementoption).click();
    
}
 async navigateToClass(className) {
        await this.page
            .getByRole('heading', { name: className, exact: true })
            .click();
    }
 async downloadTemplate(){
        const downloadPromise = this.page.waitForEvent('download');
        await this.page.getByText(this.templatebutton).click();
        const download = await downloadPromise;
        const filePath = path.join(process.cwd(), 'templates', 'SubjectTemplate.xlsx');
        await download.saveAs(filePath);
        console.log(`Template saved at: ${filePath}`);
        return filePath;
 }
 async importSubjects() {
    await this.bulkimportbutton.click();

    const filePath = path.join(
        process.cwd(),
        'testData',
        'subjects-template.csv'
    );

    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole(this.choosefileoption).click();
    await this.page.getByText(this.importsubjectbutton).nth(1).click();
}
async validatesubject() {
    await expect(
        this.page.getByText('Mathematics', { exact: true })
    ).toBeVisible();
}

}

import { expect } from '@playwright/test';
import path from 'path';

export default class HomeWorkCreation {
     constructor(page) {
        this.page = page;
        this.adminstrationoption='Administration', { exact: true };
        this.homeworkoption='Homework', { exact: true };
        this.createhomeworksinglesubjectbutton='Single-subject', { exact: true };
      
        
}
async navigatetoadminstration(){
    await this.page.getByText(this.adminstrationoption).click();
}
async navigatetoHomework(){
    await this.page.getByText(this.homeworkoption).click();
}
async navigatetocreatehomeworkforsinglesubject(){
    await this.page.getByText(this.createhomeworksinglesubjectbutton).click();
}
async selectclass() {
    await this.page.locator('select').first().selectOption({
        label: 'Class 10'
    });
}
async selectsection(){
    await this.page.locator('select').nth(1).selectOption({
        label: 'A'
    });
}
/*async selectSubject() {
    const subjectDropdown = this.page.locator('select').nth(2);

    await expect(subjectDropdown).toBeEnabled();
    await subjectDropdown.selectOption({
        label: 'Artificial Intelligence'
    });

}
*/
async addtitle(){
     await this.page.locator('input').nth(1).fill('Introduction to Genetics');
} 
async addContent(){
     await this.page.locator('textarea').nth(0).fill(
    'Write a short note on genetics .'
);
}
async uploadImage() {
    const imagePath = path.join(
        process.cwd(),
        'testData',
        'Images',
        'AI.jpg'
    );
    await this.page
        .locator('input[type="file"][accept="image/*"]')
        .setInputFiles(imagePath);
}
async uploadDocument() {
    const docPath = path.join(
        process.cwd(),
        'testData',
        'Documents',
        'ArtificialIntelligence.pdf'
    );

    const documentInput = this.page.locator('input[type="file"]').nth(1);
    await expect(documentInput).toBeAttached();
    await documentInput.setInputFiles(docPath); 
}
async publishhomework() {
    await this.page.getByRole('button', { name: 'Publish homework' }).click();
}
}

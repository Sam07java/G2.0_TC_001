import {test, expect} from '@playwright/test'
export class RegisteredStudentListPage {
    constructor(page) {
        this.page = page;
        this.registeredStudentListPageHeader = '.min-w-full.divide-y.divide-gray-200'
        this.registeredStudentListTable = 'table'
        this.registeredStudentListTableRows = 'table tbody tr'
        this.registeredStudentListTableColumns = 'table thead th'


        this.searchTextBox = 'Search by name, form no, class...'
        this.registredstudentName = 'table tbody tr td'
        // this.moveToAdmissionButton = ''
    }




    async  getTheNameOfRegisteredStudentListPage(SearchStudent) {
        
        console.log('Searching for student:', SearchStudent);
        await this.page.waitForSelector(this.registeredStudentListPageHeader)
        await this.page.getByPlaceholder(this.searchTextBox).fill(SearchStudent)

        const registeredStudentRow = await this.page.locator(this.registredstudentName)
        .filter({ hasText: SearchStudent })
        .textContent();

        console.log('Registered Student Row:', registeredStudentRow);

        return registeredStudentRow;
    }

    async clickOnMoveToAdmissionButton(SearchStudent) {
    
        const registeredStudentRowToadmission = await this.page
        .locator(this.registeredStudentListTableRows)
        .filter({ hasText: SearchStudent })
        
        await registeredStudentRowToadmission.locator('button[title="Move to Admission"]').click()  

        await this.page.locator('button').filter({ hasText: 'Move to Admission' }).click()
    
    }
    
    async verify_RegisteredStudent_PresentInList(SearchStudent) {
        const registeredStudentRow = await this.getTheNameOfRegisteredStudentListPage(SearchStudent);    
    }


    // async click_on_MoveToAdmission_Button(SearchStudent) {
    //     console.log('Searching for student:', SearchStudent);
    //     // await this.page.waitForSelector(this.registeredStudentListPageHeader)
    //     // await this.page.getByPlaceholder(this.searchTextBox).fill(SearchStudent)

    //     const registeredStudentRow = await this.page.locator(this.registredstudentName).filter({ hasText: SearchStudent }).textContent();

    //     console.log('Registered Student Row:', registeredStudentRow);

        
    // }

}
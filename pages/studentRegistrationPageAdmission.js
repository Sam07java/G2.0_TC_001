import ScreenshotHelper from '../utility/screenshotHelper';
import { expect } from '@playwright/test';
exports.studeregistrationPageAdmission = class studeregistrationPageAdmission {
    constructor(page) {
        this.page = page;
        this.branchNameElement = 'input[name="branchName"]';
        this.fullNameElement = 'Enter name in BLOCK LETTERS';
        this.admissionNoElement = 'input[name="admissionNo"]';
        this.dateofBirth = 'input[name="dateOfBirth"]';
        this.classElement = 'select[name="admitSession.class"]';
        this.classEction = 'select[name="admitSession.section"]';
        this.nextButton = 'button:has-text("Next")'
        this.sameAsAbouveCheckbox = '#sameAsAdmissionSession'
        this.fatherNameElement = 'input[name="father.name"]'
        this.fatherContactNameElement = 'input[name="father.contactNumber"]'
        this.motherNameElement = 'input[name="mother.name"]'
        this.motherContactElement = 'input[name="mother.contactNumber"]'
        this.cityElement = 'input[name="address.city"]'
        this.stateElement = 'select[name="address.state"]'
        this.completeRegistrationButton = 'button:has-text("Complete Registration")'
        // this.successMessageElement = 'button:has-text("Print Form")'
    }

    //  Branch Name
    async enter_the_BranchName(branchName) {
        console.log(`Entering Branch Name: ${branchName}`);
        await this.page.locator(this.branchNameElement).fill(branchName);
        console.log(` Branch Name entered successfully`);
    }

    //  Full Name
    async enter_the_FullName(fullName) {
        console.log(`Entering Full Name: ${fullName}`);
        await this.page.getByPlaceholder(this.fullNameElement).fill(fullName);
        console.log(` Full Name entered successfully`);
    }

    //  Admission Number
    async enter_the_AddmisionNumber(admissionNumber) {
        console.log(` Entering Admission Number: ${admissionNumber}`);
        await this.page.locator(this.admissionNoElement).fill(admissionNumber);
        console.log(` Admission Number entered successfully`);
    }

    //  Date Of Birth
    async enter_the_DOB(dob) {
        console.log(` Entering Date Of Birth: ${dob}`);
        await this.page.locator(this.dateofBirth).fill(dob);
        console.log(` DOB entered successfully`);
    }

    //  Select Class
    async select_class(cla) {
        console.log(` Selecting class: ${cla}`);
        await this.page.locator(this.classElement).nth(0).selectOption(cla);
        console.log(` Class selected successfully`);
    }

    async select_section(section) {
        console.log(` Selecting section: ${section}`);
        await this.page.locator(this.classEction).selectOption(section);
        console.log(` Section selected successfully`);
    }

    async click_on_sameAsAbove_Checkbox() {
        console.log(` Clicking on Same As Above Checkbox`);
        await this.page.locator(this.sameAsAbouveCheckbox).click();
        console.log(` Same As Above Checkbox clicked successfully`);
    }

    async enter_the_FatherName(fatherName) {
        console.log(` Entering Father Name: ${fatherName}`);
        await this.page.locator(this.fatherNameElement).fill(fatherName);
        console.log(` Father Name entered successfully`);
    }

    async enter_the_FatherContactNumber(fatherContactNumber) {
        console.log(` Entering Father Contact Number: ${fatherContactNumber}`);
        await this.page.locator(this.fatherContactNameElement).fill(fatherContactNumber);
        console.log(` Father Contact Number entered successfully`);
    }

    async enter_the_MotherName(motherName) {
        console.log(` Entering Mother Name: ${motherName}`);
        await this.page.locator(this.motherNameElement).fill(motherName);
        console.log(` Mother Name entered successfully`);
    }

    async enter_the_MotherContactNumber(motherContactNumber) {
        console.log(` Entering Mother Contact Number: ${motherContactNumber}`);
        await this.page.locator(this.motherContactElement).fill(motherContactNumber);
        console.log(` Mother Contact Number entered successfully`);
    }

    async enter_the_City(city) {
        console.log(` Entering City: ${city}`);
        await this.page.locator(this.cityElement).fill(city);
        console.log(` City entered successfully`);
    }

    async enter_the_State(state) {
        console.log(` Entering State: ${state}`);
        await this.page.locator(this.stateElement).selectOption(state);
        console.log(` State entered successfully`);
    }

    async click_on_next_Button() {
        console.log(` Clicking on Next Button`);
        await this.page.locator(this.nextButton).nth(0).click();
        console.log(` Next Button clicked successfully`);
    }

    async click_on_Complete_Registration_Button() {
        console.log(` Clicking on Complete Registration Button`);
        await this.page.locator(this.completeRegistrationButton).nth(0).click();
        console.log(` Complete Registration Button clicked successfully`);
    }

    async verify_Student_Creation_Success() {
        // await this.page.waitForTimeout(1000)
        // const successMessage =  this.page.getByRole('heading', { name: 'Registration Successful!' })
       
        try {
            await expect(this.page.getByRole('heading', { name: 'Registration Successful!' })).toBeVisible();
            console.log(` Student created successfully`);

        } catch (error) {
            await ScreenshotHelper.capture(this.page, 'Student_Creation_Failed');
            throw new Error('Failed to create student');
        }
    }
}
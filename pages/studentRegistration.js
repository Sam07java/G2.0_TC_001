import { expect } from '@playwright/test';
exports.studeregistrationPage = class studeregistrationPage {

    constructor(page){
        this.page = page;
        this.fullName = 'Enter student full name'
        this.registrationDate = 'input[name="regnDate"]'
        this.RegistrationForClass = 'select[name="registerForClass"]'
        this.FormNumberGeneratedButton = 'Generate'
        this.student_DOB = 'input[name="dob"]'
        this.nextButton = 'Next'
        this.student_registration_element = 'Registration'

        this.fatherNameElement = 'input[name="fatherName"]'
        this.fatherContactNumberElement = 'input[name="fatherMobileNo"]'
        this.fatherEmailElement = 'input[name="fatherEmail"]'
        this.motherNameElement = 'input[name="motherName"]'
        this.motherContactNumberElement = 'input[name="motherMobileNo"]'
       
       
        this.contactNumberElement = 'input[name="contactNo"]'
        this.studentEmailElement = 'input[name="studentEmail"]'
        this.addressElement = 'input[name="address"]'
        this.cityElement = 'input[name="city"]'
        this.stateElement = 'input[name="state"]'

        this.previousSchoolElement = 'input[name="previousSchoolName"]'

        this.registerStudentButton = 'Register Student'
    
    }

    async enter_the_FullName(fullName){
        await this.page.getByPlaceholder(this.fullName).fill(fullName)
        console.log(`Full Name entered successfully: ${fullName}`)
    }

    async enter_the_RegistrationDate(registrationDate){
        await this.page.locator(this.registrationDate).fill(registrationDate)
        console.log(`Registration Date entered successfully: ${registrationDate}`)
    }

    async select_the_Class(RegistrationForClass){
        await this.page.locator(this.RegistrationForClass).selectOption(RegistrationForClass)
        console.log(`Class selected successfully: ${RegistrationForClass}`)
    }

    async click_on_the_FormNumberGeneratedButton(){
        await this.page.getByText(this.FormNumberGeneratedButton).click()
        console.log('Form Number Generated button clicked successfully')
    }

    async verify_FormNumberGenerated(){
        const formNumber = await this.page.locator('input[name="formNo"]').inputValue()
        expect(formNumber).not.toBe('')
        console.log(`Form Number generated successfully: ${formNumber}`)
    }


    async enter_the_DOB(student_DOB){
        await this.page.locator(this.student_DOB).fill(student_DOB)
        console.log(`Date of Birth entered successfully: ${student_DOB}`)
    }

    async enter_the_FatherName(fatherName){
        await this.page.locator(this.fatherNameElement).fill(fatherName)
        console.log(`Father's Name entered successfully: ${fatherName}`)
    }

    async enter_the_FatherContactNumber(fatherContactNumber){
        await this.page.locator(this.fatherContactNumberElement).fill(fatherContactNumber)
        console.log(`Father's Contact Number entered successfully: ${fatherContactNumber}`)
    }

    async enter_the_MotherName(motherName){
        await this.page.locator(this.motherNameElement).fill(motherName)
        console.log(`Mother's Name entered successfully: ${motherName}`)
    }

    async enter_the_MotherContactNumber(motherContactNumber){
        await this.page.locator(this.motherContactNumberElement).fill(motherContactNumber)
        console.log(`Mother's Contact Number entered successfully: ${motherContactNumber}`)
    }

    async enter_the_contactNumber(contactNumber){
        await this.page.locator(this.contactNumberElement).fill(contactNumber)
        console.log(`Contact Number entered successfully: ${contactNumber}`)
    }

    async enter_the_studentEmail(studentEmail){
        await this.page.locator(this.studentEmailElement).fill(studentEmail)
        console.log(`Student Email entered successfully: ${studentEmail}`)
    }

    async enter_the_address(address){
        await this.page.locator(this.addressElement).fill(address)
        console.log(`Address entered successfully: ${address}`)
    }

    async enter_the_City(city){
        await this.page.locator(this.cityElement).fill(city)
        console.log(`City entered successfully: ${city}`)
    }

    async enter_the_State1(state){
        await this.page.locator(this.stateElement).fill(state)
        console.log(`State selected successfully: ${state}`)
    }

    async enter_the_PreviousSchool(previousSchool){
        await this.page.locator(this.previousSchoolElement).fill(previousSchool)
        console.log(`Previous School entered successfully: ${previousSchool}`)
    }
    
    async verify_Student_Creation_Success(){
        const successMessage = await this.page.getByRole('button', { name: 'Register Student' })
        expect(successMessage).toBeTruthy()
        console.log('Student registration successful')
    }

    async click_on_the_RegisterStudent_Button(){
        await this.page.getByText(this.registerStudentButton).click()
        console.log('Register Student button clicked successfully')
    }

    async click_on_the_next_Button(){
        await this.page.getByText(this.nextButton).click()
        console.log('Next button clicked successfully')
    }


}
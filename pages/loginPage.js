const { expect } = require('@playwright/test');
import ScreenshotHelper from '../utility/screenshotHelper';
//exports.loginPage = class loginPage 
export default class LoginPage
{
    constructor(page){
        this.page = page;
        this.instituteLoginElementButton = 'Institute Login'
        this.EmailTextFieldElement = '#institute-login-email'
        this.PasswordFieldElement = '#institute-login-password'
        this.SignInButtonElement = 'button[type="submit"]'
        this.profilButtonElement = 'Toggle profile dropdown'
        this.signoutButton = 'Sign out'
        this.loginSuccessElement = 'Analytics Dashboard'

        //Staff web elements
        this.staffLoginButton  = 'button:has-text("Teacher Login")';
        //common to all login
        this.username = '[name="email"]';
        this.password = '[name="password"]';
        this.loginButton = 'button:has-text("Sign In")';
        this.stafflogintext = 'Teacher Portal';

        //parent web elements
        this.parentLoginButton = 'button:has-text("Parent Login")';
        this.parentlogintext = 'Parent Portal';

        //Student web elements
        this.studentLoginButton = 'button:has-text("Student Login")';
        this.studentlogintext = 'Student Portal';

        this.errormessageElement = '.error-message'
    }

    async click_on_institute_Button(){
       await this.page.getByText(this.instituteLoginElementButton).click()
    }

    async enter_Login_Data(email,password){
       await this.page.locator(this.EmailTextFieldElement).fill(email)
       await this.page.keyboard.press('Tab')
       await this.page.locator(this.PasswordFieldElement).fill(password)
       await this.page.locator(this.SignInButtonElement).click()
    }

    async logout(){

        await this.page.getByLabel(this.profilButtonElement).click()
        await this.page.getByText(this.signoutButton).click()
    }

    async verify_Login_Success(){
          const successmessage =this.page.locator('h1', { hasText: this.loginSuccessElement })
        try {
            await expect(successmessage).toBeVisible();
            console.log("Login successful!");
        } catch (error) {
            await ScreenshotHelper.capture(this.page, 'Login_Failed');
            const errorMessage = await this.page.locator(this.errormessageElement).textContent();
            throw new Error(`Login failed! ${errorMessage}`);
        }

    }

    //staff login methods
    async navigateToStaffLoginbutton() {
        await this.page.locator(this.staffLoginButton).click();
    }
    async enterStaffEmail(emails) {
        await this.page.locator(this.username).fill(emails);
        await this.page.keyboard.press('Tab');
    }
    async enterStaffPassword(passwords) {
        await this.page.locator(this.password).fill(passwords);
    }
    async StaffLoginbutton() {
        await this.page.locator(this.loginButton).click();
        await this.page.waitForLoadState('networkidle');
    }

    //parent login methods
    async navigateToParentLoginbutton() {
        await this.page.locator(this.parentLoginButton).click();
    }   
    async enterParentEmail(emailp) {
        await this.page.locator(this.username).fill(emailp);
        await this.page.keyboard.press('Tab');
    }
    async enterParentPassword(passwordp) {
        await this.page.locator(this.password).fill(passwordp);
    }
    async parentLoginbutton() {
        await this.page.locator(this.loginButton).click();
        await this.page.waitForLoadState('networkidle');
    }

    //Student login methods
    async navigateToStudentLoginbutton() {
        await this.page.locator(this.studentLoginButton).click();
    }   
    async enterStudentEmail(emailss) {
        await this.page.locator(this.username).fill(emailss);
        await this.page.keyboard.press('Tab');
    }
    async enterStudentPassword(passwordss) {
        await this.page.locator(this.password).fill(passwordss);
    }
    async studentLoginbutton() {
        await this.page.locator(this.loginButton).click();
        await this.page.waitForLoadState('networkidle');
    }
    //school login 2
    async navigateToInstituteLoginbutton() {
        await this.page.getByText(this.instituteLoginElementButton).click();
    }
    async enterInstituteEmail(email) {
        await this.page.locator(this.username).fill(email);
        await this.page.keyboard.press('Tab');
    }
    async enterInstitutePassword(password) {
        await this.page.locator(this.password).fill(password);
    }
    async schoolLoginbutton() {
        await this.page.locator(this.loginButton).click();
        await this.page.waitForLoadState('networkidle');
    }
    //validation text in login

    async institutloginpagevalidation() {
        await this.page.getByText(this.institutelogintext).isVisible();
        console.log("School Admin login page is validated successfully");
         
    }
    async staffloginpagevalidation() {  
        await this.page.getByText(this.stafflogintext).isVisible();
        console.log("Staff login page is validated successfully");  

    }
    async parentloginpagevalidation() {
        await this.page.getByText(this.parentlogintext).isVisible();
        console.log("Parent login page is validated successfully");

    }
    async studentloginpagevalidation() {
        await this.page.getByText(this.studentlogintext).isVisible();
        console.log("Student login page is validated successfully");

    }
}
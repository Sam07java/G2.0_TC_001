exports.loginPage = class loginPage {
    constructor(page){
        this.page = page;
        this.instituteLoginElementButton = 'Institute Login'
        this.EmailTextFieldElement = 'input[name="email"]'
        this.PasswordFieldElement = 'input[name="password"]'
        this.SignInButtonElement = 'button[type="submit"]'
        this.profilButtonElement = 'Toggle profile dropdown'
        this.signoutButton = 'Sign out'

    }

    async click_on_institute_Button(){
       await this.page.getByText(this.instituteLoginElementButton).click()
    }

    async enter_Login_Data(email,password){
       await this.page.locator(this.EmailTextFieldElement).fill(email)
       await this.page.locator(this.PasswordFieldElement).fill(password)
       await this.page.locator(this.SignInButtonElement).click()
    }

    async logout(){

        await this.page.getByLabel(this.profilButtonElement).click()
        await this.page.getByText(this.signoutButton).click()
    }

    

}
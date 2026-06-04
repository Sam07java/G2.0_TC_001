exports.TeacherCreationPage = class TeacherCreationPage {
    constructor(page) {
        this.page = page;
        // Define locators for teacher creation form elements here
        this.addButton = "button[title='Add new teacher']"
        this.profilePictureUpload = 'input[type="file"]'
        this.fullNameInput = 'input[type="text"]';
        this.emailInput = 'input[type="email"]';
        this.phoneInput = 'input[type="tel"]';
        // this.genderSelect = 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300';
        this.nextButton = 'Next';

    }   

    async click_on_Add_Button() {
        console.log(`➡️ Clicking on Add Button`);
        await this.page.locator(this.addButton).click();
        console.log(`✅ Add Button clicked successfully`);
    }

    async upload_Profile_Picture(filePath) {
        console.log(`➡️ Uploading profile picture from: ${filePath}`);
        await this.page.setInputFiles(this.profilePictureUpload, filePath);
        console.log(`✅ Profile picture uploaded successfully`);
    }

    async enter_FullName(name) {
        console.log(`➡️ Entering full name: ${name}`);
        await this.page.locator(this.fullNameInput).nth(1).fill(name);
        console.log(`✅ Full name entered successfully`);
    }

    async enter_Email(email) {
        console.log(`➡️ Entering email: ${email}`);
        await this.page.locator(this.emailInput).fill(email);
        console.log(`✅ Email entered successfully`);
    }

    async enter_Phone(phone) {
        console.log(`➡️ Entering phone number: ${phone}`);
        await this.page.locator(this.phoneInput).fill(phone);
        console.log(`✅ Phone number entered successfully`);
    }


    async selectClass(page, className, sectionName) {

   
        let classLocator = await page.locator('div.border.rounded-md.p-4')
   
        .filter({ hasText: className })
   
        .getByRole('checkbox')
    
        .check();
   
        console.log(`✅ Class "${className}" selected successfully`);

        await classLocator.locator('div.grid.grid-cols-2.gap-2')
        .filter({ hasText: sectionName })
        .getByRole('checkbox')
        .check();

        console.log(`✅ Section "${sectionName}" selected successfully`);

    }

    async click_on_Next_Button() {
        console.log(`➡️ Clicking on Next Button`);
        await this.page.getByText(this.nextButton).nth(0).click();
        console.log(`✅ Next Button clicked successfully`);
    }



}
exports.TeacherCreationPage = class TeacherCreationPage {
    constructor(page) {
        this.page = page;
        // Define locators for teacher creation form elements here
        this.addButton = "Add staff"
        this.profilePictureUpload = 'input[type="file"]'
        this.fullNameInput = 'input[type="text"]';
        this.emailInput = 'input[type="email"]';
        this.phoneInput = 'input[type="tel"]';
        // this.genderSelect = 'w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300';
        this.nextButton = 'Next';
        this.addTeacherButton = 'Add Teacher'
        this.addTeachingstaff = 'Add teaching staff'
        this.genderSelect = 'select[name="gender"]';

    }   

    async click_on_Add_Button() {
        console.log(`➡️ Clicking on Add Button`);
        await this.page.getByText(this.addButton).click();
        console.log(`✅ Add Button clicked successfully`);
    }

    async click_on_Add_TeachingStaff_Button() {
        console.log(`➡️ Clicking on Add Teaching Staff Button`);
        await this.page.getByText(this.addTeachingstaff).click();
        console.log(`✅ Add Teaching Staff Button clicked successfully`);   
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
        await this.page.locator(this.emailInput).first().fill(email);
        console.log(`✅ Email entered successfully`);
    }

    async enter_Phone(phone) {
        console.log(`➡️ Entering phone number: ${phone}`);
        await this.page.locator(this.phoneInput).fill(phone);
        console.log(`✅ Phone number entered successfully`);
    }

    async selectGender(gender) {
        console.log(`➡️ Selecting gender: ${gender}`);

        await this.page.locator(this.genderSelect).selectOption({ label: gender });
        console.log(`✅ Gender selected successfully`);
    }

    async selectClass(page, className, sectionName, subjectName) {

        let classLocator = page.locator('div.border.rounded-md.p-4').filter({ hasText: className })
       
        //Class selection
        await classLocator.locator('label').first().getByRole('checkbox').check();
   
        console.log(`✅ Class "${className}" selected successfully`);

        //Section selection
        await classLocator.locator('label').filter({ hasText: sectionName }).getByRole('checkbox').check();

        console.log(`✅ Section "${sectionName}" selected successfully`);
        
        //Subject selection
        const subjectInput =classLocator.getByPlaceholder('Subjects');
        await subjectInput.click();
        const subjectOption =classLocator.getByRole('button', {name: subjectName});

        if (await subjectOption.count()) {
            await subjectOption.first().click();
            console.log(`✅ Existing subject "${subjectName}" selected`);
        } else {
            await subjectInput.pressSequentially(subjectName);
            await page.keyboard.press('Enter');
            console.log(`✅ Custom subject "${subjectName}" added`);
        }

        console.log(`✅ Subject "${subjectName}" selected successfully`);
    }

    async click_on_Next_Button() {
        console.log(`➡️ Clicking on Next Button`);
        await this.page.getByText(this.nextButton).nth(0).click();
        console.log(`✅ Next Button clicked successfully`);
    }

    async click_on_Add_Teacher_Button() {
        console.log(`➡️ Clicking on Add Teacher Button`);
        await this.page.getByText(this.addTeacherButton).click();
        console.log(`✅ Add Teacher Button clicked successfully`);
    }
    
    async verify_Teacher_Creation_Success() {
        console.log(`➡️ Verifying teacher creation success`);
        
    }

}
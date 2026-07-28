exports.ClassManagementPage = class ClassManagementPage {

    constructor(page){
        this.page = page;
        this.addClassButtonElement = 'Add Class'
        this.classNameFieldElement = '#class-name'
        this.classSectionFieldElement = '#class-section'
        this.classCapacityFieldElement = '#class-capacity'
        this.submitButtonElement = 'button[type="submit"]'
        this.successMessageElement = '.success-message'

        this.importClassButtonElement = 'Import'
        this.searchClassFieldElement = 'Search classes...'
        this.uploadFileInputElement = '.hidden'
    }

    async click_on_ImportClass_Button(){
        await this.page.getByText(this.importClassButtonElement).click()
        console.log("Clicked on Import Class button")
    }

    async search_for_Class(className){
        await this.page.getByPlaceholder(this.searchClassFieldElement).fill(className)
        console.log(`Searched for class: ${className}`)
    }

    async upload_Class_File(filePath){
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.page.getByText('Upload').click()
        ]);
        await fileChooser.setFiles(filePath);
        console.log(`Uploaded class file: ${filePath}`)
    }

}
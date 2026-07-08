exports.institutedashboardpage = class institutedashboardpage {

    constructor(page){
        this.page = page;
        this.Student_Management_element = 'Student Management'
        this.AdmissionElement = 'Admission'
        this.Faculty_Management_Element = 'Faculty Management'
        this.Teacher_Directory_Element = 'Staff directory'
    }

    async navigateTostudent_RegistrationPage(){
        await this.page.getByText(this.Student_Management_element).click()
        await this.page.getByText(this.AdmissionElement).first().click()
    }

    async navigateToTeacher_CreationPage(){
        await this.page.getByText(this.Faculty_Management_Element).click()
        await this.page.getByText(this.Teacher_Directory_Element).click()
    }
}
exports.institutedashboardpage = class institutedashboardpage {

    constructor(page){
        this.page = page;
        this.Student_Management_element = 'Student Management'
        this.AdmissionElement = 'Admission'
        this.Faculty_Management_Element = 'Faculty Management'
        this.Teacher_Directory_Element = 'Staff directory'
        this.student_registration_element = 'Registration'
        this.Class_Management_Element = 'Class Management'
        this.administror_Management_Element = 'Administration'

        this.registredStudentlistpage = 'All Registered Students'

        this.certificate_Management_Element = 'Certificate Management'
        this.TC_Element = 'Transfer Certificate'
    }

    async navigateTostudent_RegistrationPageAdmission(){
        await this.page.getByText(this.Student_Management_element).click()
        await this.page.getByText(this.AdmissionElement).first().click()
    }

    async navigateToTeacher_CreationPage(){
        await this.page.getByText(this.Faculty_Management_Element).click()
        await this.page.getByText(this.Teacher_Directory_Element).click()
    }

    async navigateTostudent_RegistrationPage(){
        await this.page.getByText(this.Student_Management_element).click()
        await this.page.getByText(this.student_registration_element).click()
    }

    async navigateToClass_ManagementPage(){
        await this.page.getByText(this.administror_Management_Element).click()
        await this.page.getByText(this.Class_Management_Element).click()
    }

    async navigateToStudentRegistrationListPage(){
        await this.page.getByText(this.Student_Management_element).click()
        await this.page.getByText(this.registredStudentlistpage).click()
    }

    async navigateToTCpage(){
        await this.page.getByText(this.certificate_Management_Element).click()
        await this.page.getByText(this.TC_Element).nth(1).click()
    }
}
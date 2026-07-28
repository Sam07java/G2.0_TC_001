import {test, expect} from '@playwright/test'
import { landingPage } from '../../pages/landingPage.js'
require('dotenv').config();
import { loginPage } from '../../pages/loginPage.js';
import { institutedashboardpage } from '../../pages/instituteDashboardPage.js';
import { studeregistrationPageAdmission } from '../../pages/studentRegistrationPageAdmission.js';
import studentcreationData from '../../testData/studentcreation.json'
const { TeacherCreationPage } = require('../../pages/teacher_creation_page.js');




test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)
   const loginpage = new loginPage(page)
   await institutepage.gettheURL()
   await loginpage.click_on_institute_Button()
   await page.waitForTimeout(2000)
   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)
   await loginpage.verify_Login_Success()

})

// test.afterEach(async({page})=>{
    
//    const loginpage = new loginPage(page)
//    await loginpage.logout()
//    await page.pause()

// })


test("Create new student profile through institute portal", async({page})=>{
      const institutedashboardPage = new institutedashboardpage(page)
      await institutedashboardPage.navigateTostudent_RegistrationPageAdmission()
      const studentRegistrationPageAdmission  = new studeregistrationPageAdmission(page)
      await page.waitForTimeout(500)

      //First page of student registration form - Personal details page.
      await studentRegistrationPageAdmission.enter_the_FullName(studentcreationData.studentData.firstName + ' ' + studentcreationData.studentData.lastName)
      await studentRegistrationPageAdmission.enter_the_DOB(studentcreationData.studentData.dateOfBirth)
      await page.waitForTimeout(1500)
      await studentRegistrationPageAdmission.click_on_next_Button()

      // Second page of student registration form - Academic details page.
      await studentRegistrationPageAdmission.select_class(studentcreationData.studentData.CurrentClass)
      await studentRegistrationPageAdmission.select_section('B')
      await studentRegistrationPageAdmission.click_on_sameAsAbove_Checkbox()
      await studentRegistrationPageAdmission.click_on_next_Button()

      // Third page of student registration form - Parent's details page.
      await studentRegistrationPageAdmission.enter_the_FatherName('John Doe')
      await studentRegistrationPageAdmission.enter_the_FatherContactNumber('1234567890')
      await studentRegistrationPageAdmission.enter_the_MotherName('Elisabth Doe')
      await studentRegistrationPageAdmission.enter_the_MotherContactNumber('0987654321')
      await studentRegistrationPageAdmission.click_on_next_Button()
      
      // Next for contact page 
      await studentRegistrationPageAdmission.click_on_next_Button()

      //Address details page
      await studentRegistrationPageAdmission.enter_the_City('Bangalore')
      await studentRegistrationPageAdmission.enter_the_State('Karnataka')
      await studentRegistrationPageAdmission.click_on_next_Button()

      //Skip the document upload page and Submit the form
      await studentRegistrationPageAdmission.click_on_next_Button()

      //Click on complete registration button
      await studentRegistrationPageAdmission.click_on_Complete_Registration_Button()   

      //Validation for successful student registration can be added here by checking the success message.   
      await page.waitForTimeout(1000)  
      await studentRegistrationPageAdmission.verify_Student_Creation_Success()

})





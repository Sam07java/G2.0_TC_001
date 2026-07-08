import {test, expect} from '@playwright/test'
import { landingPage } from '../pages/landingPage'
require('dotenv').config();
import { loginPage } from '../pages/loginPage';
import { institutedashboardpage } from '../pages/instituteDashboardPage';
import { studeregistrationPage } from '../pages/studentRegistrationPage';
import studentcreationData from '../testData/studentcreation.json'
const { TeacherCreationPage } = require('../pages/teacher_creation_page');




test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)

   const loginpage = new loginPage(page)

   await institutepage.gettheURL()
   //    await institutepage.click_on_start_Buttton()

   await loginpage.click_on_institute_Button()

   await page.waitForTimeout(2000)

   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)


   // await page.pause()

})

// test.afterEach(async({page})=>{
    
//    const loginpage = new loginPage(page)
//    await loginpage.logout()
//    await page.pause()

// })


test.skip("Create new student profile through institute portal", async({page})=>{
      const institutedashboardPage = new institutedashboardpage(page)
      await institutedashboardPage.navigateTostudent_RegistrationPage()

      const studentRegistrationPage  = new studeregistrationPage(page)

      await page.waitForTimeout(500)

      //First page of student registration form - Personal details page.
      // await studentRegistrationPage.enter_the_BranchName('QWW')
      await studentRegistrationPage.enter_the_FullName(studentcreationData.studentData.firstName + ' ' + studentcreationData.studentData.lastName)

      await studentRegistrationPage.enter_the_DOB(studentcreationData.studentData.dateOfBirth)

      await page.waitForTimeout(1500)

      await studentRegistrationPage.click_on_next_Button()

      
      // Second page of student registration form - Academic details page.
      await studentRegistrationPage.select_class(studentcreationData.studentData.CurrentClass)
      await studentRegistrationPage.select_section('B')

      await studentRegistrationPage.click_on_sameAsAbove_Checkbox()
      await studentRegistrationPage.click_on_next_Button()

      // Third page of student registration form - Parent's details page.
      await studentRegistrationPage.enter_the_FatherName('John Doe')
      await studentRegistrationPage.enter_the_FatherContactNumber('1234567890')
      await studentRegistrationPage.enter_the_MotherName('Elisabth Doe')
      await studentRegistrationPage.enter_the_MotherContactNumber('0987654321')

      await studentRegistrationPage.click_on_next_Button()
      
      // Next for contact page 
      await studentRegistrationPage.click_on_next_Button()

      //Address details page
      await studentRegistrationPage.enter_the_City('Bangalore')
      await studentRegistrationPage.enter_the_State('Karnataka')

      await studentRegistrationPage.click_on_next_Button()

      //Skip the document upload page and Submit the form
      await studentRegistrationPage.click_on_next_Button()

      //Click on complete registration button
      await studentRegistrationPage.click_on_Complete_Registration_Button()   

      //Validation for successful student registration can be added here by checking the success message or redirection to a specific page.   
      await page.waitForTimeout(1000)  
      await studentRegistrationPage.verify_Student_Creation_Success()


      await page.pause()

})

test("Create new teacher profile through institute portal", async({page})=>{
    // Code for teacher creation test case will be added here.
      const institutedashboardPage = new institutedashboardpage(page)
      await institutedashboardPage.navigateToTeacher_CreationPage()

      const teachercreationpage = new TeacherCreationPage(page)
      // await teacherCreationPage.enter_the_BranchName('QWW')
            await teachercreationpage.click_on_Add_Button()

            await teachercreationpage.click_on_Add_TeachingStaff_Button()

            await teachercreationpage.upload_Profile_Picture('C:/Users/WIIS/gyanset_2.0_TC_1.0/image/pic1.jpg')
        
            await teachercreationpage.enter_FullName('Auto PP')

            await teachercreationpage.enter_Email('auto.pp@example.com')
            await teachercreationpage.enter_Phone('1234567890')

            await teachercreationpage.selectGender('Male')

            await teachercreationpage.click_on_Next_Button()
            await teachercreationpage.click_on_Next_Button()

            await teachercreationpage.selectClass(page, 'Class 9', 'Section B', 'Malayalam')

            await teachercreationpage.click_on_Next_Button()
            await teachercreationpage.click_on_Next_Button()

            await teachercreationpage.click_on_Add_Teacher_Button()
            
            await page.pause()

})




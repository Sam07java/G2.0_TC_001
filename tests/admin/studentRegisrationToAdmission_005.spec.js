import {test, expect} from '@playwright/test'
import { landingPage } from '../../pages/landingPage.js'
require('dotenv').config();
import studentcreationData from '../../testData/studentcreationData.json'
import { loginPage } from '../../pages/loginPage.js';
import { institutedashboardpage } from '../../pages/instituteDashboardPage.js'; 
const { studeregistrationPage } = require('../../pages/studentRegistration.js');

test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)
   const loginpage = new loginPage(page)
   await institutepage.gettheURL()
   await loginpage.click_on_institute_Button()
   await page.waitForTimeout(2000)
   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)
   await loginpage.verify_Login_Success()

})

test("Verify student registration through the Registration Form and successful admission.", async({page})=>{

    //Navigate to student registration page through institute dashboard. 
   const institutedashboardPage = new institutedashboardpage(page)
    await institutedashboardPage.navigateTostudent_RegistrationPage()

    //Basic Information of student registration form.
   const studentregistration = new studeregistrationPage(page)
   await studentregistration.enter_the_FullName('ASs')
   await studentregistration.enter_the_RegistrationDate('2026-07-12')
   await studentregistration.select_the_Class('Class 10')
   await studentregistration.click_on_the_FormNumberGeneratedButton()
   await studentregistration.enter_the_DOB('2010-05-15')
   await studentregistration.verify_FormNumberGenerated()
    await studentregistration.click_on_the_next_Button()

   // Siblings and parent details of student registration form.
   await studentregistration.enter_the_FatherName('John Doe')
   await studentregistration.enter_the_FatherContactNumber('1234567890')
   await studentregistration.enter_the_MotherName('Elisabth Doe')
   await studentregistration.enter_the_MotherContactNumber('0987654321')
   await studentregistration.click_on_the_next_Button()

   // Contact details of student registration form.
   await studentregistration.enter_the_contactNumber('1234567890')
   await studentregistration.enter_the_studentEmail('sasha656@yopmail.com')
   await studentregistration.enter_the_address('123 Main Street')
   await studentregistration.enter_the_City('New York')
   await studentregistration.enter_the_State1('NY')
   await studentregistration.click_on_the_next_Button()

   // /Previous School & Source of Admission details of student registration form.
   await studentregistration.enter_the_PreviousSchool('ABC School')

   // Click on Register Student button to submit the student registration form.
   await studentregistration.click_on_the_RegisterStudent_Button()
    

   //Validation of successful submission of student registration form.
   await studentregistration.verify_Student_Creation_Success()
  
    

})
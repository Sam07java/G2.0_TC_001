import {test, expect} from '@playwright/test'
import { landingPage } from '../../pages/landingPage'
require('dotenv').config();
import  LoginPage  from '../../pages/loginPage';
import { institutedashboardpage } from '../../pages/instituteDashboardPage';
import studentcreationData from '../../testData/studentcreation.json'
const { TeacherCreationPage } = require('../../pages/teacher_creation_page');


test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)
   const loginpage = new LoginPage(page)
   await institutepage.gettheURL()
   //    await institutepage.click_on_start_Buttton()
   await loginpage.click_on_institute_Button()
   await page.waitForTimeout(2000)
   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)
   // await page.pause()

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
})

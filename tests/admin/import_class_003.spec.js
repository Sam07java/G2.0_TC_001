import {test, expect} from '@playwright/test'
import { landingPage } from '../../pages/landingPage'
require('dotenv').config();
import { loginPage } from '../../pages/loginPage';
import { institutedashboardpage } from '../../pages/instituteDashboardPage.js';



test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)
   const loginpage = new loginPage(page)

   await institutepage.gettheURL()
   await loginpage.click_on_institute_Button()
   await page.waitForTimeout(2000)
   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)
   await loginpage.verify_Login_Success()
   // await page.pause()

})

test("Verify whether Class is created successfully", async({page})=>{
   
   // navigate to class managment page.
  const instantiatedashboardPage = new institutedashboardpage(page)
   await instantiatedashboardPage.navigateToClass_ManagementPage()

   const classmanagement = new ClassManagementPage(page)
   await classmanagement.click_on_ImportClass_Button()
   await classmanagement.search_for_Class('Class 10')
   await classmanagement.upload_Class_File('tests/testData/class_import.csv')
   await page.waitForTimeout(2000)
   await page.pause()


})


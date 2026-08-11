import {test, expect} from '@playwright/test';
require('dotenv').config();
import { landingPage } from '../../pages/landingPage.js';
import  LoginPage  from '../../pages/loginPage.js';
import { institutedashboardpage } from '../../pages/instituteDashboardPage.js';
import { studeregistrationPageAdmission } from '../../pages/studentRegistrationPageAdmission.js';
import studentcreationData from '../../testData/studentcreation.json';
import { TransferCertificatePage } from '../../pages/transfer_Certificates.js';

test.beforeEach('Institute login', async ({page})=>{

   const institutepage = new landingPage(page)
   const loginpage = new LoginPage(page)
   await institutepage.gettheURL()
   await loginpage.click_on_institute_Button()
   await page.waitForTimeout(2000)
   await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)
   await loginpage.verify_Login_Success()

})

test("Varify that the admin can create a TC", async({page})=>{
        const institutedashboardPage = new institutedashboardpage(page)
        await institutedashboardPage.navigateToTCpage()

        const transferCertificatePage = new TransferCertificatePage(page)
        await transferCertificatePage.clickOnCreateButton()

        await transferCertificatePage.entertheAdmission(studentcreationData.studentData.AdmissionNumber)
       
        await transferCertificatePage.clickOnSearchButton()

        // Verify whether the student details are fetched or not
        const studentNameField = await transferCertificatePage.verifyStudentDetailsFetched()
        await expect(studentNameField).toHaveValue('Ehu NM');


        await page.pause()

})
import {test, expect} from '@playwright/test'
import { landingPage } from '../../pages/landingPage'
require('dotenv').config();
import { loginPage } from '../../pages/loginPage';

test('Verify login functionality for institute admin', async({page})=>{
   
    const institutepage = new landingPage(page)

    const loginpage = new loginPage(page)

    await institutepage.gettheURL()
   //await institutepage.click_on_start_Buttton()

    await loginpage.click_on_institute_Button()

    await page.waitForTimeout(2000)

    await loginpage.enter_Login_Data(process.env.INSTITUTE_ADMIN_EMAIL, process.env.INSTITUTE_ADMIN_PASSWORD)

    await loginpage.verify_Login_Success()
})
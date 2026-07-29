import dotenv from 'dotenv';
dotenv.config();
import { test } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import loginData from '../../testData/loginData.json';

test.describe('Login Tests staff', () => {
    test('should login successfully as staff with valid credentials', async ({ page }) => {

        const loginPage = new LoginPage(page);

        await page.goto(process.env.URL);

        await loginPage.navigateToStaffLoginbutton();

         await loginPage.enterStaffEmail(
            loginData.login_Data.teacherUserName
        );

        await loginPage.enterStaffPassword(
            loginData.login_Data.teacherPassword
        );
        await loginPage.StaffLoginbutton();

        await loginPage.staffloginpagevalidation();

        
    });
});
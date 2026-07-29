import dotenv from 'dotenv';
dotenv.config();
import { test } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import loginData from '../../testData/loginData.json';

test.describe('Login Tests student', () => {
    test('should login successfully as student with valid credentials', async ({ page }) => {

        const loginPage = new LoginPage(page);

        await page.goto(process.env.URL);

        await loginPage.navigateToStudentLoginbutton();

        await loginPage.enterStudentEmail(loginData.student_Data.studentUserName);

        await loginPage.enterStudentPassword(loginData.student_Data.studentPassword);

        await loginPage.studentLoginbutton();

        await loginPage.studentloginpagevalidation();

    });
});
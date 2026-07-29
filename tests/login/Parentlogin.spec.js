import dotenv from 'dotenv';
dotenv.config();
import { test } from '@playwright/test';
import LoginPage from '../../pages/LoginPage';
import loginData from '../../testData/loginData.json';

test.describe('Login Tests parent', () => {
    test('should login successfully as parent with valid credentials', async ({ page }) => {

        const loginPage = new LoginPage(page);

        await page.goto(process.env.URL);

        await loginPage.navigateToParentLoginbutton();

        await loginPage.enterParentEmail(
            loginData.parent_Data.parentUserName
        );

        await loginPage.enterParentPassword(
            loginData.parent_Data.parentPassword
        );

        await loginPage.parentLoginbutton();

        await loginPage.parentloginpagevalidation();

        

    });
});
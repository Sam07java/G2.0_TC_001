import dotenv from 'dotenv';
dotenv.config();
import { test,expect } from '@playwright/test';
import LoginPage from '../pages/loginPage';
import createrolepage from '../pages/createrolepage';
import createprivilege from '../testData/createprivilege.json';

test.describe('Create Role Tests', () => {

    test.beforeEach('should login successfully with valid credentials', async ({ page }) => {
        const loginpage = new LoginPage(page);
        await page.goto(process.env.URL);
        await loginpage.navigateToInstituteLoginbutton();
        await loginpage.enterInstituteEmail(process.env.INSTITUTE_ADMIN_EMAIL);
        await loginpage.enterInstitutePassword(process.env.INSTITUTE_ADMIN_PASSWORD);
        await loginpage.schoolLoginbutton();
    });

    test('should create a role successfully', async ({ page }) => {
        const createRole = new createrolepage(page);  
        await createRole.navigatetocreaterolemenu();
        await createRole.navigatetocreatesubadminoption();
        await createRole.navigatetosearchoption('Arathi Shiva Prasad');
        await createRole.subadminpassword();
        await createRole.selectPrivileges(createprivilege);
        await page.waitForTimeout(2000);
        await createRole.clickcreatesubadmin();
    });

});
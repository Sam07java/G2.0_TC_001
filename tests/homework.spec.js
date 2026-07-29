import dotenv from 'dotenv';
dotenv.config();
import { test,expect } from '@playwright/test';
import LoginPage from '../pages/loginPage';
import Homework from '../pages/homeworkpage';
import HomeWorkCreation from '../pages/homeworkpage';


test.describe('Create Homework', () => {

    test.beforeEach('should login successfully with valid credentials', async ({ page }) => {
            const loginpage = new LoginPage(page);
            await page.goto(process.env.URL);
            await loginpage.navigateToInstituteLoginbutton();
            await loginpage.enterInstituteEmail(process.env.INSTITUTE_ADMIN_EMAIL);
            await loginpage.enterInstitutePassword(process.env.INSTITUTE_ADMIN_PASSWORD);
            await loginpage.schoolLoginbutton();
        });
        
    
    test('should create a Homework successfully', async ({ page }) => {
        const Homeworkpage=new Homework(page);
        await Homeworkpage.navigatetoadminstration();
        await Homeworkpage.navigatetoHomework();
        await Homeworkpage.navigatetocreatehomeworkforsinglesubject();
        await Homeworkpage.selectclass();
        await Homeworkpage.selectsection();
        //await Homeworkpage.selectSubject();
        await Homeworkpage.addtitle();
        await Homeworkpage.addContent();
        await Homeworkpage.uploadImage();
        await Homeworkpage.uploadDocument();
        await Homeworkpage.publishhomework();
    });
});

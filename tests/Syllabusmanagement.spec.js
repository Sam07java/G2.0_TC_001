import dotenv from 'dotenv';
dotenv.config();
import { test,expect } from '@playwright/test';
import LoginPage from '../pages/loginPage';
import subjectcreation from '../pages/syllabusmanagementpage';

test.describe('Syllabus management', () => {
      test.beforeEach('should login successfully with valid credentials', async ({ page }) => {
              const loginpage = new LoginPage(page);
              await page.goto(process.env.URL);
              await loginpage.navigateToInstituteLoginbutton();
              await loginpage.enterInstituteEmail(process.env.INSTITUTE_ADMIN_EMAIL);
              await loginpage.enterInstitutePassword(process.env.INSTITUTE_ADMIN_PASSWORD);
              await loginpage.schoolLoginbutton();
          });
    test('Should create subjects for classes', async ({ page }) => {
           const subjectpage = new subjectcreation(page); 
           await subjectpage.navigatetoadminstration();
           await subjectpage.navigatetosyllabusmanagement();
           await subjectpage.navigateToClass('Class 9');
           await subjectpage.downloadTemplate();
           await subjectpage.importSubjects();
           await subjectpage.validatesubject();
    
    });
});
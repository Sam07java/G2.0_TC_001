const { test, expect } = require('@playwright/test');
const { request } = require('http');

var apiURL = "https://backend-web-app-schoolmobileapkmergedtestenv.up.railway.app/api/";
var admintoken;


test.beforeAll('admin login', async ({request})=>{
    
      const logoinresponse = await request.post(apiURL+'schoolLogin',
        {data:{email : "sameerschool@gyansetu.ai", password : "Sam123"}}
      );
      console.log(await logoinresponse.json());

      const loginData = await logoinresponse.json();
      admintoken = loginData.data.token;

      console.log("Admin Token: "+admintoken)
})

test.skip("get student list", async ({request})=>{
const response = await request.get(apiURL+'students?page=1&limit=10',
  { headers:{Authorization: `Bearer ${admintoken}`}})
    // console.log("response of list of student: "+ await response.json())
    const data = await response.json();
    console.log(data)
    expect(response.status()).toBe(200)
})

test('Create a new student', async({request})=>{
 const createtudentResponse = await request.post(apiURL+'students',{
  headers:{Authorization: `Bearer ${admintoken}`},
    multipart:{
      "fullName": "Auto CC",
      "admissionNo": "AD998890",
      "email": "auto300@yopmail.com",
      "loginEnabled": "true",
      "father.name": "Abdul PP",
      "mother.name": "Mariyam MM",
      "admitSession.class": "Class 10",
      "admitSession.section": "A",
      "currentSession.class": "Class 10",
      "currentSession.section": "A"
    }
  })
  console.log(await createtudentResponse.json())
  expect(createtudentResponse.status()).toBe(201);
  const studentbody = await createtudentResponse.json()
  // console.log("response: "+studentbody)
  expect(studentbody.success).toBeTruthy();
})
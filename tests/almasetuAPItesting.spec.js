const {test, expect} = require('@playwright/test');

let testAPIurl = "https://dgim-server-dgim-dev.up.railway.app/api";
let verificationTokens;

test('send otp',async ({request})=>{
    
   const response = await request.post(testAPIurl+"/auth/send-otp", 
       {data:{"email": "sanjay234@yopmail.com"}}
    )

    console.log(await response.json())
    expect(response.status()).toBe(200)

})

test('user creation', async ({request})=>{

const otpresponse =await request.post(testAPIurl+"/auth/verify-otp", 
    {data:{"email":"sanjay234@yopmail.com", "otp":"485879"}})
    
    console.log(await otpresponse.json())
    expect(otpresponse.status()).toBe(200)

    const responseStatus = await otpresponse.json();
    verificationTokens = responseStatus.verificationToken;
    console.log("Verification Token: "+verificationTokens)
    // roleId: 3 for alumni user
    // roleId: 2 for student user
    // roleId: 1 for admin user

    const response = await request.post(testAPIurl+"/auth/create-account", 
        {data:{
            password: "Password@123",
            roleId: 3,
            verificationToken: verificationTokens,
            firstName: "Ananthan",
            lastName: "RM",
            phone: "87670721222",
            gender: "male",
            email: "sanjay234@yopmail.com",
            admissionYear: 2012,
            graduationYear: 2016,
            departmentId: 14,
            degreeId: 11,
            enrollmentNumber: "WEE1200"
        }});
       
        console.log(await response.json())
        expect(response.status()).toBe(201) 
})

// test('Create a alumni user', async ({request})=>{
   
// });
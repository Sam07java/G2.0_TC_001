import {test, expect} from '@playwright/test'


var apiURL = "https://backend-web-app-schoolmobileapkmergedtestenv.up.railway.app/api/";
var admionloginToken;

test('admin login validation',async ({request})=>{

   const adminlogoinResponse =await request.post(apiURL+ 'schoolLogin', {data: {email : "sameerschool@gyansetu.ai", password: "Sam123"}})
    console.log(await adminlogoinResponse.json());
    expect(adminlogoinResponse.status()).toBe(200)

    // admionloginToken = await (adminlogoinResponse.json().data.token);
    // console.log("Admin login token"+admionloginToken)

  const res =  await adminlogoinResponse.json()
  const tokenadmin = res.data.token;
  console.log("Admin login token"+ tokenadmin)

})

  
exports.landingPage = class landingPage {
    constructor(page) {
        this.page = page;
        this.startButton = 'Start Button'
    }

    async gettheURL(){
       await this.page.goto(process.env.URL)
    }

    async click_on_start_Buttton(){
       await this.page.getByAltText(this.startButton).click()
    }

}
const fs = require("fs")
//const sqlite = require('./asqlite3.js')
//const puppeteer = require('puppeteer')
const core = require('@actions/core')
const github = require('@actions/github')
const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const runId = github.context.runId
let setup = {}
if (!runId) {
    setup = JSON.parse(fs.readFileSync('./setup.json', 'utf8'))
} else {
    setup = JSON.parse(process.env.SETUP)
}
// puppeteer usage as normal
puppeteer.launch({ 
    headless: runId ? true : false,
    //headless: true,
    args: [
        '--window-size=1920,1080',
        //setup.proxy.normal
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    
}).then(async browser => {
  console.log('Running tests..')
  const page = await browser.newPage()
  //await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd});
  await page.goto('https://bot.sannysoft.com')
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'testresult.png', fullPage: true })
  await browser.close()
  console.log(`All done, check the screenshot. ✨`)
})
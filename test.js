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
        setup.proxy.normal
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    
}).then(async browser => {
  console.log('Running tests..')
  const page = await browser.newPage()
  await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd});
  let cookies = JSON.parse(fs.readFileSync('./cnblog.json', 'utf8'))
  await page.setCookie(...cookies)
  await page.goto('https://www.cnblogs.com/eroslp/')
  await page.waitForTimeout(500)
  let selecter = '#Header1_HeaderTitle'
  await page.waitForSelector(selecter, { timeout: 5000 })
  .catch(async (error)=>{
      console.log(await page.$eval('body', el => el.innerText))
  })
  await page.waitForTimeout(1000)
  await page.goto('https://i.cnblogs.com/posts/edit')
  await page.waitForTimeout(500)
  selecter ='#post-title'
  await page.waitForSelector(selecter)
  .then(async () =>console.log('找到#post-title') )
  //await page.evaluate((selecter, text) => document.querySelector(selecter).value = text, '#txtTitle', row.title)
  await page.type(selecter,'破解下载')
  
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'testresult.png', fullPage: true })
  await browser.close()
  console.log(`All done, check the screenshot. ✨`)
})
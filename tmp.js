const fs = require("fs")
//const sqlite = require('./asqlite3.js')
const puppeteer = require('puppeteer')
const core = require('@actions/core')
const github = require('@actions/github')
/* const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin()) */
const { tFormat, sleep, clearBrowser, getRndInteger, randomOne, randomString, md5, waitForString, findFrames  } = require('./common.js')
const { changeContent, filterContent } = require('./utils.js')
Date.prototype.format = tFormat
const mysql = require('mysql2/promise')
const runId = github.context.runId
const ckfile = './cnblog.json'
let setup = {}
if (!runId) {
    setup = JSON.parse(fs.readFileSync('./setup.json', 'utf8'))
} else {
    setup = JSON.parse(process.env.SETUP)
}
const pool = mysql.createPool({
    host: setup.mysql.host,
    user: setup.mysql.user,
    password: setup.mysql.password,
    port: setup.mysql.port,
    database: setup.mysql.database,
    waitForConnections: true, //连接超额是否等待
    connectionLimit: 10, //一次创建的最大连接数
    queueLimit: 0 //可以等待的连接的个数
})

async function main() {
    const browser = await puppeteer.launch({ 
        headless: runId ? true : false,
        headless: true,
        args: [
            '--window-size=1920,1080',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list ',
            setup.proxy.changeip
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        
    })
    console.log('Running tests..')
    const page = await browser.newPage()
    console.log(setup.proxy.usr)
    //await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd})
    let cookies = JSON.parse(fs.readFileSync(ckfile, 'utf8'))
    await page.setCookie(...cookies)
    await page.goto('https://www.youtube.com/watch?v=Yo_VyP7qlC8&ab_channel=KKBOX%E8%8F%AF%E8%AA%9E%E6%96%B0%E6%AD%8C-kkboxmusic')
    await page.waitForTimeout(3000)
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
    let content = 'row.content.replace(/https:\/\/www.kxnn.xyz\/vip/g,"******")' 
    const frame = ( await page.mainFrame().childFrames() )[0]  //通过索引得到我的iframe
    await frame.evaluate((selecter, text) => document.querySelector(selecter).innerHTML = text, '#tinymce', content)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'testresult.png', fullPage: true })
    if (runId ? true : false) await browser.close()
    console.log(`All done, check the screenshot. ✨`)

}
main()

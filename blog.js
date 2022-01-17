const fs = require("fs")
//const sqlite = require('./asqlite3.js')
//const puppeteer = require('puppeteer')
const core = require('@actions/core')
const github = require('@actions/github')
const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const { tFormat, sleep, clearBrowser, getRndInteger, randomOne, randomString, md5, waitForString, findFrames,cutString  } = require('./common.js')
const { changeContent, filterContent } = require('./utils.js')
Date.prototype.format = tFormat
const mysql = require('mysql2/promise')
const runId = github.context.runId
const ckfile = './blog.json'
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

async function postArticles(row, page) {
    await page.goto('https://www.blogger.com/blog/themes/2452054240135994991')
    await sleep(500)
    let selecter = '#gb > div.gb_Ac.gb_yc.gb_Dc.gb_Ec.gb_ja > div.gb_Fc > div > c-wiz > div.kiQDlf > div > div > span > span > span.MIJMVe'
    await page.waitForSelector(selecter)
    await page.click(selecter)
    await sleep(1500)
    selecter ='#yDmH0d > c-wiz:nth-child(16) > div > c-wiz > div > div.LYkI7 > div.rFrNMe.rzHh9c.l8Ahzd.zKHdkd.sdJrJc > div.aCsJod.oJeWuf > div > div.Xb9hP > input'
    //selecter ='#yDmH0d > c-wiz:nth-child(16) > div > c-wiz > div > div.LYkI7 > div.rFrNMe.rzHh9c.l8Ahzd.zKHdkd.sdJrJc > div.aCsJod.oJeWuf > div > div.Xb9hP > input'
    await page.waitForSelector(selecter)
    //await page.evaluate((selecter, text) => document.querySelector(selecter).value = text, '#txtTitle', row.title)
    await page.type(selecter,row.title+'破解下载')
    await sleep(500)
    //await findFrames(page)
    const frame = ( await page.mainFrame().childFrames() )[0]  //通过索引得到我的iframe
    let content = row.content.replace(/https:\/\/www.kxnn.xyz\/vip/g,'******') 
    //content = content.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '') 
    content = content.replace(/www.cmdw.top/g,'www.kxnn.xyz')+`<br>原文地址:<a href="${row.url_kxnn}">${row.url_kxnn}</a>`
    selecter = 'body'
    await frame.evaluate((selecter, text) => document.querySelector(selecter).innerHTML = text, selecter, content)
    await sleep(300)
    await frame.focus(selecter)
    await page.keyboard.type(row.title+'破解下载')
    await sleep(1000)
    await page.keyboard.press('Enter');
    await sleep(300)
    //console.log('frame2',await frame.$eval('body', el => el.innerHTML));
    //selecter = 'body > cnb-root > cnb-layout > div.main > div.content.grid-noGutter > div.right.grid-column-noGutter-noWrap > div > cnb-spinner > div > cnb-post-editing-v2 > cnb-post-editor > div.panel.panel--main > cnb-collapse-panel.ng-tns-c82-4.ng-star-inserted > div.panel-content.ng-tns-c82-4.ng-trigger.ng-trigger-openClosePanel > cnb-category-selector-panel > cnb-collapse-panel > div.panel-content.ng-tns-c82-6.ng-trigger.ng-trigger-openClosePanel > cnb-category-selector > div > div:nth-child(1) > label' //文章类型
    selecter = "#c2 > div > div.edhGSc.zKHdkd.QM47Xb > div.RpC4Ne.oJeWuf > div.Pc9Gce.Wic03c > textarea"
    await page.type(selecter,'streamgame')
    await sleep(300)
    //return Promise.reject(new Error('临时退出'))
    let button = "#yDmH0d > c-wiz:nth-child(16) > div > c-wiz > div > div.LYkI7 > div.vAOvBb > div.U26fgb.O0WRkf.zZhnYe.e3Duub.C0oVfc.jPVgtf.iRR07e.M9Bg4d > span > span > div"
    await page.evaluate((selecter) => document.querySelector(selecter).click(), button)
    console.log('click:#publish')
    selecter = "#yDmH0d > div.llhEMd.iWO5td > div > div.g3VIld.OFqiSb.Up8vH.J9Nfi.iWO5td > div.XfpsVe.J9fJmf > div.U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.M9Bg4d > span > span"
    await page.waitForSelector(selecter,{ visible: true, timeout: 15000 })
    await sleep(500)
    await page.click(selecter)
    await page.waitForNavigation()
    //return Promise.reject(new Error('临时退出'))
    return row
}
async function main() {
    const browser = await puppeteer.launch({
        headless: runId ? true : false,
        //headless: true,
        args: [
            '--window-size=1920,1080',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list ',
            setup.proxy.normal
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs:['--enable-automation'] //去除提示
      })
    //console.log(await sqlite.open('./freeok.db'))
    const page = await browser.newPage()
    //await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36')
    await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd})
    page.on('dialog', async dialog => {
        //console.info(`➞ ${dialog.message()}`);
        await dialog.dismiss();
    })

    let cookies = JSON.parse(fs.readFileSync(ckfile, 'utf8'))
    await page.setCookie(...cookies)
    console.log("写入cookies")
    await page.goto('https://www.blogger.com/blog/posts/2452054240135994991')
    await sleep(500)
    let selecter = '#gb > div.gb_Ac.gb_yc.gb_Dc.gb_Ec.gb_ja > div.gb_Fc > div > c-wiz > div.kiQDlf > div > div > span > span > span.MIJMVe'
    await page.waitForSelector(selecter, { timeout: 15000 })
    .catch(async (error)=>{
        //console.log(await page.$eval('body', el => el.innerText))
        console.log('未登录')
    })
    await sleep(1000)
    cookies = await page.cookies();
    fs.writeFileSync(ckfile, JSON.stringify(cookies, null, '\t'))
    //return Promise.reject(new Error('调试退出'))
    console.log(`*****************开始postArticles ${Date()}*******************\n`)
    //let sql = "SELECT * FROM freeok WHERE level IS NULL  and (level_end_time < datetime('now') or level_end_time IS NULL);"
    let sql = "SELECT * FROM articles WHERE blog = 0 and posted = 1  order by  date asc limit 30;"
    //let sql = "SELECT * FROM articles WHERE posted = 1 limit 1;"
    let r = await pool.query(sql)
    let i = 0
    console.log(`共有${r[0].length}个文章要发布`)
    for (let row of r[0]) {
        i++
        console.log(i, row.url)
        if (i % 3 == 0) await sleep(3000).then(() => console.log('暂停3秒！'))
        if (row.url) await postArticles(row, page)
            .then(async row => {
                let sql, arr
                sql = 'UPDATE articles SET  blog=1 WHERE id=?'
                arr = [row.id]
                sql = await pool.format(sql, arr)
                //console.log(row);
                await pool.query(sql)
                    .then(async (result) => { console.log('changedRows', result[0].changedRows);await sleep(20000); })
                    .catch(async (error) => { console.log('UPDATEerror: ', error.message);await sleep(3000); })
            })
            .catch(error => console.log('error: ', error.message))
    }
    await pool.end()
    cookies = await page.cookies();
    fs.writeFileSync(ckfile, JSON.stringify(cookies, null, '\t'))
    if (runId ? true : false) await browser.close()
    //await browser.close()
}
main()
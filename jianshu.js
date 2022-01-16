const fs = require("fs")
const crypto = require('crypto');
//const sqlite = require('./asqlite3.js')
const puppeteer = require('puppeteer')
const core = require('@actions/core')
const github = require('@actions/github')
/* const puppeteer = require('puppeteer-extra');
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin()); */
const { tFormat, sleep, clearBrowser, getRndInteger, randomOne, randomString, md5, waitForString, findFrames  } = require('./common.js')
const { changeContent, cutStrin, filterContent } = require('./utils.js')
Date.prototype.format = tFormat
const mysql = require('mysql2/promise')
const runId = github.context.runId
const ckfile = './jianshu.json'
let browser
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
});

async function postArticles(row, page) {
    await page.goto('https://www.jianshu.com/writer#/notebooks/51953858/notes/97319040')
    await sleep(500)
    let selecter = '#root > div > div.ant-col.ant-col-20 > div.ant-col.ant-col-8.rQQG7 > div > div > div > div._1GsW5 > span'
    await page.evaluate((selecter) => document.querySelector(selecter).click(), selecter)
    await sleep(1500)
    selecter ='#root > div > div.ant-col.ant-col-20 > div.ant-col.ant-col-16._1Yy97 > div > div > div > div > input'
    await page.waitForSelector(selecter)
    //await page.evaluate((selecter, text) => document.querySelector(selecter).value = text, '#txtTitle', row.title)
    await page.type(selecter,row.title +'破解下载')
    await sleep(500)
    //await findFrames(page)
    selecter = '#editor > div > p'
    let content = row.content + `<br>原文地址:<a href="${row.url_kxnn}">${row.title}</a>`
    content = content.replace(/www.cmdw.top/g,'www.kxnn.xyz')
    //await page.type(selecter, content)
    //await page.$eval('#title', el => el.value = row.title) //出错，不能使用node环境中的变量 
    //await page.$eval('#content', el => el.value = row.content+'<p>[rihide]</p>'+row.vip+'<p>[/rihide]</p>')
    await page.evaluate((selecter, text) => document.querySelector(selecter).innerHTML = text, selecter, content)
    await sleep(200)
    let button = '#root > div > div.ant-col.ant-col-20 > div.ant-col.ant-col-16._1Yy97 > div > div > div > div > ul > li.tGbI7.cztJE > a'
    await page.evaluate((selecter) => document.querySelector(selecter).click(), button)
    console.log('click:#publish')
    selecter = '#root > div > div.ant-col.ant-col-20 > div.ant-col.ant-col-16._1Yy97 > div > div > div > div > ul > li.tGbI7.cztJE > div > a:nth-child(1)'
    await waitForString(page, selecter, '已发布', 30000)
        .catch(async (error) => {
            console.log('再次点击')
            await page.click(button)
            await waitForString(page, selecter, '已发布', 30000)
        })
    await sleep(100)
    //return Promise.reject(new Error('临时退出'))
    return row
}
async function main() {
    browser = await puppeteer.launch({
        headless: runId ? true : false,
        //headless: true,
        args: ['--window-size=1920,1080'],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
      })
    //console.log(await sqlite.open('./freeok.db'))
    const page = await browser.newPage()
    //await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36')
    //await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd});
    page.on('dialog', async dialog => {
        //console.info(`➞ ${dialog.message()}`);
        await dialog.dismiss();
    })
    let cookies = []
    cookies = JSON.parse(fs.readFileSync(ckfile, 'utf8'))
    await page.setCookie(...cookies)
    console.log("写入cookies")
    await page.goto('https://www.jianshu.com/u/1b528be55421')
    let selecter = 'body > nav > div > div.user'
    await page.waitForSelector(selecter)
    .catch(async (error)=>{
        console.log(await page.$eval('body', el => el.innerText))
/*         selecter = 'body > div.passport-container > div > div.passport-main > div.login-box > div.login-box-top > div.login-box-tabs > div.login-box-tabs-items > span:nth-child(4)'
        await page.evaluate((selecter) => document.querySelector(selecter).click(), selecter)
        await sleep(200)
        await page.type('body > div.passport-container > div > div.passport-main > div.login-box > div.login-box-top > div > div.login-box-tabs-main > div > div:nth-child(1) > div > input', setup.usr.csdn)
        await page.type('body > div.passport-container > div > div.passport-main > div.login-box > div.login-box-top > div > div.login-box-tabs-main > div > div:nth-child(2) > div > input', setup.pwd.csdn)
        await Promise.all([
            page.waitForNavigation({ timeout: 60000 }),
            //等待页面跳转完成，一般点击某个按钮需要跳转时，都需要等待 page.waitForNavigation() 执行完毕才表示跳转成功
            page.click('body > div.passport-container > div > div.passport-main > div.login-box > div.login-box-top > div > div.login-box-tabs-main > div > div:nth-child(4) > button'),
        ])
            .then(() => console.log('登录成功')) */
    })
    await sleep(1000)
    cookies = await page.cookies();
    fs.writeFileSync(ckfile, JSON.stringify(cookies, null, '\t'))
    //return Promise.reject(new Error('调试退出'))
    console.log(`*****************开始postArticles ${Date()}*******************\n`)
    //let sql = "SELECT * FROM freeok WHERE level IS NULL  and (level_end_time < datetime('now') or level_end_time IS NULL);"
    let sql = "SELECT * FROM articles WHERE jianshu = 0 and posted = 1  order by  date asc limit 2;"
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
                sql = 'UPDATE articles SET  jianshu=1 WHERE id=?'
                arr = [row.id]
                sql = await pool.format(sql, arr)
                //console.log(row);
                await pool.query(sql)
                    .then(async (result) => { console.log('changedRows', result[0].changedRows);await sleep(30000); })
                    .catch(async (error) => { console.log('UPDATEerror: ', error.message);await sleep(3000); })
            })
            .catch(error => console.log('error: ', error.message))
    }
    await pool.end() 
    if (runId ? true : false) await browser.close()
    //await browser.close()
}
main();
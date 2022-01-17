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
const { tFormat, sleep, clearBrowser, getRndInteger, randomOne, randomString, md5, waitForString, findFrames, deleteHtmlTag } = require('./common.js')
const { changeContent, cutStrin, filterContent } = require('./utils.js')
Date.prototype.format = tFormat
const mysql = require('mysql2/promise')
const runId = github.context.runId
const ckfile = './bili.json'
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
    await page.goto('https://member.bilibili.com/platform/upload/text/edit')
        let selecter = '#canvas-wrap > div > div > img'
    await page.waitForSelector(selecter)
    .then(async () => await page.click(selecter))
    .catch(async (error)=>{console.log('error: ', error.message);})
    await sleep(5000)
    selecter = '#edit-article-box > div > iframe'
    await page.waitForSelector(selecter)
    const frame = ( await page.mainFrame().childFrames() )[1]  //通过索引得到我的iframe
    selecter = '#edit-page > div.original-editor-wrap > div:nth-child(1) > div > div.ui-input-textarea.article-title > textarea'
    await frame.type(selecter,row.title)
    //await frame.evaluate((selecter, text) => document.querySelector(selecter).value = text, selecter, row.title+'破解下载')
    await sleep(500)  
    //console.log('frame',await frame.$eval('body', el => el.innerHTML));
    let content = row.content.replace(/https:\/\/www.kxnn.xyz\/vip/g,'******') 
    content = content.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '').replace(/下载/g, '**')
    content = content.replace(/www.cmdw.top/g,'www.kxnn.xyz') + `<br>详细内容:搜索 开心牛牛 ${row.title}`
    await frame.waitForSelector('#ueditor_0', { timeout: 5000 })
    const elementHandle = await frame.$('#ueditor_0')
    elementHandle.focus()
    const iframe = await elementHandle.contentFrame()
    //console.log('iframe',iframe.content())
    selecter = 'body'
    //await iframe.focus(selecter)
    await sleep(500) 
    await page.keyboard.type('puppeteer', { delay: 100 })
    await page.keyboard.press('Enter');
    await iframe.evaluate((selecter, text) => document.querySelector(selecter).innerHTML = text, selecter, content)
    //await page.$eval('#title', el => el.value = row.title) //出错，不能使用node环境中的变量 
    await sleep(200)
    //return Promise.reject(new Error('临时退出'))
    selecter = '#edit-page > div > div:nth-child(3) > div.classify > ul > li:nth-child(2) > a'
    await frame.evaluate((selecter) => document.querySelector(selecter).click(), selecter)
    await sleep(500)
    selecter = '#edit-page > div > div:nth-child(3) > div.classify > ul > li:nth-child(2) > ul > li:nth-child(1) > span'
    await frame.evaluate((selecter) => document.querySelector(selecter).click(), selecter)
    await sleep(500)
    let button = '#edit-page > div > div.btn-group.main-active-btn > button.ui-btn.blue-radius'
    await frame.evaluate((selecter) => document.querySelector(selecter).click(), button)
    console.log('click:#publish')
    selecter = '#edit-page > div > div.success-mask > div > div.title'
    //await waitForString(frame, selecter, '你的专栏已提交成功', 30000)
    await frame.waitForSelector(selecter,{ visible: true, timeout: 15000 })
        .catch(async (error) => {
            await frame.waitForSelector(button, { timeout: 5000 })
            .then(async () => {
                console.log('再次点击')
                await frame.click(button)
                await frame.waitForSelector(selecter,{ visible: true, timeout: 15000 })
                //await waitForString(frame, selecter, '你的专栏已提交成功', 30000)
            })
        })
    await sleep(100)
    //return Promise.reject(new Error('临时退出'))
    return row
}
async function main() {
    const browser = await puppeteer.launch({
        headless: runId ? true : false,
        //headless: true,
        args: ['--window-size=1920,1080'],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs:['--enable-automation'] //去除提示
      })
    //console.log(await sqlite.open('./freeok.db'))
    const page = await browser.newPage()
    //await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36')
    //await page.authenticate({username:setup.proxy.usr, password:setup.proxy.pwd});
    page.on('dialog', async dialog => {
        //console.info(`➞ ${dialog.message()}`);
        await dialog.dismiss();
    })
    let cookies = JSON.parse(fs.readFileSync(ckfile, 'utf8'))
    await page.setCookie(...cookies)
    console.log("写入cookies")
    await page.goto('https://account.bilibili.com/account/home')
    let selecter = '#app > div > div.security_content > div.security-right > div > div:nth-child(2) > div.home-daily-task-warp > span.home-dialy-task-title'
    await page.waitForSelector(selecter, { timeout: 5000 })
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
    let sql = "SELECT * FROM articles WHERE bili = 0 and posted = 1  order by  date asc limit 3;"
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
                sql = 'UPDATE articles SET  bili=1 WHERE id=?'
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
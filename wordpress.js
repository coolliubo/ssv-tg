const fs = require("fs")
//const crypto = require('crypto');
//const sqlite = require('./asqlite3.js')
const puppeteer = require('puppeteer')
const core = require('@actions/core')
const github = require('@actions/github')
/* const puppeteer = require('puppeteer-extra');
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin()); */
const { tFormat, sleep, clearBrowser, getRndInteger, randomOne, randomString, md5,  waitForString } = require('./common.js')
const { changeContent,cutStrin,filterContent} = require('./utils.js')
Date.prototype.format = tFormat
const mysql = require('mysql2/promise')
const runId = github.context.runId
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

async function postArticles(row,page) {
    let content = row.content.replace(/https:\/\/www.kxnn.xyz\/vip/g,'******') 
    content = content.replace(/www.cmdw.top/g,'www.kxnn.xyz')+ `<br>原文地址:<a href="${row.url_kxnn}">${row.url_kxnn}</a>`
  await page.goto('https://kxzyorg.wordpress.com/wp-admin/post-new.php?classic-editor', { timeout: 30000 })
  .catch(error => console.log('error: ', error.message))
   //return Promise.reject(new Error('临时退出'))
  await page.waitForSelector('#title', { timeout: 15000 })
  await sleep(200)
  //await page.type('#title',row.title)
  //await page.$eval('#title', el => el.value = row.title) //出错，不能使用node环境中的变量
  await page.evaluate((selecter,text) => document.querySelector(selecter).value=text,'#title',row.title)
  await page.evaluate((selecter) => document.querySelector(selecter).click(),'#content-html')
  //await page.$eval('#content', el => el.value = '')
  await sleep(100)

  await page.evaluate((selecter,text) => document.querySelector(selecter).value=text,'#content',content)
  //await page.type('#content',row.content+'<p>[rihide]</p>'+row.vip+'<p>[/rihide]</p>')
  await sleep(200)
  await page.evaluate((selecter) => document.querySelector(selecter).checked=true,'#in-category-22316')
  await sleep(200)
  await page.type('#new-tag-post_tag',row.label)
  await sleep(100)
  //return Promise.reject(new Error('临时退出'))
  //await page.click('#publish')
  await page.evaluate((selecter) => document.querySelector(selecter).click(),'#publish')
  console.log('click:#publish')
  await waitForString(page,'#message > p','查看文章',30000)
   .catch(async (error)=>{
    console.log('再次点击')
    await page.click('#publish')
    await waitForString(page,'#message > p','查看文章',30000)
  }) 
  await sleep(100)
  //return Promise.reject(new Error('临时退出'))
  return row
}
async function  main () {
    //console.log(await sqlite.open('./ssv.db'))
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
    await page.goto('https://wordpress.com/log-in/zh-cn?redirect_to=https%3A%2F%2Fwordpress.com%2F', { timeout: 20000 })
    .catch(error => console.log('error: ', error.message))
    let selecter = '#usernameOrEmail'
    await page.waitForSelector(selecter, { timeout: 15000 })
    await sleep(200)
    await page.type(selecter, setup.usr.wordpress)
    //await page.type('#user_pass', setup.pwd.kxnn)
    //await page.evaluate((selecter,text) => document.querySelector(selecter).value=text,selecter,setup.usr.wordpress)
    selecter = '#primary > div > main > div > div > form > div.card.login__form > div.login__form-action > button'
    await page.click(selecter)
    selecter = "#password"
    await page.waitForSelector(selecter,{ visible: true, timeout: 15000 })
    await page.waitForTimeout(500)
    //await page.evaluate((selecter,text) => document.querySelector(selecter).value=text,'#user_pass',setup.pwd.wordpress)
    await page.type(selecter, setup.pwd.wordpress)
    await sleep(200)
    //return Promise.reject(new Error('临时退出'))
    await page.click('#primary > div > main > div > div > form > div.card.login__form > div.login__form-action > button')
    selecter = '#primary > main > div.customer-home__heading > header > h1'
    await page.waitForSelector(selecter)
    .then(()=>console.log ('登录成功'))
    //await sleep(300)
    console.log(`*****************开始postArticles ${Date()}*******************\n`)
    //let sql = "SELECT * FROM freeok WHERE level IS NULL  and (level_end_time < datetime('now') or level_end_time IS NULL);"
    let sql = "SELECT * FROM articles WHERE wordpress = 0  order by  date asc limit 30 ;"
    //let sql = "SELECT * FROM articles WHERE wordpress = 1 limit 1;"
  let r = await pool.query(sql)
    let i = 0
    console.log(`共有${r[0].length}个文章要发布`)
    for (let row of r[0]) {
      i++
      console.log(i, row.url)
      if (i % 3 == 0) await sleep(500).then(()=>console.log('暂停3秒！'))
      if (row.url) await postArticles(row,page)
      .then(async row => {
        let sql, arr
        sql = 'UPDATE articles SET  wordpress=1 WHERE id=?'
        arr = [row.id]
        sql = await pool.format(sql, arr)
        //console.log(row);
        await pool.query(sql)
          .then((result) => { console.log('changedRows', result[0].changedRows);sleep(3000); })
          .catch((error) => { console.log('UPDATEerror: ', error.message);sleep(3000); })
        })
      .catch(error => console.log('error: ', error.message))
     }
  await pool.end()
  if (runId ? true : false) await browser.close()
    //await browser.close()
}
main();
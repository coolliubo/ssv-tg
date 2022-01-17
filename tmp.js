1 const puppeteer = require('puppeteer');
2 //puppeteer文件上传操作，适用原声控件：<input type=file/>
3 async function upload() {
4     //创建一个Browser浏览器实例，并设置相关参数
5     const browser = await puppeteer.launch({
6         headless: false,
7         defaultViewport: null,
8         args: ['--start-maximized'],
9         ignoreDefaultArgs: ['--enable-automation']
10     });
11     //创建一个Page实例
12     const page = await browser.newPage();
13     //跳转百度首页
14     await page.goto("https://www.baidu.com");
15     //等待元素加载成功
16     const soutuBtn = await page.waitForSelector('span.soutu-btn');
17     //点击上传图片按钮
18     await soutuBtn.click();
19     //uploadFile上传图片
20     const uploadPic = await page.waitForSelector('input.upload-pic');
21     //上传图片目录自定义
22     await uploadPic.uploadFile('D:\\MyConfiguration\\ww23928\\Desktop\\Test\\uploadPic.jpg');
23     await page.waitFor(3000);
24     //关闭浏览器
25     await browser.close();
26 }
27 upload();

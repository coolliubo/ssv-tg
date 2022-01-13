const puppeteer = require('puppeteer');
const uid = 'eroslp';
const pwd = '780830-aiboboxx';

(async () => {
  const browser = await puppeteer.launch({
    //headless: true,   //有浏览器界面启动\
     headless: false,   //有浏览器界面启动\
    // executablePath: '/path/to/Chrome'
    // slowMo: 100,       //放慢浏览器执行速度，方便测试观察
    // args: [            //启动 Chrome 的参数，详见上文中的介绍
    //   //   '–no-sandbox',
    //   '--disable-web-security',
    //   "--allow-cross-origin-auth-prompt",
    //   "--process-per-site"
    //   //   '--window-size=1280,960'
    // ],
    // ignoreDefaultArgs: ["--enable-automation"],
    // 貌似会清空数据...简直了, 而且必须关闭浏览器
    // userDataDir: "C:/Users/Ace/AppData/Local/Google/Chrome/User Data"
  });
  const page = await browser.newPage();

  const cookie = [
    {
      name: 'HMVT',
      value: "6bcd52f51e9b3dce32bec4a3997715ac|1593859020|",
      domain: ".hm.baidu.com"
    },
    {
      name: "HMACCOUNT",
      value: '37FD0ADD32BEA80A',
      domain: ".hm.baidu.com"
    },
    // {
    //   name:"TY_SESSION_ID",
    //
    // }
  ]


  // await page.goto('https://passport.csdn.net/login?code=public');
  await page.goto('https://editor.csdn.net/md/');

  await page.waitFor(2000)
  console.log('====')
  await page.screenshot({path: './example.png'});
  //return
  // page.setBypassCSP(true)
  // page.setRequestInterception(true);
  // for (let c of cookie)
  //   await page.setCookie(c);

  const link = await page.$x('//*[@id="app"]/div/div/div[1]/div[2]/div[5]/ul/li[2]/a')
  // console.log(link[0])
  await link[0].click()


  // 输入账号 和 密码
  const passwordElement = await page.$('input[name=all]', {delay: 20});
  await passwordElement.type(pwd);

  const uidElement = await page.$('input[name=pwd]', {delay: 20});
  await uidElement.type(uid);

  return
  // 登录
  const subBtn = await page.$('.btn.btn-primary', {delay: 20});
  await subBtn.click()
  // await subBtn[0].click()


  await page.waitFor(2000)
  // 滑块
  const start = await page.$('span.nc_iconfont.btn_slide', {delay: 20});
  const startinfo = await start.boundingBox();
  console.log("startinfo", startinfo)


  const end = await page.$('span.nc-lang-cnt', {delay: 20});
  const endinfo = await end.boundingBox();
  console.log('endinfo,', endinfo)

  await page.waitFor(1000)
  await page.mouse.move(endinfo.x, endinfo.y);
  await page.waitFor(1000)
  await page.mouse.down();
  await page.waitFor(1000)
  for (let i = Math.random() * 10; i < endinfo.width; i += Math.random() * 10) {

    let x = Math.min(endinfo.width + endinfo.x - 30, endinfo.x + i)
    await page.mouse.move(x, endinfo.y + Math.random() + 5);
    await page.waitFor(10 + Math.random() * 10)
  }
  await page.waitFor(1000)
  await page.mouse.up();
  await page.waitFor(1000)

  await page.screenshot({path: './example.png'});
  await browser.close();


  const subBtn2 = await page.$('.btn.btn-primary', {delay: 20});
  await subBtn2.click()


  //等待页面跳转完成，一般点击某个按钮需要跳转时，都需要等待 page.waitForNavigation() 执行完毕才表示跳转成功
  // await Promise.all([
  //   okButtonElement.click(),
  //   page.waitForNavigation()
  // ]);

  // await page.screenshot({path: './example.png'});
  // await browser.close();


  /*

    await page.waitFor(1000)
    let sliderElement = await page.$('.alert-catch-success.nc-container') // 整个滑动条节点
    let slider = await sliderElement.boundingBox() // 返回元素的x,y坐标以及宽高
    console.log(slider)
    let sliderHandle = await page.$('.nc_iconfont.btn_slide') // 滑块节点
    let handle = await sliderHandle.boundingBox()
    console.log(handle)

    // 将鼠标放到滑块中心点。
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
    // 按下鼠标
    await page.mouse.down()
    // 将鼠标右移到滑动条最右端
    await page.mouse.move(handle.x + slider.width, handle.y + handle.height / 2, { steps: 10 })
    // 放开鼠标
    await page.mouse.up()

    await page.waitFor(3000)
  */

})();
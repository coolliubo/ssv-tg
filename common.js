// 对Date的扩展，将 Date 转化为指定格式的String  
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
// 例子：   
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18   
exports.tFormat = function tFormat (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
exports.sleep = async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
exports.clearBrowser = async function clearBrowser(page) {
  // clear cookies
  const client = await page.target().createCDPSession()
  await await client.send('Network.clearBrowserCookies')
}
//find frame index
async function findFrames(page) {
  const frames = await page.mainFrame().childFrames();
  let i = 0;
  for (let frame of frames) {
    i++;
    console.log(i, frame.url(), frame.setContent(i));
  }

}
exports.findFrames = findFrames;
exports.findFrame = async function (page, url) {
  const frames = await page.mainFrame().childFrames();
  //let i = 0;
  for (let frame of frames) {
    //i++;
    //console.log(i,frame.url(),frame.setContent(i));
    if (frame.url().includes(url)) return frame;
  }

}
exports.getRndInteger = function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
* 随机获取数组中的一个元素
* @param arr 数组
* @returns {*}  数组中的任意一个元素
*/

exports.randomOne = function randomOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
exports.randomString = function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
exports.waitForString = async function waitForString(page, selecter, string, timeout = 60000) {
  await page.waitForFunction(
    (selecter, string) => {
      //await exports.sleep(300)
      if (document.querySelector(selecter)) {
        //console.log("body",document.querySelector('body').innerHTML);
        return document.querySelector(selecter).innerHTML.includes(string);
      } else {
        return false;
      }
    },
    { timeout: timeout },
    selecter,
    string
  )

}

exports.sleepSync = function sleepSync(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}
exports.spawnLog = function spawnLog(spawn) {
  spawn.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  spawn.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  spawn.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
  });
}
exports.md5 = function md5(str) {
  const crypto = require('crypto')
  return crypto.createHash('md5').update(str).digest('hex')
}
exports.deleteHtmlTag = function deleteHtmlTag(str){
  str = str.replace(/<[^>]+>|&[^>]+;/g,"").trim();//去掉所有的html标签和&nbsp;之类的特殊符合
  return str;
 }
exports.cutString = function cutString(origin, preStr, aftStr, includeBorders = true) {
  let pos = origin.indexOf(preStr)
  let pos2 = origin.indexOf(aftStr, pos+preStr.length)
  //console.log(pos,pos2,origin.length)
  if (pos == -1 || pos2 == -1) return ''
  if (includeBorders) return origin.slice(pos, pos2 + aftStr.length)
  return origin.slice(pos + preStr.length, pos2)
  //return origin.substring(pos,pos2+aftStr.length)
}
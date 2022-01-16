let str="百度地址：<a href='https://www.baidu.com'>跳转百度</a>，csdn：<a href=https://mp.csdn.net/'>跳转csdn</a>";
str=str.replace(/(<\/?a.*?>)|(<\/?span.*?>)/g, '');
console.log(str);
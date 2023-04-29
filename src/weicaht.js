import express from 'express'
import request from 'request';
import xml2js from 'xml2js';
import WechatApi from 'wechat-api';
import crypto from 'crypto';

const app = express()
const port = 80;

// 在公众平台中获取的基本配置信息

const config = {
    appId: 'wx3046267608ef4a14',
    appSecret: 'cf56b8c0ce7a08497739bdc8bbe31326',
    token: 'ayognice',
    encodingAESKey: 'mjePwq5shh0YmFNpI9R0ojMkP5NHsunH1clt0VGHXvX'
}


// 实例化一个 WechatApi 对象
const api = new WechatApi(config.appid, config.secret);

// 配置路由，用于接收 GET 请求，进行微信公众号的验证
// app.get('/', function (req, res) {
//     console.log('get访问')
//     const query = req.query;
//     const signature = query.signature;
//     const timestamp = query.timestamp;
//     const nonce = query.nonce;
//     const echostr = query.echostr;
//     const token = config.token;
//
//     const array = [token, timestamp, nonce];
//     array.sort();
//     const str = array.join('');
//     const sha1 = crypto.createHash('sha1');
//     sha1.update(str);
//     const result = sha1.digest('hex');
//
//     if (result === signature) {
//         res.send(echostr);
//     } else {
//         res.send('mismatch');
//     }
// });

// 配置路由，用于接收 POST 请求，进行消息的处理和回复
app.post('/ayong', function (req, res) {
    console.log('post访问')

    const data = '';

    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        xml2js.parseString(data, {explicitArray: false}, function (err, json) {
            const fromUsername = json.xml.FromUserName;
            const toUsername = json.xml.ToUserName;
            const content = json.xml.Content;

            if (content === '你好') {
                const replyContent = '您好！欢迎关注我的公众号！';
                const replyMessage = {
                    xml: {
                        ToUserName: fromUsername,
                        FromUserName: toUsername,
                        CreateTime: new Date().getTime(),
                        MsgType: 'text',
                        Content: replyContent,
                    },
                };

                const builder = new xml2js.Builder({rootName: 'xml', cdata: true, headless: true});
                const xml = builder.buildObject(replyMessage);

                res.send(xml);
            } else {
                api.sendText(fromUsername, '我不知道你在说什么！');
                res.send('');
            }
        });
    });
});

app.listen(port, function () {
    console.log('Wechat app listening on port 80!');
});

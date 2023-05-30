import express from 'express'
import request from 'request';
import xml2js from 'xml2js';
import WechatApi from 'wechat-api';
import crypto from 'crypto';
import fetch from "node-fetch";
import https from "https";
import {WebSocketServer} from 'ws';

const app = express()
const port = 3000;

// 在公众平台中获取的基本配置信息

const config = {
    appId: 'wx3046267608ef4a14',
    appSecret: 'cf56b8c0ce7a08497739bdc8bbe31326',
    token: 'ayognice',
    encodingAESKey: 'mjePwq5shh0YmFNpI9R0ojMkP5NHsunH1clt0VGHXvX'
}
const openAIurl = "https://api.openai.com/v1/chat/completions"; //openAi 地址
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

// 实例化一个 WechatApi 对象

const api = new WechatApi(config.appid, config.secret);

let isChect = true
// 配置路由，用于接收 GET 请求，进行微信公众号的验证
app.get('/', function (req, res) {
    console.log('get访问')
    isChect = false
    const query = req.query;
    const signature = query.signature;
    const timestamp = query.timestamp;
    const nonce = query.nonce;
    const echostr = query.echostr;
    const token = config.token;

    const array = [token, timestamp, nonce];
    array.sort();
    const str = array.join('');
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    const result = sha1.digest('hex');

    if (result === signature) {
        res.send(echostr);
    } else {
        res.send('mismatch');
    }
});

// app.use(function(req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
// });

const jsonObj = {
    person: {
        name: 'John',
        age: 30,
        address: {
            city: 'New York',
            state: 'NY',
        },
    },
};

const builder = new xml2js.Builder({rootName: 'root'});
const xml = builder.buildObject(jsonObj);
console.log('xml', xml)
// 配置路由，用于接收 POST 请求，进行消息的处理和回复
// 微信公众号post接口处理
app.post('/', function (req, res) {
    console.log('post访问')
    let data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        xml2js.parseString(data, {explicitArray: false}, async function (err, json) {
            const fromUsername = json.xml.FromUserName;
            const toUsername = json.xml.ToUserName;
            const content = json.xml.Content;
            const data = {
                "model": "gpt-3.5-turbo",
                "messages": [{
                    "role": "user",
                    "content": content
                }],
                "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
            };
            try {
                const response = await fetch(openAIurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`,
                    },
                    body: JSON.stringify(data),
                });
                // 解析响应数据为 JSON 格式
                const responseData = await response.json();
                console.log("responseData", JSON.stringify(responseData.choices))
                const replyMessage = {
                    xml: {
                        ToUserName: fromUsername,
                        FromUserName: toUsername,
                        CreateTime: new Date().getTime(),
                        MsgType: 'text',
                        Content: responseData.choices[0].message.content,
                    },
                };
                const builder = new xml2js.Builder({cdata: true});
                // 将消息转换为 XML 格式
                const xml = builder.buildObject(replyMessage);
                // 设置响应头 Content-Type 为 text/xml
                res.set('Content-Type', 'text/xml');
                res.send(xml);
            } catch (e) {
                console.log('错误', e)
            }

        });
    });
});

app.listen(port, function () {
    console.log('Wechat app listening on port 80!');
});






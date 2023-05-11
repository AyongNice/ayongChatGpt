import express from 'express'
import request from 'request';
import xml2js from 'xml2js';
import crypto from 'crypto';
import fetch from "node-fetch";
import https from "https";
import http from "http";

import {WebSocketServer} from 'ws';

const app = express()
const port = 80;
// 创建一个 HTTP 服务实例
const server = http.createServer(app);

/***** WebSocketServer ****/
const wsServer = new WebSocketServer({
    server
});
// 在公众平台中获取的基本配置信息

const config = {
    appId: 'wx5b9170dca306e76b',
    appSecret: '24a6a548db9ef3c480e1f142ab28a70f',
    token: 'ayognice',
    encodingAESKey: 'mjePwq5shh0YmFNpI9R0ojMkP5NHsunH1clt0VGHXvX'
}
const openAIurl = "https://api.openai.com/v1/chat/completions"; //openAi 地址
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥



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

const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
};

// 微信公众号接口处理

/** wsServer 服务开启 **/
console.log('-----wsServer 服务开启-----')
wsServer.on('connection', function (ws) {

    console.log('----------',ws)
    ws.on('message', async function (message) {
        /** 二进制数据转换 string **/
        const messageData = Buffer.from(message).toString();
        console.log(messageData)

        /** GPT API转发 **/
        const req = https.request(options, (res) => {
            res.on('data', (chunk) => {
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


                    const datachunk = Buffer.from(chunk).toString().replace("data:", "");
                    const streams = datachunk.trim()
                    if (streams !== '[DONE]') {
                        // JSON.parse(streams).choices[0].delta.content
                        try {
                            const streamContent = JSON.parse(streams).choices[0].delta.content
                            console.log('streamContent---', streamContent);
                            const replyMessage = {
                                xml: {
                                    ToUserName: fromUsername,
                                    FromUserName: toUsername,
                                    CreateTime: new Date().getTime(),
                                    MsgType: 'text',
                                    Content: streamContent,
                                },
                            };
                            const builder = new xml2js.Builder({cdata: true});
                            // 将消息转换为 XML 格式
                            const xml = builder.buildObject(replyMessage);
                            // 设置响应头 Content-Type 为 text/xml
                            res.set('Content-Type', 'text/xml');
                            res.send(xml);
                            // ws.send(xml);
                        } catch (e) {
                            console.log('错误', e)
                        }
                    }


                });
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });
        const postData = JSON.stringify({
            "stream": true,
            "model": "gpt-3.5-turbo", "messages": [{
                "role": "user", "content": messageData
            }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
        });
        req.write(postData);
        req.end();

    });
});


// 启动 HTTP 服务和 WebSocket 服务器
server.listen(port, () => {
    console.log('Server started on port .'+port);
});

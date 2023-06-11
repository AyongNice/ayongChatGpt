import express from 'express'
import expressWs from 'express-ws';
import cors from "cors";
import bodyParser from "body-parser";
import mysqlDB from "../my-sql-db/index.js";
// 引入接口文件
import loginRouter from '../login/index.js'
import registerRouter from '../register/index.js'
import router from "../login/index.js";
import rollout from "../rollout/rollout.js";
import url from 'url';
import querystring from 'querystring';
// import {router} from '../sma-verify/index.js'
import http from 'http' ;


import HttpsProxyAgent from 'https-proxy-agent';
import https from 'https';

const API_KEY = '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'; // 替换为您的 OpenAI API 密钥
const app = express();
expressWs(app);
const server = http.createServer(app);
// const io = socketIO(server);
import {WebSocketServer} from 'ws';
import token from "../token/index.js";

const tokenInstance = token.getInterest()
const wsServer = new WebSocketServer({
    port: 8080
});

app.use(cors())//跨域需求 为了方便本地请求，如果部署线上 需要禁止他（地址不泄漏情况☺️可以不管）
app.use(bodyParser.json());
// 添加中间件和配置项
app.use(express.json());

// 挂载接口路由
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/rollout', rollout);

const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);//in environment dev  proxy

const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
    agent: agent
};

// app.ws('/websocket', function (ws) {
//     ws.on('message', async function (message) {
//
//         /** 二进制数据转换 string **/
//         const messageData = Buffer.from(message).toString();
//         /** 前端参数 string **/
//         const userMessageData = JSON.parse(messageData)
//         try {
//             const token = userMessageData.token
//             // const isTokenExpired = tokenInstance.isTokenExpired(token)
//             // if (isTokenExpired === 2) {
//             //     //刷新token
//             //     const newToken = tokenInstance.refreshUserToken(token)
//             //     const message = {
//             //         type: "token",
//             //         newToken
//             //     };
//             //     //返回刷新token
//             //     // ws.send(JSON.stringify(message));
//             //     ws.send(JSON.stringify(message));
//             // }
//             // ws.clone()
//             // if (!isTokenExpired) return
//         } catch (e) {
//             console.log(e)
//         }
//
//
//         // websoket 首次验证拦截 gpt转发
//         if (JSON.parse(messageData).validation) return
//         const postData = JSON.stringify({
//             "stream": true,
//             "model": "gpt-3.5-turbo",
//             "messages": [{
//                 "role": "user", "content": userMessageData.data
//             }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
//         });
//         // const req = https.request(options, (res) => {
//         //     res.on('data', (chunk) => {
//         //         const datachunk = Buffer.from(chunk).toString().replace("data:", "");
//         //         const streams = datachunk.trim()
//         //         if (streams !== '[DONE]') {
//         //             // JSON.parse(streams).choices[0].delta.content
//         //             try {
//         //                 console.log('datachunk---', JSON.parse(streams).choices[0].message.content);
//         //             } catch (e) {
//         //
//         //             }
//         //         }
//         //         // const newToken = tokenInstance.refreshUserToken(token)
//         //         console.log('datachunk', datachunk)
//         //         ws.send(datachunk);
//         //     });
//         // });
//         //
//         // req.on('error', (e) => {
//         //     console.error(e);
//         // });
//         //
//         // req.write(postData);
//         // req.end();
//
//
//     });
// });
app.get('/events', (req, res) => {
    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*'); // 跨域访问控制
    // 发送事件数据
    const sendEvent = (data) => {
        res.write(`event: message\n`);
        res.write(`data: ${data}\n\n`);
    };

    const parsedUrl = url.parse(req.url);
    const query = querystring.parse(parsedUrl.query);
    console.log('Received parameters:', query);
    const queryParameter = JSON.parse(query.messageData)
    try {
        const token = queryParameter.token
        const isTokenExpired = tokenInstance.isTokenExpired(token)
        console.log('isTokenExpired',isTokenExpired)
        if (isTokenExpired === 2) {
            //刷新token
            const newToken = tokenInstance.refreshUserToken(token)
            const message = {
                type: "token",
                newToken
            };
            //返回刷新token
            sendEvent(JSON.stringify(message))
        }
        if (!isTokenExpired) return sendEvent(JSON.stringify({message:'！登陆过期，请登录'}))
    } catch (e) {
        console.log(e)
    }
  


    const postData = JSON.stringify({
        "stream": true,
        "model": "gpt-3.5-turbo",
        "messages": [{
            "role": "user", "content": queryParameter.data
        }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
    });
    const gptRequest = https.request(options, (res) => {
        res.on('data', (chunk) => {
            const datachunk = Buffer.from(chunk).toString().replace("data:", "");
            const streams = datachunk.trim()
            if (streams !== '[DONE]') {
                // JSON.parse(streams).choices[0].delta.content
                try {
                    console.log('datachunk---', JSON.parse(streams));
                    // const newToken = tokenInstance.refreshUserToken(token)
                    console.log('streams', streams)
                    sendEvent(datachunk);
                } catch (e) {

                }
            }
        });
    });

    gptRequest.on('error', (e) => {
        console.error(e);
    });

    gptRequest.write(postData);
    gptRequest.end();

    // 客户端断开连接时清除定时器
    res.on('close', () => {
    });
});

// 启动服务
app.listen(8081, () => {
    console.log('Server started on port 8080');
});

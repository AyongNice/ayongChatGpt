import express from 'express'
import cors from 'cors';
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import bodyParser from 'body-parser';
import {WebSocketServer} from 'ws';
import OpenAI from 'openai-api';
// const  WebSocket = request('ws')
import https from 'https';
import fs from 'fs'


const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);
const port = 3000;
const openAIurl = 'https://api.openai.com/v1/completions'
// const openAIurl = "https://api.openai.com/v1/chat/completions"; //openAi 地址
const diyServeUrl = "/api/openai/gpt3"; //服务器地址
// 创建代理，本地请求测试需要进行科学上网必须开启（前提条件），
// 部署线上需要用到 "外面的服务器" (这里不做过多解释 懂得都懂)
//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

const app = express();
app.use(cors())//跨域需求 为了方便本地请求，如果部署线上 需要禁止他（地址不泄漏情况☺️可以不管）
app.use(bodyParser.json());
// 设置路由，用于接收前端请求
// ada: 一个强大的文本生成引擎，可生成各种类型的文本，包括长篇文章、故事、诗歌和对话。
// babbage: 一个文本生成引擎，可以生成文章、电子邮件和简短的聊天对话。
// curie: 一个文本生成引擎，可以生成短的文本片段，例如电子邮件、新闻文章和散文。
// davinci: OpenAI最强大的文本生成引擎，可以生成各种类型的文本，包括长篇文章、故事、诗歌和对话。
// curie: 一个文本生成引擎，可以生成短的文本片段，例如电子邮件、新闻文章和散文。
// davinci-codex: 用于对代码的生成和补全的引擎。
// davinci-instruct-beta: 可以解释和生成自然语言指令的引擎。
// const url = "https://api.openai.com/v1/engines/davinci-codex/completions";
/**
 * 模型实例1
 * 'https://api.openai.com/v1/completions'
 *     const data = {
 *         "model": "text-davinci-002",
 *         prompt: "1+1=？",
 *         "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
 *     };
 *
 */
/****
 * 模型实例2
 *  "https://api.openai.com/v1/chat/completions";
 *  const data = {
 *             "model": "gpt-3.5-turbo", "messages": [{
 *                 "role": "user", "content": "你好"
 *             }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
 *         };
 * ***/
// test代码
// const data = {
//     "model": "text-davinci-002",
//     prompt: "1+1=？",
//     "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
// };
// fetch(openAIurl, {
//     method: 'POST', headers: {
//         'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`,
//     }, body: JSON.stringify(data), agent: agent // 设置代理
// }).then(async res => {
//     const result = await res.json();
//     console.log('result', result)
// });
app.post(diyServeUrl, async (req, res) => {

    try {
        const response = await fetch(openAIurl, {
            method: 'POST', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`,
            }, body: JSON.stringify(req.body), agent: agent // 设置代理
        });
        // 解析响应数据为 JSON 格式
        const responseData = await response.json();
        // const responseData = {
        //     "id": "chatcmpl-7BFK4ApZuknJQE7uyIGMVCGmc8E0h",
        //     "object": "chat.completion",
        //     "created": 1682914864,
        //     "model": "gpt-3.5-turbo-0301",
        //     "usage": {"prompt_tokens": 10, "completion_tokens": 18, "total_tokens": 28},
        //     "choices": [{
        //         "message": {"role": "assistant", "content": "你好！有什么我可以帮助你的吗？"},
        //         "finish_reason": "stop",
        //         "index": 0
        //     }]
        // };
        // console.log(JSON.stringify(responseData) )
        res.json(responseData);
    } catch (error) {
        console.error(error);
    }
});


const wss = new WebSocketServer({port: 8000});
let num = 0
wss.on('connection', function connection(ws) {
    ws.on('message', async function (message) {
        /** 二进制数据转换 string **/
        const messageData = Buffer.from(message).toString();
        console.log('messageData---', messageData)
        const data = {
            "model": "gpt-3.5-turbo", "messages": [{
                "role": "user", "content": "你好"
            }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
        };


        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            }
        };

        const requestData = JSON.stringify({
            prompt: 'Hello, world!',
            max_tokens: 10,
            temperature: 0.5
        });


        // const response = await fetch(openAIurl, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${API_KEY}`,
        //     },
        //     body:  JSON.stringify(data),
        //     agent: agent // 设置代理
        // });
        // const result = await response.json();
        // console.log('result',result)


        // for (let i = 0; i < messageData.length; i++) {
        //     data.messages[0].content = messageData[i]
        //     console.log(JSON.stringify(data))
        //     // 发起 GPT-3 API 请求
        const response = await fetch(openAIurl, {
            method: 'POST', headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`,
            }, body: JSON.stringify(data), agent: agent // 设置代理
        });
        //     const result = await response.json();
        //     console.log('result', JSON.stringify(result))
        //     ws.send(result.choices[0].message.content);
        //     // 解析 API 响应并将结果发送回客户端
        //     // const result = (await response.json()).choices[0].text.trim();
        //
        //     // setTimeout(() => {
        //     //     // 解析 API 响应并将结果发送回客户端
        //     //     // ws.send(messageData);
        //     //     console.log(messageData[i])
        //     //     ws.send(messageData[i]);
        //     //
        //     // }, i * 200);
        // }
        // const responseData = '一二三四五六七八'
        // let resLength = 0;
        // console.log(responseData.length)
        // for (let i = 0; i <responseData.length; i++) {
        //     setTimeout(() => {
        //         // ws.send(responseData[i]);
        //     }, i * 200);
        // }

    });

    ws.on('close', function close() {
        console.log('Client disconnected.');
    });
});

// 启动服务器，监听端口
// app.listen(port, () => {
//     console.log('代理服务器已启动，监听端口 3000');
// });


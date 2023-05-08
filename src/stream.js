import HttpsProxyAgent from 'https-proxy-agent';
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

import https from 'https';
import {WebSocketServer} from 'ws';


const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);

const wsServer = new WebSocketServer({
    port: 80
});

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




wsServer.on('connection', function (ws) {
    ws.on('message', async function (message) {
        /** 二进制数据转换 string **/
        const messageData = Buffer.from(message).toString();
        ws.send(1);
        // const req = https.request(options, (res) => {
        //     res.on('data', (chunk) => {
        //         const datachunk = Buffer.from(chunk).toString().replace("data:", "");
        //         const streams = datachunk.trim()
        //         if(streams !== '[DONE]'){
        //             // JSON.parse(streams).choices[0].delta.content
        //             try {
        //                 console.log('datachunk---',JSON.parse(streams).choices[0].delta.content );
        //             }catch (e) {
        //
        //             }
        //         }
        //         ws.send(datachunk);
        //     });
        // });
        //
        // req.on('error', (e) => {
        //     console.error(e);
        // });
        // const postData = JSON.stringify({
        //     "stream": true,
        //     "model": "gpt-3.5-turbo", "messages": [{
        //         "role": "user", "content": messageData
        //     }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
        // });
        // req.write(postData);
        // req.end();

    });
});

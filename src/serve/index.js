import express from 'express'
import cors from "cors";
import bodyParser from "body-parser";
import mysqlDB from "../my-sql-db/index.js";
// 引入接口文件
import loginRouter from '../login/index.js'
import registerRouter from '../register/index.js'
import router from "../login/index.js";
// import {router} from '../sma-verify/index.js'
import http from 'http' ;
import socketIO from '../testt.cjs' ;

import HttpsProxyAgent from 'https-proxy-agent';
import https from 'https';
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

console.log('socketIO',socketIO)
const app = express();
const server = http.createServer(app);
const io = socketIO(server);


app.use(cors())//跨域需求 为了方便本地请求，如果部署线上 需要禁止他（地址不泄漏情况☺️可以不管）
app.use(bodyParser.json());
// 添加中间件和配置项
app.use(express.json());

// 挂载接口路由
app.use('/login', loginRouter);
app.use('/register', registerRouter);



const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);


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

io.on('connection', function (ws) {
    ws.on('message', async function (message) {
        /** 二进制数据转换 string **/
        const messageData = Buffer.from(message).toString();
        // ws.send(1);
        const req = https.request(options, (res) => {
            res.on('data', (chunk) => {
                const datachunk = Buffer.from(chunk).toString().replace("data:", "");
                const streams = datachunk.trim()
                if(streams !== '[DONE]'){
                    // JSON.parse(streams).choices[0].delta.content
                    try {
                        console.log('datachunk---',JSON.parse(streams).choices[0].message.content );
                    }catch (e) {

                    }
                }
                ws.send(datachunk);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });
        const postData = JSON.stringify({
            "stream": true,
            "model": "gpt-3.5-turbo",
            "messages": [{
                "role": "user", "content": messageData
            }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
        });
        req.write(postData);
        req.end();

    });
});

// 启动服务
app.listen(8080, () => {
    console.log('Server started on port 8080');
});

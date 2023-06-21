import url from "url";
import querystring from "querystring";
import https from "https";
import express from 'express'
import cookieParser from 'cookie-parser';
import tokens from "../token/index.js";
import HttpsProxyAgent from "https-proxy-agent";
const router = express.Router();

const tokenInstance = tokens.getInterest()
router.use(cookieParser());
const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);//in environment dev  proxy
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

const options = {
    hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST', headers: {
        'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`,
    }, agent: agent
};
router.get('/events', (req, res) => {
    // 设置响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*'); // 跨域访问控制
    // 发送事件数据
    const sendEvent = (data, message = 'message') => {
        res.write(`event: ${message}\n`);
        res.write(`data: ${data}\n\n`);
    };

    const parsedUrl = url.parse(req.url);
    const query = querystring.parse(parsedUrl.query);
    console.log('Received parameters:', query);
    const queryParameter = JSON.parse(query.messageData)
    try {
        const token = queryParameter.token
        const userId = queryParameter.user
        const isTokenExpired = tokenInstance.isTokenExpired(token, userId)
        console.log('isTokenExpired', isTokenExpired)
        if (isTokenExpired === 2) {
            //刷新token
            const newToken = tokenInstance.refreshUserToken(token)
            const message = {
                type: "token", newToken
            };
            //返回刷新token
            sendEvent(JSON.stringify(message))
        }
        if (isTokenExpired === 3) return sendEvent(JSON.stringify({
            message: '!尊敬的VIP贵宾，您的账号在别的地方登陆，请勿将账号密码泄露他人，您需要点击左下角退出重新登陆',
            type: 'error'
        }))
        if (!isTokenExpired) return sendEvent(JSON.stringify({
            message: '!尊敬的VIP贵宾，登陆过期,您需要点击左下角退出重新登陆',
            type: 'error'
        }))
    } catch (e) {
        console.log(e)
    }
    const postData = JSON.stringify({
        "stream": true, "model": "gpt-3.5-turbo", "messages": [{
            "role": "user", "content": queryParameter.data
        }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
    });
    const gptRequest = https.request(options, (res) => {
        res.on('data', (chunk) => {
            const datachunk = Buffer.from(chunk).toString().replace("data:", "");
            const streams = datachunk.trim()
            // if (streams !== '[DONE]') {
            // JSON.parse(streams).choices[0].delta.content
            try {
                console.log('datachunk---', JSON.parse(streams));
                // const newToken = tokenInstance.refreshUserToken(token)
                console.log('streams', streams)
                sendEvent(datachunk);
            } catch (e) {
                sendEvent(datachunk);
            }
            // }
        });
    });

    gptRequest.on('error', (e) => {
        sendEvent(JSON.stringify({
            message: '!尊敬的VIP贵宾，服务器压力大稍冲个1块钱加加速吧，',
            type: 'error'
        }))
    });

    gptRequest.write(postData);
    gptRequest.end();

    // 客户端断开连接时清除定时器
    res.on('close', () => {
    });
});

export default router

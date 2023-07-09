import url from "url";
import querystring from "querystring";
import https from "https";
import express from 'express'
import cookieParser from 'cookie-parser';
import tokens from "../token/index.js";
import HttpsProxyAgent from "https-proxy-agent";
import mysqlDB from "../my-sql-db/index.js";

const router = express.Router();

const tokenInstance = tokens.getInterest()
router.use(cookieParser());
const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);//in environment dev  proxy
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥
import {fontUrlAddress}from '../utils/utils.js'
router.get('/events', (req, res) => {
    const referer = req.headers.referer;
    if (!fontUrlAddress.includes(referer)) return res.status(500).json({message: 'xxxxx', code: 0});

    const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenInstance.getApikey() || API_KEY}`,
        },
        // agent
    };
    console.log('API_KEY', options.headers)

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
    const queryParameter = JSON.parse(query.messageData)
    const token = queryParameter.token
    const userId = queryParameter.user
    const userInfo = tokenInstance.getMemberInfo(userId)
    try {
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

        /** token过期 查询是否会员 **/
        if (isTokenExpired === 3 || !isTokenExpired) {
            /** 会员更新DB API使用次数 **/
            if (userInfo.level && Number(userInfo.level)) {//更新会员API次数
                mysqlDB.updataMemberApiCalls(userInfo.apiCalls, userId)
            }
            if (userInfo.count) {
                /** 更新免费次数DB **/
                mysqlDB.updatAgratisCount(userInfo.count, userId)
            }
            /** deleteToken **/
            tokenInstance.deleteToken(token, userId)
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
    console.log('userInfo--caht--', userInfo)
    if (!userInfo) return
    if (!userInfo.count) {
        console.log('免费额度用完')
        if (userInfo.level) {
            console.log('会员----情况查余额度', !userInfo.apiCalls && userInfo.level !== 6)
            if (!userInfo.apiCalls && userInfo.level !== 6) {
                return sendEvent(JSON.stringify({
                    message: '!感谢大哥对阿勇对支持，最近有点难，冲一块在支持一下吧',
                    type: 'error'
                }))
            }
        } else {
            console.log('非会员----额度用完', userInfo.level)
            return sendEvent(JSON.stringify({
                message: '!大哥，这50下爽不爽，冲一块钱吧，阿勇不容易，冲一块钱再让你爽一爽',
                type: 'error'
            }))

        }
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
            if (streams.includes('[DONE]')) {
                console.log('streams---[DONE]', userInfo, streams)
                /**  更新内存 API使用次数 **/
                tokenInstance.deductApiCalls({userId})
                sendEvent(JSON.stringify({
                    message: '余额提示',
                    count: tokenInstance.getMemberInfo(userId).count,
                    type: 'change'
                }))
            }
            try {
                sendEvent(datachunk);
            } catch (e) {
                sendEvent(datachunk);
            }
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

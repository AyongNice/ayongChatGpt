import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';
import FormData from 'form-data';

const router = express.Router();
import tokens from "../token/index.js";
import https from 'https';
import CryptoJS from 'crypto-js';
import url from "url";
import querystring from 'querystring';
import utils from "../utils/utils.js";

const tokenInstance = tokens.getInterest()
router.use(cookieParser());
const SECRETKEY = 'vOt0NaQ0QRrC3yapTPSIen6S8LoPqMGs' //商家密钥
/**
 *  订单编号生成
 * @param length
 * @returns {string}
 */
function generateRandomString(length) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        let randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}

/**
 * MD5算法
 * @param params
 * @param secretKey
 * @returns {*}
 */
function generateSignature(params, secretKey) {
    // 将参数按照字典序排序并拼接成字符串
    let sortedParams = Object.keys(params).sort();
    let queryString = "";
    for (let i = 0; i < sortedParams.length; i++) {
        let key = sortedParams[i];
        let value = params[key];
        queryString += key + value;
    }

    // 计算MD5签名
    let signature = CryptoJS.MD5(queryString + secretKey).toString();

    return signature;
}

// 添加字段到form-data实例的方法
function addFieldsToFormData(form, fields) {
    for (const [key, value] of Object.entries(fields)) {
        form.append(key, value);
    }
}

router.post('/start', (appRequest, appResponse) => {
    const {username, money} = appRequest.body;
    const token = appRequest.cookies.token;
    const userId = appRequest.cookies.user;
    const isTokenExpired = tokenInstance.isTokenExpired(token, userId)

    if (isTokenExpired === 3) return appResponse.status(401).json({
        message: '!尊敬的VIP贵宾，您的账号在别的地方登陆，请勿将账号密码泄露他人，您需要点击左下角退出重新登陆',
        code: 3
    });
    if (!isTokenExpired) return appResponse.status(401).json({
        message: '!尊敬的VIP贵宾，登陆过期,您需要点击左下角退出重新登陆',
        code: 2
    });
    console.log(money, userId, token)
    const params = {
        name: "超级无敌黄金至尊顶级SVIP会员",
        money: money,
        out_trade_no: generateRandomString(21),
        notify_url: `http://13.51.250.185:8081/alpay/end`,
        param: 'qew',
        return_url: "http://www.baidu.com",
        sign: "28f9583617d9caf66834292b6ab1cc89",
        sign_type: "MD5",
        pid: "20230429181725",
        type: "wxpay"
    };
    const secretKey = SECRETKEY;
    params.sign = generateSignature(params, secretKey)
    // 创建一个新的form-data实例
    const form = new FormData();
    // 添加参数到FormData对象
    for (const key in params) {
        form.append(key, params[key]);
    }
    // 比较 URL
    const options = {
        hostname: '7-pay.cn',
        path: '/mapi.php',
        method: 'POST',
        headers: form.getHeaders()
    };
    // 发送 HTTP 请求
    const req7Pay = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
            responseBody += chunk;
        });
        res.on('end', () => {
            // 解析req7Pay数据
            const response = JSON.parse(responseBody);
            console.log('response', response);
            let newToken = ''
            if (isTokenExpired === 2) newToken = tokenInstance.refreshUserToken(token)
            tokenInstance.addOrdersPojo(response.trade_no, userId)
            appResponse.status(200).json({message: '扫码支付', data: response.qrcode, newToken, code: 1});

        });
    });
    // 处理请求错误
    req7Pay.on('error', error => {
        appResponse.status(200).json({message: error});
    });
    // 发送form-data作为请求体
    form.pipe(req7Pay);
    req7Pay.end();

});
router.get('/end', (req, res) => {
    // 设置响应头
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');
    // res.setHeader('Connection', 'keep-alive');
    // res.setHeader('Access-Control-Allow-Origin', '*'); // 跨域访问控制
    // 发送事件数据
    const sendEvent = (data) => {
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    console.log('支付-----req.url',req.url)

    try {
        /** 获取请求参数 **/
        const parsedUrl = url.parse(req.url);
        const {
            source,
            money,
            out_trade_no,
        } = querystring.parse(parsedUrl.query);


        const username = tokenInstance.getOrdersPojoUseid(out_trade_no)
        // console.log(' querystring.parse(parsedUrl.query)',querystring.parse(parsedUrl.query))
        // let isTokenExpired = 1
        // if (token && userId) isTokenExpired = tokenInstance.isTokenExpired(token, userId)
        // if (![1, 3].includes(isTokenExpired)) return
        console.log('out_trade_no',out_trade_no)
        console.log('money',money)
        console.log('username',username)
        /** 无订单信息 **/
        if (!username) return
        /** 获取7支付接口访问处理 **/
        if (source === 'ayong') {
            console.log('/end---充值完成--', source)
            mysqlDB.insertMembershipInfo({
                username:username,
                registrationDate: utils.getDATETIME(1),
                expirationDate: utils.getDATETIME(60),
                amount: money,
                succeed: (message) => {
                    console.log('充值成功message--', message)
                    sendEvent({level: res.level, amount: res.amount})
                },
                fail: (err) => {
                    console.log('results', err)
                    sendEvent(err)
                }
            })
        }

    } catch (e) {
        console.log('支付结果报错',e)
    }


});

export default router

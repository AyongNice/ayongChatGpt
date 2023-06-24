import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';
const router = express.Router();
import tokens from "../token/index.js";
import url from "url";
import querystring from 'querystring';
import utils from "../utils/utils.js";

const tokenInstance = tokens.getInterest()
router.use(cookieParser());

/**
 * 支付结果接受接口
 */
router.get('/', (req, res) => {
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
        if (source !== 'ayong') {
            console.log('/end---充值完成响应接口--', source)
            // mysqlDB.insertMembershipInfo({
            //     username,
            //     registrationDate: utils.getDATETIME(1),
            //     expirationDate: utils.getDATETIME(60),
            //     amount: money,
            //     succeed: (res) => {
            //         console.log('充值成功message--', res)
            //         sendEvent({level: res.level, amount: res.amount})
            //     },
            //     fail: (err) => {
            //         console.log('results', err)
            //         sendEvent(err)
            //     }
            // })
        }

    } catch (e) {
        console.log('支付结果报错',e)
    }


});

export default router

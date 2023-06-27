import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';
import Enigma from '../Enigma.js'//Enigma
const router = express.Router();
import tokens from "../token/index.js";

const token = tokens.getInterest()
console.log("token", token)
router.use(cookieParser());
router.post('/', (req, res) => {
    const {username, password} = req.body;
    console.log(username, password)

// 获取 Referer 值
    const referer = req.headers.referer;
    // 比较 URL
    // if (referer !== 'https://your-frontend-domain.com/specific-page') {
    //     // 请求来源不是你的前端网站特定页面，做相应处理
    //     return res.status(403).json({error: 'Forbidden'});
    // }

    mysqlDB.login({
        username, password, succeed: (data) => {
            console.log('data---d登陆', data)
            const getToken = token.generateToken(username, data.level || 0, data.amount || 0, data.apiCalls || 0, data.count)
            res.status(200).json({message: 'Login successful', token: getToken, code: 1});
        }, fail: (err) => {
            res.status(401).json({message: err, code: 0});

        }
    })

});


export default router

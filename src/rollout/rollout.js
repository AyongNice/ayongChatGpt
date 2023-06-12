import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';

const router = express.Router();
import tokens from "../token/index.js";

const token = tokens.getInterest()
router.use(cookieParser());

router.post('/', (req, res) => {
    const myCookie = req.cookies.token;
    const {userId} = req.body;
    const deleteTokenRes = token.deleteToken(userId, myCookie)

    if (deleteTokenRes) {
        res.status(200).json({message: 'Login successful'});

    } else {
        res.status(500).json({message: '推出失败'});
    }
// 获取 Referer 值
    const referer = req.headers.referer;
    // 比较 URL
    // if (referer !== 'https://your-frontend-domain.com/specific-page') {
    //     // 请求来源不是你的前端网站特定页面，做相应处理
    //     return res.status(403).json({error: 'Forbidden'});
    // }


});
export default router

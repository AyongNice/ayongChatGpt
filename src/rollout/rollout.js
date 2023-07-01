import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';

const router = express.Router();
import tokens from "../token/index.js";

const tokenInstance = tokens.getInterest()
router.use(cookieParser());

router.post('/', (req, res) => {
    const token = req.cookies.token;
    const userId = req.cookies.user;
    const userInfo = tokenInstance.getMemberInfo(userId)
    if (!userInfo) return res.status(200).json({message: 'Login successful'});
    if (Number(userInfo.level)) {//更新会员API次数
        mysqlDB.updataMemberApiCalls(userInfo.apiCalls, userId)
    }

    /** 更新免费次数DB **/
    mysqlDB.updatAgratisCount(userInfo.count, userId)
    const deleteTokenRes = tokenInstance.deleteToken(token, userId)

    if (deleteTokenRes) {
        res.status(200).json({message: 'Login successful'});

    } else {
        res.status(500).json({message: '推出失败'});
    }


});
export default router

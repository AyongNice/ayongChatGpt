import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';

const router = express.Router();
import tokens from "../token/index.js";

const token = tokens.getInterest()
router.use(cookieParser());
router.post('/', (req, res) => {
    const {username, password} = req.body;
    // console.log(username, password)
// 获取 Referer 值
    const referer = req.headers.referer;
    console.log('referer', referer)
    if (referer !== 'http://ayongnice.love/chatgpt/') return res.status(500).json({message: 'xxxxx', code: 0});
    const userInfo = token.getMemberInfo(username)
    if (!userInfo || JSON.stringify(userInfo) === '{}') return login()
    /** 更新免费次数DB **/
    mysqlDB.updatAgratisCount(userInfo.count, username, () => {
        /** 更新会员API次数 **/
        if (Number(userInfo.level)) {
            mysqlDB.updataMemberApiCalls(userInfo.apiCalls, username, () => {
                login()
            })
        } else {
            login()
        }
    })

    function login() {
        mysqlDB.login({
            username, password, succeed: (data) => {
                const getToken = token.generateToken(username, data.level || 0, data.amount || 0, data.apiCalls || 0, data.count)
                res.status(200).json({message: 'Login successful', token: getToken, code: 1});
            }, fail: (err) => {
                res.status(401).json({message: '尊敬的SVP用户,您需要先注册账号哟', code: 0});

            }
        })
    }


});


export default router

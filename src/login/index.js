import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';
const router = express.Router();
import tokens from "../token/index.js";

const token = tokens.getInterest()
console.log("token", token)
router.use(cookieParser());
router.post('/', (req, res) => {
    const {username, password} = req.body;
    const tokenstr = req.cookies.token;
    // const isToken= token.isTokenExpired(myCookie)
    console.log('login---token',tokenstr)
    // console.log('isToken',isToken)

    console.log(username,password)

// 获取 Referer 值
    const referer = req.headers.referer;
    // 比较 URL
    // if (referer !== 'https://your-frontend-domain.com/specific-page') {
    //     // 请求来源不是你的前端网站特定页面，做相应处理
    //     return res.status(403).json({error: 'Forbidden'});
    // }

        mysqlDB.login({
        username, password, succeed: () => {
            const getToken = token.generateToken(username,tokenstr)
            res.status(200).json({message: 'Login successful', token: getToken});
        }, fail: (err) => {
            console.log('results',err)
            res.status(500).json({message: err});
        }
    })

});


export default router

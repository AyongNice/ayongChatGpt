/**
 * 会员信息查询
 */
import express from 'express'
import cookieParser from 'cookie-parser';


const router = express.Router();
import tokens from "../token/index.js";

const tokenInstance = tokens.getInterest()

router.use(cookieParser());

router.post('/', async (appRequest, appResponse) => {
    const token = appRequest.cookies.token;
    const userId = appRequest.cookies.user;
    // console.log('appRequest.cookies', appRequest.cookies)
    const isTokenExpired = tokenInstance.isTokenExpired(token, userId)

    if (isTokenExpired === 3) return appResponse.status(401).json({
        message: '!尊敬的VIP贵宾，您的账号在别的地方登陆，请勿将账号密码泄露他人，您需要点击左下角退出重新登陆',
        code: 0
    });
    if (!isTokenExpired) return appResponse.status(401).json({
        message: '!尊敬的VIP贵宾，登陆过期,您需要点击左下角退出重新登陆',
        code: 0
    });
    let newToken = ''
    if (isTokenExpired === 2) newToken = tokenInstance.refreshUserToken(token)
    const data = tokenInstance.getMemberInfo(userId)
    // delete data.expiry
    appResponse.status(200).json({message: '会员SVIP', token: newToken, data});
})
export default router

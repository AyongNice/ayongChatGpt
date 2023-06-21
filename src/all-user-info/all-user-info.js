/**
 * 会员信息查询
 */
import express from 'express'
import mysqlDB from '../my-sql-db/index.js'

const router = express.Router();
router.post('/', async (appRequest, appResponse) => {
    const {password} = appRequest.body;
    if (password !== 'ayong7758521') return appRequest.status(400).json({message: '你不是阿勇，勿扰', data: {}, code: 0});
    mysqlDB.allUserInfo((data) => {
        appResponse.status(200).json({message: '查询所有信息', data, code: 1});
    }, (err) => {
        appResponse.status(400).json({message: err, data: {}, code: 0});
    })

})
export default router

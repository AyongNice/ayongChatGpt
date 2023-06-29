/**
 * API key set
 */
import express from 'express'

const router = express.Router();
import tokens from "../token/index.js";

const tokenInstance = tokens.getInterest()
router.post('/', async (appRequest, appResponse) => {
    const {password, apiKey} = appRequest.body;
    if (password !== 'ayong7758521') return appResponse.status(400).json({
        message: '你不是阿勇，勿扰',
        data: {},
        code: 0
    });
    tokenInstance.setApikey(apiKey)
    return appResponse.status(200).json({
        message: 'ok!',
        code: 0
    });
})
export default router

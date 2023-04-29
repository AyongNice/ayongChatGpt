import express from 'express'
const app = express()
import wechatApi  from 'wechat-api';

const config = {
    appId: 'wx3046267608ef4a14',
    appSecret: 'cf56b8c0ce7a08497739bdc8bbe31326',
    token: 'ayognice',
    encodingAESKey: 'mjePwq5shh0YmFNpI9R0ojMkP5NHsunH1clt0VGHXvX'
}

const api = new wechatApi(config.appId, config.appSecret)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
    console.log('get访问')
    const { signature, timestamp, nonce, echostr } = req.query
    const isValid = api.checkSignature({ signature, timestamp, nonce })
    if (isValid) {
        res.send(echostr)
    } else {
        res.status(401).send('你好')
    }
})

app.post('/', (req, res) => {
    console.log('post访问')
    const { signature, timestamp, nonce } = req.query
    const isValid = api.checkSignature({ signature, timestamp, nonce })
    if (isValid) {
        // 在这里进行业务逻辑处理
        res.send('你好')
    } else {
        res.status(401).send('Invalid signature')
    }
})

app.listen(80, () => {
    console.log('Server is running at prot:3000')
})

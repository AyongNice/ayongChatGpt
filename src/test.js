import express from 'express'
import request from 'request';
import xml2js from 'xml2js';
import crypto from 'crypto';
import fetch from "node-fetch";
import https from "https";
import http from "http";
import cors from 'cors';
import HttpsProxyAgent from "https-proxy-agent";

const app = express()
const port = 80;
app.use(cors())//跨域需求 为了方便本地请求，如果部署线上 需要禁止他（地址不泄漏情况☺️可以不管）


const proxy = 'http://127.0.0.1:7890'; // 代理地址
const agent = new HttpsProxyAgent(proxy);
// 在公众平台中获取的基本配置信息

const config = {
    appId: 'wx5b9170dca306e76b',
    appSecret: '24a6a548db9ef3c480e1f142ab28a70f',
    token: 'ayognice',
    encodingAESKey: 'mjePwq5shh0YmFNpI9R0ojMkP5NHsunH1clt0VGHXvX'
}
const openAIurl = "https://api.openai.com/v1/chat/completions"; //openAi 地址
const API_KEY = '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'; // 替换为您的 OpenAI API 密钥

// 配置路由，用于接收 GET 请求，进行微信公众号的验证
app.get('/', function (req, res) {
    const query = req.query;
    const signature = query.signature;
    const timestamp = query.timestamp;
    const nonce = query.nonce;
    const echostr = query.echostr;
    const token = config.token;

    const array = [token, timestamp, nonce];
    array.sort();
    const str = array.join('');
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    const result = sha1.digest('hex');

    if (result === signature) {
        res.send(echostr);
    } else {
        res.send('mismatch');
    }
});

const options = {
    hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST', headers: {
        'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`,
    }, agent: agent

};
// 微信公众号接口处理
app.post('/', function (req, res) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', async function () {
        console.log('app----post---data', data)
        const {xml, content} = await weChatResponse({
            data, streams: '你好'
        })
        console.log('weChatResponse----callback---content', content)
        // 设置响应头 Content-Type 为 text/xml
        res.set('Content-Type', 'text/xml');
        res.send(xml);
    })

})


/**
 * 接收公众号用户端信息
 * @param data {XML} 用户端信息
 * @param streams {string} 回复用户端信息
 * @param callback {Function} 完成回调
 * @returns {Promise<unknown>}
 */
function weChatResponse({
                            data, streams, callback = () => {
    }
                        }) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(data, {explicitArray: false}, async function (err, json) {
            const fromUsername = json.xml.FromUserName;
            const toUsername = json.xml.ToUserName;
            const content = json.xml.Content;
            const data = {
                "model": "gpt-3.5-turbo", "messages": [{
                    "role": "user", "content": content
                }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
            };
            const replyMessage = {
                xml: {
                    ToUserName: fromUsername,
                    FromUserName: toUsername,
                    CreateTime: new Date().getTime(),
                    MsgType: 'text',
                    Content: streams,
                },
            };
            const builder = new xml2js.Builder({cdata: true});
            // 将消息转换为 XML 格式
            const xml = builder.buildObject(replyMessage);
            callback({xml, content, toUsername})
            resolve({xml, content, toUsername})
        });
    })

}

/**
 * 发送消息至微信客户
 * @param toUser {string} 公众号用户openID
 * @param content {string} 回复信息
 * @returns {Promise<unknown>}
 */
async function sendTextMessage(toUser, content) {
    return new Promise(async (resolve, reject) => {
        const accessToken = await getAccessToken(); //获取token

        console.log('accessToken',accessToken)
        const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
        const body = {
            touser: toUser, msgtype: 'text', text: {
                content: content,
            },
        };
        request.post({url, json: body}, (err, response, body) => {
            if (err) {
                reject(err)
                console.error('Error sending message:', err);
            } else {
                resolve(body)
                console.log('Message sent:', body);
            }
        });
    })

}
/**
 *  请求GPT api
 * @param stream {string} 请求内容
 * @param callback {Function:string}
 */
function requestGPT({
                        stream = false, callback = () => {
    }
                    }) {
    /** GPT API转发 **/
    const request = https.request(options, (res) => {
        res.on('data', (chunk) => {
            const datachunk = Buffer.from(chunk).toString().replace("data:", "");
            const streams = datachunk.trim()
            if (streams !== '[DONE]') {
                callback({streams: JSON.parse(streams).choices[0].message.content})
            }
        });
    });

    request.on('error', (e) => {
        console.error(e);
    });
    const postData = JSON.stringify({
        "stream": stream, "model": "gpt-3.5-turbo", "messages": [{
            "role": "user", "content": '你好'
        }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
    });
    request.write(postData);
    request.end();

}

/**
 * 获取token
 * @returns {Promise<unknown>}
 */
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                const result = JSON.parse(body);
                console.log('getAccessToken', result)
                if (result.access_token) {
                    resolve(result.access_token);
                } else {
                    reject(result);
                }
            }
        });
    });
};
// 启动 HTTP 服务和 WebSocket 服务器
app.listen(port, () => {
    console.log('Server started on port .' + port);
});

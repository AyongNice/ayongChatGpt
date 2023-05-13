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
    },
    // agent: agent

};
// 微信公众号接口处理
app.post('/', function (req, res) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', async function () {
        const {content, fromUsername, toUsername} = await weChatResponse({
            data, streams: '你好'
        })

        let gptRes = '';
        let count = 0;
        let time = null;
        console.log('weChatResponse----callback---content', content)
        requestGPT({
            content,
            callback: ({streams}) => {
                gptRes = streams
            }
        })
        clearInterval(time)
        time = setInterval(() => {
            count++;
            gptRes ? send() : count >= 3 && send('响应长度超出微信限制;请暂时提问些简单回复的问题;客户聊天机制升级优化中尽情期待公众号通知')
        }, 800)


        function send() {
            const xml = assembleXML({fromUsername, toUsername, gptRes})
            // 设置响应头 Content-Type 为 text/xml
            res.set('Content-Type', 'text/xml');
            res.send(xml);
            clearInterval(time)
        }

        // sendTextMessage(toUsername,'阿勇学前端')
    })

})

/**
 * XML 转换
 * @param fromUsername 用户名
 * @param toUsername 用户ID
 * @param gptRes  gpt 答案
 * @returns {*}
 */
function assembleXML({fromUsername, toUsername, gptRes}) {
    console.log('assembleXML', fromUsername, toUsername, gptRes)
    const replyMessage = {
        xml: {
            ToUserName: fromUsername,
            FromUserName: toUsername,
            CreateTime: new Date().getTime(),
            MsgType: 'text',
            Content: gptRes,
        },
    };

    const builder = new xml2js.Builder({cdata: true});
    // 将消息转换为 XML 格式
    return builder.buildObject(replyMessage);
}

/**
 * 接收公众号用户端信息
 * @param data {XML} 用户端信息
 * @param callback {Function} 完成回调
 * @returns {Promise<unknown>}
 */
function weChatResponse({
                            data, callback = () => {
    }
                        }) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(data, {explicitArray: false}, async function (err, json) {
            const fromUsername = json.xml.FromUserName;
            const toUsername = json.xml.ToUserName;
            const content = json.xml.Content;

            callback({content, toUsername})
            resolve({content, fromUsername, toUsername})
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

        console.log('accessToken', accessToken)
        const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
        const body = {
            touser: toUser, msgtype: 'text', text: {
                content: content,
            },
        };
        request.post({url, json: body}, (err, response, body) => {
            if (err) {
                console.error('Error sending message:', err);
                reject(err)
            } else {
                console.log('Message sent:', body);
                resolve(body)
            }
        });
    })

}

/**
 *  请求GPT api
 * @param stream {boolean} 请求模式 true 流式 默认false 非流式
 * @param content
 * @param callback {Function:string}
 */
function requestGPT({
                        stream = false, content, callback = () => {
    }
                    }) {
    const chunks = [];
    /** GPT API转发 **/
    const request = https.request(options, (res) => {
        res.on('data', (chunk) => {
            console.log('res.on----data----chunk',chunk)
            if (stream) {
                const datachunk = Buffer.from(chunk).toString().replace("data:", "");
                const streams = datachunk.trim()
                if (streams !== '[DONE]') {
                    callback({streams: JSON.parse(streams).choices[0].message.content})
                }
            } else {
                chunks.push(chunk);
            }

        });
    });

    request.on('error', (e) => {
        console.error(e);
    });
    request.on('end', () => {
        console.log(' request.on--end--chunks',chunks)
        if (!stream) { //非流式处理全部结果
            const data = Buffer.concat(chunks);
            const result = JSON.parse(data.trim());
            console.log('result',result)
            callback({streams: result.choices[0].message.content})
        }
        // 进行处理
    });
    const postData = JSON.stringify({
        "stream": stream, "model": "gpt-3.5-turbo", "messages": [{
            "role": "user", "content": content
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

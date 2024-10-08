import express from 'express'
import bodyParser from "body-parser";
import mysqlDB from '../my-sql-db/index.js'
import Nexmo from 'nexmo';
import crypto from 'crypto';
import request from 'request';
import tencentcloud from "tencentcloud-sdk-nodejs"

const app = express();
app.use(bodyParser.json());
export const router = express.Router();
// mysqlDB.addUser({username: 'ayong9990', password: '123', phone: 132406111})


const nexmo = new Nexmo({
    apiKey: '0184a075',
    apiSecret: 'd4nJt0flVKn4IBYF'
});

const from = '+86 188 0383 6328';
const to = '+86 132 4061 1891';
const verificationCode = '123456';

// nexmo.message.sendSms(from, to, `Your verification code is: ${verificationCode}`, (err, responseData) => {
//     if (err) {
//         console.log('验证码',err);
//     } else {
//         console.log('Message sent successfully.验证码--成功',responseData);
//         if (responseData.messages[0].status === '0') {
//
//         } else {
//             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//         }
//     }
// });


// 腾讯云短信验证码接口信息
const secretId = 'AKIDCl6D4g3C5i6E6jbKp43mHWinkUzGKJ9V';
const secretKey = 'A6pKaaLr79zby6zd3ECyWoskcP0PZWRD';
// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client

let smaCaptcha = ''
/* 实例化要请求产品(以sms为例)的client对象 */
const client = new smsClient({
    credential: {
        /* 必填：腾讯云账户密钥对secretId，secretKey。
         * 你也可以直接在代码中写死密钥对，但是小心不要将代码复制、上传或者分享给他人，
         * 以免泄露密钥对危及你的财产安全。
         * SecretId、SecretKey 查询: https://console.cloud.tencent.com/cam/capi */
        secretId,
        secretKey,
    },
    /* 必填：地域信息，可以直接填写字符串ap-guangzhou，支持的地域列表参考 https://cloud.tencent.com/document/api/382/52071#.E5.9C.B0.E5.9F.9F.E5.88.97.E8.A1.A8 */
    region: "ap-guangzhou",
    /* 非必填:
     * 客户端配置对象，可以指定超时时间等配置 */
    profile: {
        /* SDK默认用TC3-HMAC-SHA256进行签名，非必要请不要修改这个字段 */
        signMethod: "HmacSHA256",
        httpProfile: {
            /* SDK默认使用POST方法。
             * 如果你一定要使用GET方法，可以在这里设置。GET方法无法处理一些较大的请求 */
            reqMethod: "POST",
            /* SDK有默认的超时时间，非必要请不要进行调整
             * 如有需要请在代码中查阅以获取最新的默认值 */
            reqTimeout: 30,
            /**
             * 指定接入地域域名，默认就近地域接入域名为 sms.tencentcloudapi.com ，也支持指定地域域名访问，例如广州地域的域名为 sms.ap-guangzhou.tencentcloudapi.com
             */
            endpoint: "sms.tencentcloudapi.com"
        },
    },
})
// 15136198901
/* 请求参数，根据调用的接口和实际情况，可以进一步设置请求参数
 * 属性可能是基本类型，也可能引用了另一个数据结构
 * 推荐使用IDE进行开发，可以方便的跳转查阅各个接口和数据结构的文档说明 */

// 生成 6 位数的随机数
function generateRandomNumber() {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendSms(smsCount,phone) {
    const params = {
        /* 短信应用ID: 短信SmsSdkAppId在 [短信控制台] 添加应用后生成的实际SmsSdkAppId，示例如1400006666 */
        SmsSdkAppId: "1400823474",
        /* 短信签名内容: 使用 UTF-8 编码，必须填写已审核通过的签名，签名信息可登录 [短信控制台] 查看 */
        SignName: "阿勇学前端公众号",
        /* 短信码号扩展号: 默认未开通，如需开通请联系 [sms helper] */
        ExtendCode: "",
        /* 国际/港澳台短信 senderid: 国内短信填空，默认未开通，如需开通请联系 [sms helper] */
        SenderId: "",
        /* 用户的 session 内容: 可以携带用户侧 ID 等上下文信息，server 会原样返回 */
        SessionContext: `验证码为：{}，您正在登录，若非本人操作，请勿泄露。`,
        /* 下发手机号码，采用 e.164 标准，+[国家或地区码][手机号]
         * 示例如：+8613711112222， 其中前面有一个+号 ，86为国家码，13711112222为手机号，最多不要超过200个手机号*/
        PhoneNumberSet: [`+86${phone}`],
        /* 模板 ID: 必须填写已审核通过的模板 ID。模板ID可登录 [短信控制台] 查看 */
        TemplateId: "1804261",
        /* 模板参数: 若无模板参数，则设置为空*/
        TemplateParamSet: [smsCount],
    }
    // 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
// client.SendSms(params, function (err, response) {
//     // 请求异常返回，打印异常信息
//     if (err) {
//         console.log(err)
//         return
//     }
//     // 请求正常返回，打印response对象
//     console.log(response)
// })
}

function getSmaCaptcha() {
    return {phone,smaCaptcha}
}

app.post('/sma-verify', (req, res) => {
    const {username, password} = req.body;
    smaCaptcha = generateRandomNumber()
    sendSms(smaCaptcha)

});


export default {router, getSmaCaptcha}

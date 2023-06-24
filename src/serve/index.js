import express from 'express'
import cors from "cors";
import bodyParser from "body-parser";
// 引入接口文件
import loginRouter from '../login/index.js'//登陆接口
import registerRouter from '../register/index.js'//注册接口
import ayongPay from "../ayong-pay/ayong-pay.js"; //支付接口
import rollout from "../rollout/rollout.js";//推出登陆接口
import problemFeedback from '../problem-feedback/problem-feedback.js'//问题反馈接口
import allUserInfo from "../all-user-info/all-user-info.js"; //所有人员信息查询
import memberInformation from "../member-Information/member-Information.js"; //所有人员信息查询
import chatGpt from "../chat-gpt/chat-gpt.js"; //chagpt接口
import alpayEnd from "../alpay-end/alpay-end.js"; //支付结束
import path from 'path';

const app = express();
const port = 8081;
/** 静态资源开放 **/
app.use('/images', express.static(path.join(process.cwd(), 'images')));

app.use(cors())//跨域需求 为了方便本地请求，如果部署线上 需要禁止他（地址不泄漏情况☺️可以不管）
app.use(bodyParser.json({limit: '10mb'}));//文件流长字符处理
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
// 添加中间件和配置项
app.use(express.json());

// 挂载接口路由
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/rollout', rollout);
app.use('/ayong-pay', ayongPay)
app.use('/all-user-info', allUserInfo)
app.use('/problem-feedback', problemFeedback)
app.use('/member-information', memberInformation)
app.use('/chat-gpt', chatGpt)
app.use('/alpay-end', alpayEnd)
import http from 'http';

// 请求数据
const data = JSON.stringify({
    username: '123132',
    password: '123'
});

// 请求参数http://13.51.250.185:8081/
const options = {
    hostname: '13.51.250.185',
    port: 8081,
    path: '/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

// // 发送请求
// const req = http.request(options, (res) => {
//     let response = '';
//
//     // 接收响应数据
//     res.on('data', (chunk) => {
//         response += chunk;
//     });
//
//     // 接收完整响应
//     res.on('end', () => {
//         console.log(111, response);
//     });
// });
// //
// // 发送请求数据
// req.write(data);
// req.on('error', error => {
//     console.log('error', error)
// });
// // 结束请求
// req.end();

// 启动服务
app.listen(port, () => {
    console.log('Server started on port' + port);
});

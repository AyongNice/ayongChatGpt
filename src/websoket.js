// app.ws('/websocket', function (ws) {
//     ws.on('message', async function (message) {
//
//         /** 二进制数据转换 string **/
//         const messageData = Buffer.from(message).toString();
//         /** 前端参数 string **/
//         const userMessageData = JSON.parse(messageData)
//         try {
//             const token = userMessageData.token
//             // const isTokenExpired = tokenInstance.isTokenExpired(token)
//             // if (isTokenExpired === 2) {
//             //     //刷新token
//             //     const newToken = tokenInstance.refreshUserToken(token)
//             //     const message = {
//             //         type: "token",
//             //         newToken
//             //     };
//             //     //返回刷新token
//             //     // ws.send(JSON.stringify(message));
//             //     ws.send(JSON.stringify(message));
//             // }
//             // ws.clone()
//             // if (!isTokenExpired) return
//         } catch (e) {
//             console.log(e)
//         }
//
//
//         // websoket 首次验证拦截 gpt转发
//         if (JSON.parse(messageData).validation) return
//         const postData = JSON.stringify({
//             "stream": true,
//             "model": "gpt-3.5-turbo",
//             "messages": [{
//                 "role": "user", "content": userMessageData.data
//             }], "temperature": 0.7 //此数据 代表这 模型答案匹配精确度  数字越高精度越高
//         });
//         // const req = https.request(options, (res) => {
//         //     res.on('data', (chunk) => {
//         //         const datachunk = Buffer.from(chunk).toString().replace("data:", "");
//         //         const streams = datachunk.trim()
//         //         if (streams !== '[DONE]') {
//         //             // JSON.parse(streams).choices[0].delta.content
//         //             try {
//         //                 console.log('datachunk---', JSON.parse(streams).choices[0].message.content);
//         //             } catch (e) {
//         //
//         //             }
//         //         }
//         //         // const newToken = tokenInstance.refreshUserToken(token)
//         //         console.log('datachunk', datachunk)
//         //         ws.send(datachunk);
//         //     });
//         // });
//         //
//         // req.on('error', (e) => {
//         //     console.error(e);
//         // });
//         //
//         // req.write(postData);
//         // req.end();
//
//
//     });
// });

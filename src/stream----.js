import express from 'express'
import cors from 'cors';
import fetch from 'node-fetch';
import HttpsProxyAgent from 'https-proxy-agent';
import bodyParser from 'body-parser';
import {WebSocketServer} from 'ws';
import https from 'https';
import fs from 'fs';
import OpenAI from 'openai-api';

import {spawn} from 'child_process';

const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');
const API_KEY = ''; // 替换为您的 OpenAI API 密钥
const openAIurl = "https://api.openai.com/v1/chat/completions"; //openAi 地址

const agent = new https.Agent({
    rejectUnauthorized: false, // 忽略证书认证错误
    proxy: {
        host: '127.0.0.1',
        port: 7890,
        protocol: 'http:',
    }
});
const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
    agent: proxyAgent
};

const prompt = 'Say this is a test';
const maxTokens = 7;
const modelEngine = 'text-davinci-003';

const openai = new OpenAI(API_KEY);

const params = {
    'model': modelEngine,
    'prompt': prompt,
    'max_tokens': maxTokens,
    'stream': true, // Set stream to true to enable streaming
    'stop': '\n',
};
console.log(openai)

// Call the API with the given parameters
// openai.completions.create(params)
//     .then(response => {
//         const choices = response.choices;
//         for (let i = 0; i < choices.length; i++) {
//             console.log(choices[i].text);
//         }
//     })
//     .catch(err => {
//         console.log(err);
//     });


const key = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2Ae1x1WAztoxe
aom2uhIa/rkLTZATmwnrWMXhXerDMvZgw9YL4QBNL09UtcibT2rLcW7xkzhLSuKx
Pwqa2aOgyV2zXM33qcdPZTztV1hF4glY5vBKMWguuGfBfqlyLUVuTqGHX0vhGltt
N8Pr3kqF4znS/cfkPuvRQe4YuQRMp3wcorFjJPKVpdHdF37/RtnTOycJMcp52A09
GuV59xPL3YD9k3PwiAH/PLfeoV44/3U8noyKm33VkRXpjD+rcWTEh3iaQugo4grw
0F+KO3U2Vu+Cutygwe1uKgK4ok92Nuz7KrWHWANWzdNUu9z+309ds4bzgrt5JMzh
1E0J1V9pAgMBAAECggEASgc+rK49EsuNDFoI6WmFM7WnThGeKFtHDZJt6dxpQDva
OkFtLie2F67GdY36qjEDHvxkQ529p+ItkioyBgm/pAZDNlDo9XL4vjJPNbnxDXuC
kcZctdCir14R1YHPKcGAG/2fdZAtLMGrriCgb69aYFqrikXup8dv4w0N6sBWH1bO
u/Ty9GYdL3VeND4mk2w9VPn+c8TkPty11QgmoURwT8rDFR2akGlbrQfURm2NEfrr
Qqibi+NiPQaxtiPP88JMK1VEHJKCgzD9t04uVlKW0cU3ZRgxHeKuWhimNuNm2Xdq
slYp/HWs361o/X2iRtpfBJJRBABH0RUQQ9CC9UmwgQKBgQD38N4D9M9sOk2FFEGj
StOC9rDb1OlZWwZ18VMsMZF/GMYyGsLZfe2l8e+wv7GQURDCB4goQC2+B+NZYSAr
SRlaWn6Ly/tTWElp1/ylyry5UEe1dKsqfFfYLpHiIqRG9q5+sh3D8kOGaECY5KL3
uBOrb1a6Wtgi+17fQG4zAyGwmwKBgQC77Gyj0G/JJWKeIf55gAZi1dzG7FZZHPcx
ZtgNtMaGrP3tKJIQ8JFUxL0wKkpG/ueoeW3+/BJWse8OAP5OjJRG027O0vrCZcSR
WAV1K/idboyGyWDsUlKb4wXWrd8D6xzT6mMHh95PPjQFeUDZjiBntLoEn0LqEowj
evnb5CkGSwKBgAfGRr/rAkILhfjBTNmY9A7sO1l5UKPbpdU27vu4xi4tEbHqguec
+kG012Y8bI3w7MyYvd09PfHyf1+DGyYgUaoyojsx9zyCzTKDckmklMxexxDaiq93
XK3LsAleOrZ677fLUAGf7Bwf0r64lJ+d5wf+IsMPLC3UogHwHER/OaQ3AoGAEobL
axb4fk8WOtrFGLtbZdEJs/7GwIBPimpGMIu66roRSpkuVUcyPLYspJv2uKsWsZBP
HM1DDZL7K1lDuQC4+YaMrQ01tYaM63tPBm8wUmz8o6kkygePp1ipUbHQg7VhIS9B
VhO6Afvy6vs6Pnh5j1/M2vnMggEUGcdc7KXAuaMCgYBMxN3cMIC7st7esgxbYUQg
dfKxBSQ+v1sKhcpYSg+0hhN12iEL6LxN+dMtiWnSDE7DTu3jYx/T+0hWQ/xd1RlG
YXcUfyWFS2nT8hYcQ3LG0LTPcjkZp5S3K3PLDGC0DGJ7eZQmN+VZtN6zsumIF0JB
UVogwriCPRT4Cbh2dxUiYw==
-----END PRIVATE KEY-----
`
const cert = `-----BEGIN CERTIFICATE-----
MIIDRTCCAi2gAwIBAgIURq93vienkrKaxbXXRqGzCoNJPkEwDQYJKoZIhvcNAQEL
BQAwMjELMAkGA1UEBhMCVVMxDzANBgNVBAoMBk9wZW5BSTESMBAGA1UEAwwJbG9j
YWxob3N0MB4XDTIzMDUwMzAyMTk0MVoXDTI0MDUwMjAyMTk0MVowMjELMAkGA1UE
BhMCVVMxDzANBgNVBAoMBk9wZW5BSTESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtgHtcdVgM7aMXmqJtroSGv65C02Q
E5sJ61jF4V3qwzL2YMPWC+EATS9PVLXIm09qy3Fu8ZM4S0risT8KmtmjoMlds1zN
96nHT2U87VdYReIJWObwSjFoLrhnwX6pci1Fbk6hh19L4RpbbTfD695KheM50v3H
5D7r0UHuGLkETKd8HKKxYyTylaXR3Rd+/0bZ0zsnCTHKedgNPRrlefcTy92A/ZNz
8IgB/zy33qFeOP91PJ6Mipt91ZEV6Yw/q3FkxId4mkLoKOIK8NBfijt1Nlbvgrrc
oMHtbioCuKJPdjbs+yq1h1gDVs3TVLvc/t9PXbOG84K7eSTM4dRNCdVfaQIDAQAB
o1MwUTAdBgNVHQ4EFgQUh7fuBray+obYV2Efi7x/MC6qzvMwHwYDVR0jBBgwFoAU
h7fuBray+obYV2Efi7x/MC6qzvMwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0B
AQsFAAOCAQEAko9OpgsmFeMCcQLFcNLdh+nIZymaRK+e3WDGszY51tO2s3Gu/zWt
xcGRTESoNEFM+u8Q8DDLQWbAgE6Olvcp/OfgtedOt7KGa6AJMmYT3gf5LbNFrHc4
l1huQWnNZ/Ea6Gwz8TAivXoQZgdQ8dSCl3NYX2hpZ6ORlUdofHmlidnj4pJB4XmY
GmfZBaySoJZmz4/lxXXi2g/x1ymooqiqABGjZLr8GiDGmzzOe0laKzWHL5+MeQEc
e8puwTw7LXl6Eg3ebZlD91cx4ODCpBuepMI2QKF2j0x9MlLRNRBdjuAjuUV1lHmt
6DtL0JTbA0M3ABFi+ciDns/UEXSy8iXL/A==
-----END CERTIFICATE-----
`
const server = https.createServer({
    key,
    cert
});

// server.listen(443);

const wsServer = new WebSocketServer({
    // httpServer: server,
    port: 8000
});

wsServer.on('connection', function (ws) {
    // const connection = request.accept(null, request.origin);
    ws.on('message', async function (message) {
        /** 二进制数据转换 string **/
        const messageData = Buffer.from(message).toString();
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                const chunkData = Buffer.from(message).toString();

                // console.log('chunkData---',chunkData);
                const datachunk = Buffer.from(chunk).toString();
                console.log('match', datachunk.match(/"content":"([^"]+)/g))
                const res = datachunk.match(/(?<="content":")[^"]+/g)
                if (res.length) {
                    ws.send(res[0]);
                } else {
                    ws.send(datachunk.match(/[^}]+(?=},)/g)[0]);
                }
                console.log('------' + '\n')
                console.log('datachunk------', datachunk + '/n')
                console.log('------' + '\n')
                // ws.send(datachunk.choices[0].message.content);
                // process.stdout.write(datachunk);
                data += chunk;
                // console.log('chunk--data-',data);

                // console.log('chunk---',chunk);

            });
            res.on('end', () => {
                // console.log('end---',data);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        const postData = JSON.stringify({
            "model": "gpt-3.5-turbo",
            "messages": [{
                "role": "user",
                "content": "帮我写个100字左右的诗歌"
            }],
            "temperature": 0.7
        });

        req.write(postData);
        req.end();

        // const response = await fetch(openAIurl, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${API_KEY}`,
        //     },
        //     body:  JSON.stringify(data),
        //     agent: proxyAgent // 设置代理
        // });
        // const result = await response.json();
        // console.log('result',result)
        // if (message.type === 'utf8') {
        //     const gpt = spawn('python', ['./gpt.py', messageData]);
        //     let dataToSend = '';
        //     console.log(message)
        //     gpt.stdout.on('data', (data) => {
        //         dataToSend += data.toString();
        //     });
        //     gpt.stderr.on('data', (data) => {
        //         console.error(`stderr: ${data}`);
        //     });
        //     gpt.on('close', (code) => {
        //         console.log(`child process exited with code ${code}`);
        //         ws.send(13123);
        //     });
        // }
    });
});

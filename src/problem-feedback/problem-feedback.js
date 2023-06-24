/**
 * 问题反馈接口 2023/6/18 1:05
 */
import express from 'express'
import mysqlDB from '../my-sql-db/index.js'
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';

const router = express.Router();
import tokens from "../token/index.js";
import utils from "../utils/utils.js";

const tokenInstance = tokens.getInterest()
router.use(cookieParser());

import multer from 'multer'; // 用于处理文件上传
// 定义存储文件的目录和文件名生成函数
const storage = multer.diskStorage({
    destination: './images', // 指定上传文件的目录
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});
const upload = multer({storage});

/** 问题反馈 表单 **/
router.post('/upload', upload.single('image'), (req, res) => {
    // 获取前端传递的其他信息
    const {description, contact} = JSON.parse(req.body.data);
    const cookieHeader = req.headers.cookie;
    const cookies = {};
    if (cookieHeader) {
        const cookieArr = cookieHeader.split(';');
        for (const cookie of cookieArr) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
        }
    }
    // 打印 Cookie 值
    console.log('req.file', req.file)
    const token = cookies.token;
    const username = cookies.user;
    const isTokenExpired = tokenInstance.isTokenExpired(token, username)
    if (isTokenExpired === 3) return res.status(401).json({
        message: '!尊敬的VIP贵宾，您的账号在别的地方登陆，请勿将账号密码泄露他人，您需要点击左下角退出重新登陆',
        code: 0
    });
    if (!isTokenExpired) return res.status(401).json({
        message: '!尊敬的VIP贵宾，登陆过期,您需要点击左下角退出重新登陆',
        code: 0
    });
    // 文件上传成功
    let filename = ''
    if (req.file) {
        // 构建文件路径
        filename =  req.file.path;
    }
    mysqlDB.addFeedback({
        username,
        description,
        contact,
        filename: filename || '123456',
        registration_date: utils.getDATETIME(),
        succeed: () => {
            let newToken = ''
            if (isTokenExpired === 2) newToken = tokenInstance.refreshUserToken(token)
            res.status(200).json({message: 'File upload succeed', data: {}, newToken, code: 1});
        },
        fail: (err) => {
            res.status(400).json({message: err, data: {}, code: 0});
        }
    })
});

/** 删除图片 **/
function deleteFilesInFolder(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Failed to read folder:', err);
            return;
        }
        files.forEach((file) => {
            const filePath = `${folderPath}/${file}`;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete file:', filePath, err);
                }
            });
        });

    });
}

/**
 * 删除反馈信息表数据
 */
router.post('/delet', (req, res) => {
    const {password} = req.body;
    if (password !== 'ayong7758521') return res.status(400).json({message: '你不是阿勇，勿扰', data: {}, code: 0});
    mysqlDB.delFeedback(() => {
        res.status(200).json({message: 'delet upload succeed', data: {}, code: 1});
    }, (err) => {
        res.status(400).json({message: err, data: {}, code: 0});
    })
    /** 删除图片 **/
    deleteFilesInFolder(path.join(process.cwd(), 'images'));

})
/**
 * 查询反馈信息表数据
 */
router.post('/query', (req, res) => {
    const {password} = req.body;
    if (password !== 'ayong7758521') return res.status(400).json({message: '你不是阿勇，勿扰', data: {}, code: 0});
    mysqlDB.queryFeedback((data) => {
        res.status(200).json({message: 'query succeed', data, code: 1});
    }, (err) => {
        res.status(400).json({message: err, data: {}, code: 0});

    })
})
export default router

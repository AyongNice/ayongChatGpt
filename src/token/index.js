class Token {
    tokenMap = {}; //token内存对象
    time = new Date() //时间对象
    tokenShelfLife = 2 //token过期时间 1小时
    static token; //单例

    static getInterest() {
        if (!this.token) {
            this.token = new Token()
        }
        return this.token
    }

    /**
     *  获取token
     * @param userId  用户ID
     * @param oldToken 旧token
     * @param isFirst 是否首次获取
     * @returns {string}
     */
    generateToken(userId, oldToken, isFirst) {
        // 生成随机的 token 字符串
        const token = this.generateRandomToken();

        console.log('generateToken----验证', this.tokenMap[userId])

        /** 存在之前删除token **/
        if (this.tokenMap[userId]) {
            // /** 登陆获取token，存在删除 **/
            // if (isFirst) return '0'
            delete this.tokenMap[userId]
            console.log('存在之前删除token', this.tokenMap)

        }
        // 将 token 与用户ID关联，保存到内存中
        this.tokenMap[userId] = {
            userId: userId, token: token, expiry: this.calculateExpiry(this.time.getTime()), // 计算 token 的过期时间
        }
        console.log('generateToken', this.tokenMap)

        return token;
    }


    refreshUserToken(userId) {// 刷新用户的 token
        // 检查 token 是否存在于内存中
        if (this.tokenMap.hasOwnProperty(userId)) {
            return this.generateToken(this.tokenMap[userId].userId, token)
        }
    }

    /**
     *  验证token是否过期
     *  0 过期  1 不过期 2 1小时后获取
     * @param token
     * @param userId
     * @returns {number|number}
     */
    isTokenExpired(token, userId) {
        console.log('isTokenExpired', this.tokenMap)
        if (!this.tokenMap.hasOwnProperty(userId)) return 0; // 如果 token 不存在，则视为过期
        if (userId && this.tokenMap[userId].token !== token) return 3;// 如果 token !== userId，则视为过期
        const expiry = this.tokenMap[userId].expiry;//过期时间
        const currentTime = this.time.getTime();//当前时间
        const shelfLifeRemaining = 3600000 //token保质期剩余1个小时
        if (currentTime < expiry) {
            return currentTime + shelfLifeRemaining < expiry ? 1 : 2
        } else {
            return 0
        }

    }

    // 生成随机的 token 字符串
    generateRandomToken() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';

        for (let i = 0; i < characters.length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            token += characters[randomIndex];
        }

        return token;
    }


    calculateExpiry(countTime) {// 计算 token 的过期时间
        // 返回计算后的过期时间
        const oneDayInMilliseconds = this.tokenShelfLife * 60 * 60 * 1000; // 一天的时间间隔
        return countTime + oneDayInMilliseconds;
    }

    /**
     *  删除token
     *  0 过期  1 不过期 2 1小时后获取
     * @param token
     * @param userId
     * @returns {boolean}
     */
    deleteToken(token, userId) {
        console.log(token, userId)
        /** 存在之前删除token **/
        if (token && userId && this.tokenMap[userId] && this.tokenMap[userId].userId === userId) {
            delete this.tokenMap[userId]
            console.log('deleteToken', this.tokenMap)
            return true
        } else {
            return false
        }
    }


}

export default Token

class Token {
    tokenMap = {}; //token内存对象
    time = new Date() //时间对象
    tokenShelfLife = 12 //token过期时间 12小时
    static token; //单例

    static getInterest() {
        if (!this.token) {
            this.token = new Token()
        }
        return this.token
    }

    generateToken(userId) {
        // 生成随机的 token 字符串
        const token = this.generateRandomToken();

        /** 存在之前删除token **/
        if (this.tokenMap[token]) {
            delete this.tokenMap[token]
        }
        // 将 token 与用户ID关联，保存到内存中
        this.tokenMap[token] = {
            userId: userId,
            token: token,
            expiry: this.calculateExpiry(this.time.getTime()), // 计算 token 的过期时间
        }
        return token;
    }


    refreshUserToken(token) {// 刷新用户的 token
        // 检查 token 是否存在于内存中
        if (this.tokenMap.hasOwnProperty(token)) {
            return this.generateToken(this.tokenMap[token].userId)
        }
    }


    isTokenExpired(token) {// 检查用户的 token 是否过期 0 过期  1 不过期 2 1小时后获取
        if (this.tokenMap.hasOwnProperty(token)) {
            const expiry = this.tokenMap[token].expiry;//过期时间
            const currentTime = this.time.getTime();
            const shelfLifeRemaining = 79200000 //token保质期剩余1个小时

            if (currentTime < expiry) {
                return currentTime + shelfLifeRemaining < expiry ? 1 : 2
            } else {
                return 0
            }
        }
        return 0; // 如果 token 不存在，则视为过期
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

}

export default Token

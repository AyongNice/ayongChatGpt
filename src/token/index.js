class Token {
    tokenMap = {}; //token内存对象
    time = new Date() //时间对象
    tokenShelfLife = 5 //token过期时间 1小时
    static token; //单例
    ordersPojo = {}

    static getInterest() {
        if (!this.token) {
            this.token = new Token()
        }
        return this.token
    }

    /**
     *  获取token
     * @param userId  用户ID
     * @param level  会员等级
     * @param amount  会员余额
     * @param apiCalls  {number} APi调用次数
     * @param count  {number} 免费给调用次数
     * @returns {string}
     */
    generateToken(userId, level = 0, amount = 0, apiCalls = 0, count = 50) {
        // 生成随机的 token 字符串
        const token = this.generateRandomToken();
        /** 存在之前删除token **/
        if (this.tokenMap[userId]) {
            // /** 登陆获取token，存在删除 **/
            // if (isFirst) return '0'
            delete this.tokenMap[userId]
        }
        // 将 token 与用户ID关联，保存到内存中
        this.tokenMap[userId] = {
            userId, token, level, amount, apiCalls, count, expiry: this.calculateExpiry(this.time.getTime()), // 计算 token 的过期时间
        }
        return token;
    }


    refreshUserToken(userId) {// 刷新用户的 token
        // 检查 token 是否存在于内存中
        return this.tokenMap.hasOwnProperty(userId)
    }

    /**
     *  验证token是否过期
     *  0 过期  1 不过期 2 1小时后获取
     * @param token
     * @param userId
     * @returns {number|number}
     */
    isTokenExpired(token, userId) {
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
     * @param userId 用户名
     * @returns {boolean}
     */
    deleteToken(token, userId) {
        /** 存在之前删除token **/
        if (token && userId && this.tokenMap[userId] && this.tokenMap[userId].userId === userId.toString()) {
            delete this.tokenMap[userId]
            return true
        } else {
            return false
        }
    }

    /** 查询会员内存信息 **/
    getMemberInfo(userId) {
        return this.tokenMap[userId]
    }

    /**
     * 设置会员内存信息
     * @param userId{string}
     * @param amount {number}
     * @param level {number}
     * @param apiCalls{number}
     */
    setMemberInfo({userId, amount, level, apiCalls}) {
        // console.log('setMemberInfo', userId, amount, level)
        if (!this.tokenMap[userId]) return
        this.tokenMap[userId].amount = amount
        this.tokenMap[userId].level = level
        this.tokenMap[userId].apiCalls += apiCalls;
        // console.log(this.tokenMap[userId])

    }

    /**
     * API 调用次数 扣除-1
     * @param userId
     * @param amount
     * @param level
     * @param apiCalls {number} 会员API
     * @param count {number} 免费API
     */
    deductApiCalls({userId, amount, level, apiCalls, count}) {
        if (!this.tokenMap[userId]) return;

        if (!Number(this.tokenMap[userId].count) && !Number(this.tokenMap[userId].apiCalls)) return;

        if (Number(this.tokenMap[userId].count)) {//优先扣除免费额度
            if (!Number(this.tokenMap[userId].count)) return;
            this.tokenMap[userId].count -= 1
        } else {//扣除会员额度
            if (!Number(this.tokenMap[userId].apiCalls)) return;
            this.tokenMap[userId].apiCalls -= 1
        }

        // console.log('deductApiCalls', this.tokenMap[userId])

    }

    /**
     * 存储用户订单map
     * @param orders {string}订单
     * @param userId {string} 用户名
     */
    addOrdersPojo(orders, userId) {
        this.ordersPojo[orders] = {
            orders,
            userId
        }
    }

    /**删除用户订单map **/
    delectOrdersPojo(orders) {
        delete this.ordersPojo[orders]
    }

    getOrdersPojoUseid(orders) {
        // console.log('this.ordersPojo', this.ordersPojo)
        return this.ordersPojo[orders] ? this.ordersPojo[orders].userId : false
    }
}

export default Token

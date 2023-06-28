import mysql from 'mysql2';
import utils from "../utils/utils.js";
import tokens from "../token/index.js";

const tokenInstance = tokens.getInterest()
const UNITPRICE = 100; //一元100次
const MEMBERPRICE = 3; //每月3元
const fails = () => {
}
const succeeds = () => {
}
// 创建数据库连接池docker build -t
const pool = mysql.createPool({
    host: 'localhost', user: 'root', password: '1234',
    database: 'ayongnicejiayou',
    // database: 'mydatabase',
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
});


//检查表是否存在
function checkMembershipTableExists(callback, tableName) {
    const checkTableQuery = "SHOW TABLES LIKE ?";
    const values = [tableName];
    pool.query(checkTableQuery, values, (error, results) => {
        if (error) {
            return console.error('Failed to check membership table:', error);
        }
        const tableExists = results.length > 0;
        if (!tableExists) callback(null, tableExists);
    });
}

// 创建用户主表
function createTable(callback) {
    const createTableQuery = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,  
      password VARCHAR(255) NOT NULL,
      INDEX idx_username (username),
      INDEX idx_phone (phone),
       count INT DEFAULT 50,
        phone VARCHAR(20),
       balance DECIMAL(10, 2) DEFAULT 0,
        INDEX idx_id (id)
    )
  `;
    pool.query(createTableQuery, (error) => {
        if (error) {
            console.error('Failed to create table:', error);
            return callback(error);
        }
        console.log('Table created successfully');
        callback(null);
    });
}

/**
 * 问题返反馈表
 * @param callback
 */
function createFeedbackTable(callback = () => {
}) {
    const createTableQuery = `
   CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    contact VARCHAR(255) NOT NULL,
    filename VARCHAR(255),
     registration_date DATETIME NOT NULL)`;
    pool.query(createTableQuery, (error) => {
        if (error) {
            console.log('Failed to create table:', error);
            return callback(error);
        }
        console.log('Table created successfully');
        callback(null);
    });
}

function addFeedback({
                         username, description, contact, filename, registration_date, succeed = succeeds, fail = fails
                     }) {

    // 创建新用户
    pool.query(`INSERT INTO feedback (username, description,contact,filename,registration_date) VALUES (?, ?,?,?,?)`, [username, description, contact, filename, registration_date], (err) => {
        if (err) {
            console.error('Failed to register user:', err);
            fail(err)
        } else {
            succeed('反馈成功')
        }
    });
}

/**
 * 清除问题表
 */
function delFeedback(succeeds, fails) {
    pool.query(`TRUNCATE TABLE feedback;`, (error, res) => {
        if (error) {
            console.error('Failed to create table:', error);
            fails(err)
            return
        }
        succeeds()
        console.log('清除问题反馈记录', res);
    });
}

/**
 * 查询问题表 SHOW COLUMNS FROM users WHERE Field IN ('username', 'phone');
 * SHOW COLUMNS FROM feedback WHERE Field IN('username', 'description','contact','filename');
 * SELECT username, description, contact, filename FROM feedback;
 */

function queryFeedback(succeeds, fails) {
    pool.query(`SELECT username, description, contact, filename FROM feedback;`, (error, res) => {
        if (error) {
            console.error('Failed to create table:', error);
            return fails(err)
        }
        succeeds(res)
    });
}

// 3. 创建会员表并关联主表
const createMembershipTable = (callback = () => {
}) => {
    const sqlCreate = `
    CREATE TABLE membership (
    id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  INDEX idx_user_id (user_id),
  registration_date DATETIME NOT NULL,
  expiration_date DATETIME NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cumulativeAmount DECIMAL(10, 2) NOT NULL,
  level INT NOT NULL,
  apiCalls INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;
    pool.query(sqlCreate, (error) => {
        if (error) {
            console.error('Failed to create table:', error);
            return callback(error);
        }
        console.log('Table created successfully');
        callback(null);
    });

};
// 2. 创建主表的外键约束
const addForeignKeyConstraint = (callback = () => {
}) => {
    const addConstraintQuery = "ALTER TABLE membership ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)";

    pool.query(addConstraintQuery, (error) => {
        if (error) {
            console.error('Failed to add foreign key constraint:', error);
            return callback(error);
        }

        callback(null);
    });
}

/**
 * 会员表校验/创建+ 创建主表的外键约束
 */
function membershipTableOperations() {
    checkMembershipTableExists((err, tableExists) => {
        createMembershipTable(() => {
            // addForeignKeyConstraint()
        })
    }, 'membership')
}

// 连接数据库并执行逻辑
pool.getConnection((error, connection) => {
    if (error) {
        console.error('Failed to get database connection:', error);
        return;
    }
    console.log('Connected to database');
    /**
     *  创建用主户表
     */
    checkMembershipTableExists((error, tableExists) => {
        if (error) {
            connection.release();
            return;
        }
        if (tableExists) {
            console.log('Table already exists');
            connection.release();
            // 会员表操作
            membershipTableOperations()
        } else {
            createTable((error) => {
                if (error) return connection.release();
                membershipTableOperations()
            });
        }

    }, 'users');
    /**
     *  创建问题反馈
     */
    checkMembershipTableExists(() => {
        createFeedbackTable((err) => {
            console.log('创建问题反馈表----err', err)
        })

    }, 'feedback')

});

// 修改注册用户账号接口的逻辑，将用户信息保存到数据库：
function addUser({
                     username, phone = null, password, succeed = succeeds, fail = fails
                 }) {

    // 检查用户名是否已存在
    //SELECT * FROM users WHERE username = ?
    //SELECT COUNT(*) AS count FROM users WHERE (username = ? OR phone = ?)
    pool.query('SELECT COUNT(*) AS count FROM users WHERE (username = ? OR phone = ?)', [username, phone], (err, results) => {
        if (err) {
            console.log('Failed to check username:', err);
        }
        console.log('Username already phone:', phone);

        console.log('Username already exists:', results);
        if (results[0].count > 0) {
            console.log('用户名已存在,请直接登陆')
            return fail('用户名已存在,请直接登陆');
        }
        // // 创建新用户
        pool.query(`INSERT INTO users (username, password,phone) VALUES (?, ?,?)`, [username, password, phone], (err) => {
            if (err) {
                console.error('Failed to register user:', err);
            } else {
                succeed('注册成功')
            }
        });
    });
}

function login({username, password, succeed = succeeds, fail = fails}) {
    // 根据用户名查询用户
    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return fail(err);

        if (!results.length) {
            return fail('用户不存在,请注册');
        }
        // 验证密码
        if (results[0].password !== password) {
            return fail('密码不对');
        }
        console.log('results----用户信息', results[0])
        queryInformation({
            user_id: results[0].id, succeed: (member) => {
                console.log('member', member)
                let memberIfon = {
                    count: results[0].count//免费次数API
                }
                if (member[0] && JSON.stringify(member[0]) !== '{}') {
                    delete member[0].user_id //删除会员表主键字段
                    member[0].expiration_date = utils.formatDateTime(member[0].expiration_date)
                    memberIfon = member[0];//会员信息
                    memberIfon.count = results[0].count;//免费余额
                    if (!member[0].level) return succeed(memberIfon);//等级0 停止操作
                    const currentDate = new Date();
                    const targetDate = new Date(member[0].expiration_date);

                    /** 会员到期每月扣费 **/
                    if (targetDate < currentDate) {
                        return chargebacks({
                            amount: MEMBERPRICE, userId: results[0].id, succeed: () => {
                                succeed(memberIfon)
                            }
                        })
                    }
                }
                succeed(memberIfon)
            }, fail: (err) => {
                succeed({count: results[0].count})
            },
        })

    });
}

/**
 *  验证码查询手机不重复 一个手机好只能注册一个账号
 * @param phone
 * @param succeed
 * @param fail
 */
function smaVerify({phone, succeed = succeeds, fail = fails}) {
    pool.query('SELECT * FROM users WHERE phone = ?', [phone], (err, results) => {
        if (err) return fail(err);
        return results.length ? fail('手机号已注册,请更换手机号') : succeed('login')
    });
}

/**
 * 查询会员信息
 */
function queryInformation({
                              user_id, succeed = succeeds, fail = fails
                          }) {
    pool.query('SELECT * FROM membership WHERE user_id = ?', [user_id], (err, results) => {
        if (err) return fail(err);
        succeed(results)
    });
}

function getUserId({
                       username, succeed = succeeds, fail = fails
                   }) {
    const getUserIDQuery = "SELECT id FROM users WHERE username = ?";
    return new Promise((resolve, reject) => {
        pool.query(getUserIDQuery, [username], (error, results) => {
            if (error) {
                console.error('Failed to get user ID:', error);
                return reject(error);
            }
            console.log('getUserId--results', results)
            resolve(results[0].id)
        })
    })

}

/**
 * 会员信息存储/金额添加
 */
async function insertMembershipInfo({
                                        username,
                                        registrationDate,
                                        expirationDate,
                                        amount,
                                        succeed = succeeds,
                                        fail = fails
                                    }) {


    let userId = ''
    try {
        userId = await getUserId({username})
    } catch (error) {
        console.log('error---getUserId', error)
        return fails(error);
    }
    console.log('userId----', userId)
    const getMembershipQuery = "SELECT * FROM membership WHERE user_id = ?";
    pool.query(getMembershipQuery, [userId], (error, results) => {
        if (error) {
            console.error('Failed to insert membership info:', error);
            return fails(error);
        }
        console.log('查询会员信息', results)
        console.log('查询会员信息长度', results.length, typeof results.length)
// 计算 apiCalls 的值
        const apiCalls = amount * UNITPRICE; //API 调用余额次数
        if (results.length !== 0) { //更新会员
            const insertMembershipQuery = "UPDATE membership SET amount = amount + ?,level = ?,apiCalls=?, cumulativeAmount = cumulativeAmount + ? WHERE user_id = ?"
            const upLevel = Math.floor(results[0].cumulativeAmount / 5) || 1//level 5块钱张一级别 不到一级强制1级
            pool.query(insertMembershipQuery, [amount, upLevel, apiCalls, amount, userId], (error, updataResults) => {
                if (error) {
                    console.log('更新会员 membership info:', error);
                    return fails(error);
                }

                const info = {
                    userId: username,
                    level: upLevel,
                    amount: (Number(results[0].amount) * 100 + Number(amount) * 100) / 100
                }
                tokenInstance.setMemberInfo(info)
                succeed(info);
            });
        } else {// 新增会员
            const upLevel = Math.floor(amount / 5) || 1//level 5块钱张一级别 不到一级强制1级
            const insertMembershipQuery = "INSERT INTO membership (user_id, registration_date, expiration_date, amount, level,cumulativeAmount,apiCalls) VALUES (?, ?, ?, ?, ?,?,?)";
            pool.query(insertMembershipQuery, [userId, registrationDate, expirationDate, amount, upLevel, amount, apiCalls], (error, creqacResults) => {
                if (error) {
                    console.log('新增会员:', error);
                    return fails(error);
                }

                console.log('新增会员前信息---', creqacResults)
                const info = {userId: username, level: upLevel, amount}
                tokenInstance.setMemberInfo(info)
                succeed(info);
            });
        }
    });
}

/**
 * 更新会员APi使用次数
 * @param succeed {Function} 成功
 * @param fail{Function} 失败
 * @return void
 */
async function updataMemberApiCalls(apiCalls, username, succeed = succeeds, fail = fails) {
    let userId = ''
    try {
        userId = await getUserId({username})
    } catch (error) {
        console.log('error---getUserId', error)
        return fail(error);
    }
    const insertMembershipQuery = "UPDATE membership SET apiCalls=? WHERE user_id = ?";
    pool.query(insertMembershipQuery, [apiCalls, userId], (error, creqacResults) => {
        if (error) {
            console.log('更新会员API使用次数:', error);
            return fail(error);
        }
        succeed();
    });
}

/**
 * 会员扣费
 */
function chargebacks({
                         userId, amount, succeed = succeeds, fail = fails
                     }) {

    const getMembershipQuery = "SELECT * FROM membership WHERE user_id = ?";
    pool.query(getMembershipQuery, [userId], (error, results) => {
        if (error) {
            console.error('Failed to insert membership info:', error);
            return fails(error);
        }
        if (!Number(results[0].level)) return //等级0 停止操作
        let level = results[0].level
        if (results[0].amount > amount) {
            level = Math.ceil((results[0].amount - amount) / 5); //只要有钱就给1级别
        } else {
            level = 0
            amount = results[0].amount; //余额小于扣除额度 直接扣完
        }
        const insertMembershipQuery = "UPDATE membership amount = amount - ?,level = ?, WHERE user_id = ?"
        pool.query(insertMembershipQuery, [amount, level, userId], (error, results) => {
            if (error) {
                console.error('Failed to insert membership info:', error);
                return fails(error);
            }
            succeeds(results);
        });

    });

}


/**  查询所以信息 **/
function allUserInfo(succeed, fail) {
    const list = []
    const sueraSql = `SHOW COLUMNS FROM users WHERE Field IN ('username', 'phone');`
    pool.query(sueraSql, (err, results) => {
        if (err) return fail(err);
        list.push(results)
        const membershipSql = `SHOW COLUMNS FROM membership WHERE Field IN ('user_id', 'amount','level');`
        pool.query(membershipSql, (membererr, memberesults) => {
            if (membererr) return fail(membererr);
            list.push(memberesults)
            succeed(list)
        });
    });

}

/**
 * 查询会员信息
 */
async function inquireAboutMember(username, succeed) {
    let user_id = ''
    try {
        user_id = await getUserId({username})
    } catch (error) {
        console.log('error---getUserId', error)
        return fails(error);
    }
    queryInformation({
        user_id, succeed: (member) => {
            console.log('member', member)
            let memberIfon = {}
            if (member[0] && JSON.stringify(member[0]) !== '{}') {
                delete member[0].user_id //删除会员表主键字段
                member[0].expiration_date = utils.formatDateTime(member[0].expiration_date)
                memberIfon = member[0]
                if (!member[0].level) return succeed(memberIfon);//等级0 停止操作
                const currentDate = new Date();
                const targetDate = new Date(member[0].expiration_date);
                if (targetDate < currentDate) {
                    return chargebacks({
                        amount: 5.00, username: results[0].id, succeed: () => {
                            succeed(memberIfon)
                        }
                    })
                }
            }
            succeed(memberIfon)
        }, fail: (err) => {
            succeed({err})
        },
    })

}

/**
 * 更新主表免费接口次数
 */
function updatAgratisCount(count, username, succeed = succeeds) {
    const insertMembershipQuery = "UPDATE users SET count=? WHERE username = ?";
    if (typeof count !== 'number' || Number(count) < 0) count = 0
    pool.query(insertMembershipQuery, [count, username], (error, creqacResults) => {
        if (error) {
            console.log('更新会员API使用次数:', error);
            return succeed(error);
        }
        console.log('更新会员API使用次数--ok:', error);
        succeed();
    });
}

/**
 * 修改密码
 * @param count
 * @param username
 * @param succeed
 */
function revisePassword({username, password, succeed = succeeds, fail = fails}) {
    const insertMembershipQuery = "SELECT * FROM membership WHERE user_id = ?";
    pool.query(insertMembershipQuery, [username], (error, results) => {
        if (error) {
            console.log('修改密码:', error);
            return fail(error);
        }
        if (!results.length) {
            return fail('用户不存在,仔细检查下账号');
        }
        const UPDATEPassword = "UPDATE users SET password=? WHERE username = ?";
        pool.query(UPDATEPassword, [password,username], (error, results) => {
            if (error) {
                console.log('修改密码:', error);
                return fail(error);
            }
            succeed();
        });

    });
}

export default {
    login,
    addUser,
    smaVerify,
    addFeedback,
    delFeedback,
    queryFeedback,
    queryInformation,
    getUserId,
    insertMembershipInfo,
    chargebacks,
    allUserInfo,
    updataMemberApiCalls,
    updatAgratisCount,
    revisePassword
}

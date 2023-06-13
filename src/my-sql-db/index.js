import mysql from 'mysql2';

const fails = () => {
}
const succeeds = () => {
}
// 创建数据库连接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'mydatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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

// 3. 创建会员表并关联主表
const createMembershipTable = (callback = () => {
}) => {
    const sqlCreate = `
    CREATE TABLE membership (
    id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  registration_date DATETIME NOT NULL,
  expiration_date DATETIME NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  level INT NOT NULL,
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
            addForeignKeyConstraint()
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
    const sqlCreate = "SELECT * FROM users;"

    pool.query(sqlCreate, (error,res) => {
        if (error) {
            console.error('Failed to create table:', error);
            return
        }
        console.log('Table created successfully',res);
    });
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


});

// 修改注册用户账号接口的逻辑，将用户信息保存到数据库：
function addUser({
                     username,
                     phone = null,
                     password,
                     succeed = succeeds,
                     fail = fails
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
                console.error('注册成功');
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
        succeed('login')
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
 * 会员信息存储
 */
function addNewMembers() {

}

setTimeout(() => {
    // login({username: 'ayong1',password:'1234'})
    // const sql = "DROP TABLE users";
    // pool.query(sql, (error, results) => {
    //     if (error) {
    //         console.error('Failed to drop table:', error);
    //         return;
    //     }
    //     console.log('Table dropped successfully.');
    // });
}, 500)
console.log('db---')
export default {
    login, addUser, smaVerify
}

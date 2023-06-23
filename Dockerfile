FROM node:16.20.0

RUN sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装MySQL客户端
FROM mysql:8.0.33
RUN sudo yum install -y apt-get

#COPY ./v16.20.0 /usr/local/bin/
## 设置 PATH 环境变量，将可执行文件所在路径添加到 PATH 中
#ENV PATH="/usr/local/bin:${PATH}"
#RUN node -v

# 设置工作目录
WORKDIR /app

# 复制后端接口代码到容器中
COPY . /app


# 设置环境变量
ENV NODE_ENV=production \
    DB_HOST=localhost \
    DB_USER=root \
    DB_PASSWORD=1234 \
    DB_DATABASE=mydatabase

# 将初始化脚本复制到容器中
COPY init.sql /docker-entrypoint-initdb.d/

# 更改脚本权限
RUN chmod 755 /docker-entrypoint-initdb.d/init.sql

# 启动MySQL服务
CMD ["mysqld", "--daemonize"]

# 启动后端接口服务
CMD ["npm", "start"]

安装依赖

```
npm install
```

启动服务
```
node ./lib/index.js \
--db.host 172.21.0.61 \
--db.database ios-dev \
--db.username root \
--db.password 123456 \
--redis.host 172.21.0.61 \
--redis.password %20#m5yW7
```

测试页面
```
http://127.0.0.1:8888/client.html
```


```sh
# 链接查询接口
GET http://127.0.0.1:8888/api/connections

# 收集接口
POST http://127.0.0.1:8888/api/connections/{idOrkey}/collect

{
    "save":true
}

# 查看接口
GET http://127.0.0.1:8888/api/collects/{id}/summary

```




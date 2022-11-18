<h1 align="center">vue3-ts-webim</h1>
## ✈️ 简介

<p>vue3-ts-webim是一个简易的局域网聊天室，基于vue3.2和typescript实现。通过websocket实现实时通信。</p>

## 🚣 技术栈

`vue3.2 + typescript + node.js + websocket`

## 🏝️ 功能

```
- 一对一聊天
- 群聊
- 消息未读提示
```
## 🛎️ 注意点


* 需要将websocket实例的ip地址改成局域网地址：`const socket = new WebSocket('ws://局域网ip地址:8001')`
* 配置vue.config.js:
`devServer: {
    historyApiFallback: true,
    allowedHosts: 'all',
  }
`
* 如果还是无法用其他设备访问到，可以看一下自己电脑上是不是开了防火墙
![图片alt](/src/assets/images/防火墙.png "图片title")

## 👟 运行

```bash
# 克隆项目
git clone https://github.com/SEEMORELEARNMORE/vue3-ts-webim.git

# 进入项目目录
cd vue3-ts-webim

# 安装依赖
npm install

# 启动后端
node server/index.js

# 启动前端
npm run serve
```

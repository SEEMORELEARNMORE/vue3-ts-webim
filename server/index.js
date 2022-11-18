var ws = require('nodejs-websocket')
var moment = require('moment')

console.log('开始建立连接...')

let users = []
let conns = {}
let groups = []

function boardcast(obj) {
  if (obj.bridge && obj.bridge.length) {
    obj.bridge.forEach(item => {
      conns[item].sendText(JSON.stringify(obj))
    })
    return
  }
  if (obj.groupId) {
    group = groups.filter(item => {
      return item.id === obj.groupId
    })[0]
    group.users.forEach(item => {
      conns[item.uid].sendText(JSON.stringify(obj))
    })
    return
  }

  server.connections.forEach((conn, index) => {
    conn.sendText(JSON.stringify(obj))
  })
}

var server = ws
  .createServer(function(conn) {
    conn.on('text', function(obj) {
      obj = JSON.parse(obj)
      conns['' + obj.uid + ''] = conn
      switch (obj.type) {
        // 创建连接
        case 1:
          let isuser = users.some(item => {
            return item.uid === obj.uid
          })
          if (!isuser) {
            users.push({
              nickname: obj.nickname,
              uid: obj.uid,
              status: 1
            })
          } else {
            users.map((item, index) => {
              if (item.uid === obj.uid) {
                item.status = 1
              }
              return item
            })
          }
          boardcast({
            type: 1,
            date: moment().format('YYYY-MM-DD HH:mm:ss'),
            msg: obj.nickname + '加入聊天室',
            users: users,
            groups: groups,
            uid: obj.uid,
            nickname: obj.nickname,
            bridge: obj.bridge
          })
          break
        // 注销
        case 2:
          // delete conns[''+obj.uid+''];
          users.map((item, index) => {
            if (item.uid === obj.uid) {
              item.status = 0
            }
            return item
          })
          boardcast({
            type: 1,
            date: moment().format('YYYY-MM-DD HH:mm:ss'),
            msg: obj.nickname + '退出了聊天室',
            users: users,
            groups: groups,
            uid: obj.uid,
            nickname: obj.nickname,
            bridge: []
          })
          break
        // 创建群
        case 10:
          groups.push({
            id: moment().valueOf(),
            name: obj.groupName,
            users: [
              {
                uid: obj.uid,
                nickname: obj.nickname
              }
            ]
          })
          boardcast({
            type: 1,
            date: moment().format('YYYY-MM-DD HH:mm:ss'),
            msg: obj.nickname + '创建了群' + obj.groupName,
            users: users,
            groups: groups,
            uid: obj.uid,
            nickname: obj.nickname,
            bridge: obj.bridge
          })
          break
        // 加入群
        case 20:
          let group = groups.filter(item => {
            return item.id === obj.groupId
          })[0]
          group.users.push({
            uid: obj.uid,
            nickname: obj.nickname
          })
          boardcast({
            type: 1,
            date: moment().format('YYYY-MM-DD HH:mm:ss'),
            msg: obj.nickname + '加入了群' + obj.groupName,
            users: users,
            groups: groups,
            uid: obj.uid,
            nickname: obj.nickname,
            bridge: obj.bridge
          })
          break
        // 发送消息
        default:
          boardcast({
            type: 2,
            date: moment().format('YYYY-MM-DD HH:mm:ss'),
            msg: obj.msg,
            uid: obj.uid,
            nickname: obj.nickname,
            bridge: obj.bridge,
            groupId: obj.groupId,
            status: 1
          })
          break
      }
    })
    conn.on('close', function(code, reason) {
      console.log('关闭连接')
    })
    conn.on('error', function(code, reason) {
      console.log('异常关闭,异常原因：')
      console.info(code + ' ' + reason)
    })
  })
  .listen(8001)
console.log('WebSocket建立完毕')

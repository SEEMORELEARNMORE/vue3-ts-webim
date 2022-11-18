<template>
  <div id="app">
    <chat-dialog v-if="loginDialog" title="请输入你的昵称" confirmBtn="开始聊天" @confirm="login">
      <input class="nickname" v-model="name" type="text" placeholder="请输入你的昵称" />
    </chat-dialog>

    <chat-dialog v-if="createGroupDialog" title="请输入群名称" confirmBtn="确认" @confirm="createGroup">
      <input class="nickname" v-model="groupName" type="text" placeholder="请输入群名称" />
    </chat-dialog>

    <div class="web-im dis-flex">
      <div class="left">
        <div class="aside content">
          <div class="header">
            <div class="tabbar dis-flex">
              <label :class="{ active: switchType == 1, unread: usersUnRead }" for="" @click="switchType = 1">联系人</label>
              <label :class="{ active: switchType == 2, unread: groupsUnRead }" for="" @click="switchType = 2">群聊</label>
            </div>
          </div>
          <div class="body user-list">
            <template v-if="switchType === 2">
              <div v-for="item in currentGroups" :key="item" @click="triggerGroup(item)" class="user">
                {{ item.name }}
                <span class="tips-num" v-if="item && item.unread">{{ item.unread }}</span>
                <span v-if="!checkUserIsGroup(item)" @click.stop="addGroup(item)" class="add-group">+</span>
              </div>
            </template>
            <template v-if="switchType === 1">
              <div class="user" @click="triggerPersonal(item)" :class="{ offline: !item.status }" v-for="item in currentUserList" :key="item">
                {{ item.nickname }}
                <span class="tips-num" v-if="item.unread">{{ item.unread }}</span>
              </div>
            </template>
          </div>
          <div class="footer">
            <div class="func dis-flex">
              <label @click="createGroupDialog = true">&emsp;新建群</label>
            </div>
          </div>
        </div>
      </div>
      <div class="right content">
        <div class="header im-title">{{ title }}</div>
        <div class="body im-record" id="im-record">
          <div class="ul">
            <div class="li" :class="{ user: item.uid == localDatas.uid }" v-for="item in currentMessage" :key="item">
              <template v-if="item.type === 1">
                <p class="join-tips">{{ item.msg }}</p>
              </template>
              <template v-else>
                <p class="message-date">
                  <span class="m-nickname">{{ item.nickname }}</span> {{ item.date }}
                </p>
                <p class="message-box">{{ item.msg }}</p>
              </template>
            </div>
          </div>
        </div>
        <div class="footer im-input dis-flex">
          <input type="text" v-model="msg" placeholder="请输入内容" />
          <button @click="send">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import ChatDialog from '@/components/ChatDialog'
import Message from '@/components/Message'
import moment from 'moment'
import { ref, computed, onMounted, reactive, nextTick, onBeforeUnmount } from 'vue'

// localStorage
const localDatas = reactive({ messageList: [], groups: [], nickname: '', uid: '', users: [] })
const storage = localStorage
// 信息
const msg = ref('')

// 登录相关
// 昵称
const name = ref('')
const loginDialog = ref(false)
// 提交昵称
function login() {
  name.value = name.value.trim()
  localDatas.nickname = name.value
  if (!name.value) {
    Message({ type: 'error', message: '请输入您的昵称' }, 'error')
  } else {
    Message({ type: 'success', message: '登录成功' }, 'success')
    loginDialog.value = false
    const id = 'web_im_' + moment().valueOf()
    localDatas.uid = id
    localDatas.nickname = name.value
    storage.setItem('uid', JSON.stringify(id))
    storage.setItem('nickname', JSON.stringify(name.value))
    socket.value = init({
      uid: localDatas.uid,
      type: 1,
      nickname: localDatas.nickname,
      msg: msg,
      bridge: bridge.value,
      groupId: groupId.value,
    })
  }
}
// 创建群组相关
// 群组名称
const groupName = ref('')
const bridge = ref([])
const groupId = ref('')
const title = ref('')
const currentMessage = computed(() => {
  // eslint-disable-next-line array-callback-return
  const data = localDatas.messageList.filter((item: { type: number; groupId: any; bridge: any[] }) => {
    //  提示性消息、已经打开的对话框（群聊或者联系人） 提供给当前对话框
    if (item.type === 1) {
      return item
    } else if (groupId.value) {
      return item.groupId === groupId.value
    } else if (Array.isArray(item.bridge) && item.bridge.length) {
      return item.bridge.sort().join(',') === bridge.value.sort().join(',')
    }
  })
  data.map((item: { status: number }) => {
    item.status = 0
    return item
  })
  return data
})
const currentGroups = computed(() => {
  // eslint-disable-next-line no-undef
  const groups = localDatas.groups
  if (groups) {
    groups.map((group: { unread: any; id: any; [propName: string]: any }) => {
      group.unread = localDatas.messageList.filter((item: { groupId: any; status: number }) => {
        return item.groupId === group.id && item.status === 1
      }).length
      return group
    })
  }
  return groups
})
// eslint-disable-next-line prefer-const

const usersUnRead = computed(() => {
  return localDatas.messageList.some((item: { bridge: any[]; status: number }) => {
    return item.bridge && item.bridge.length && item.status === 1
  })
})
const groupsUnRead = computed(() => {
  return localDatas.messageList.some((item: { groupId: any; status: number }) => {
    return item.groupId && item.status === 1
  })
})
const currentUserList = computed(() => {
  localDatas.users.map((user: { unread: any; uid: any }) => {
    user.unread = localDatas.messageList.filter((item: { bridge: any[]; uid: any; status: number }) => {
      if (Array.isArray(item.bridge) && item.bridge.length && item.uid === user.uid && item.status === 1) {
        return true
      }
      return false
    }).length

    return user
  })
  const users = localDatas.users.filter((item) => {
    return item.uid !== localDatas.uid
  })
  return users
})
const createGroupDialog = ref(false)

// 建立websocket连接
const socket = ref()
function init(data: any) {
  const socket = new WebSocket('ws://10.90.41.24:8001')

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  socket.onopen = function (e) {
    console.log('连接服务器成功')
    console.log(socket.readyState)
    sendMessage(data)
    Message({ type: 'success', message: '连接服务器成功' }, 'success')
  }

  socket.onclose = function (e) {
    console.log('服务器关闭')
  }
  socket.onerror = function (e: Event) {
    console.log('连接出错')
  }
  // 接收服务器的消息
  socket.onmessage = function (e) {
    const message = JSON.parse(e.data)
    if (storage.getItem('messageList')) {
      storage.setItem('messageList', JSON.stringify(localDatas.messageList))
      const ml = JSON.parse(storage.getItem('messageList') || '')
      ml.push(message)
      localDatas.messageList = ml
      storage.setItem('messageList', JSON.stringify(ml))
    } else {
      const ml = []
      ml.push(message)
      localDatas.messageList.push(message)
      storage.setItem('messageList', JSON.stringify(ml))
    }
    if (message.users) {
      localDatas.users = message.users
      storage.setItem('users', JSON.stringify(message.users))
    }
    if (message.groups) {
      localDatas.groups = message.groups
      storage.setItem('groups', JSON.stringify(message.groups))
    }

    nextTick(() => {
      const div = document.getElementById('im-record') as Element
      div.scrollTop = div.scrollHeight
    })
  }
  return socket
}
function sendMessage(sendData: any) {
  if (socket.value && sendData) {
    socket.value.send(JSON.stringify(sendData))
  }
}
// 确认创建群组
function createGroup() {
  groupName.value = groupName.value.trim()
  if (!groupName.value) {
    Message({ type: 'error', message: '请输入群名称' }, 'error')
    return
  }
  sendMessage({
    uid: localDatas.uid,
    type: 10,
    nickname: localDatas.nickname,
    groupName: groupName.value,
    bridge: [],
  })
}

// 选择联系人或者群组
const switchType = ref(1)
function triggerGroup(item: { users: any[]; name: any; id: any }) {
  const issome = item.users.some((item: { uid: string | null }) => {
    return item.uid === localDatas.uid
  })
  if (!issome) {
    Message({ type: 'error', message: `您还不是${item.name}群成员` }, 'error')
    return
  }
  bridge.value = []
  groupId.value = item.id
  title.value = `和${item.name}群成员聊天`
}
function checkUserIsGroup(item: { users: any[] }) {
  return item.users.some((item: { uid: any }) => {
    return item.uid === localDatas.uid
  })
}
function addGroup(item: { id: any; name: any }) {
  sendMessage({
    uid: localDatas.uid,
    type: 20,
    nickname: localDatas.nickname,
    groupId: item.id,
    groupName: item.name,
    bridge: [],
  })
  Message({ type: 'success', message: `成功加入${item.name}群` }, 'success')
}
function triggerPersonal(item: { uid: any; nickname: any }) {
  if (localDatas.uid === item.uid) {
    return
  }
  groupId.value = ''
  bridge.value = [localDatas.uid, item.uid]
  // bridge.value.push(localDatas.uid, item.uid)
  title.value = `和${item.nickname}聊天`
}
function send() {
  msg.value = msg.value.trim()
  if (!msg.value) {
    return
  }
  if (!bridge.value.length && !groupId.value) {
    Message({ type: 'error', message: '请选择发送人或者群' }, 'error')
    return
  }
  sendMessage({
    uid: localDatas.uid,
    type: 100,
    nickname: localDatas.nickname,
    msg: msg.value,
    bridge: bridge.value,
    groupId: groupId.value,
  })
  msg.value = ''
}
function quit() {
  sendMessage({
    uid: localDatas.uid,
    type: 2,
    nickname: localDatas.nickname,
    bridge: [],
  })
  storage.clear()
  if (socket.value) {
    socket.value.close()
  }
}
onMounted(() => {
  if (!localDatas.uid) {
    // storage.clear()
    loginDialog.value = true
  } else if (!socket.value) {
    socket.value = init({
      uid: localDatas.uid,
      type: 1,
      nickname: localDatas.nickname,
      msg: msg,
      bridge: bridge.value,
      groupId: groupId.value,
    })
  }
  document.onkeydown = function (event) {
    const e = event || window.event
    if (e && e.keyCode === 13) {
      // 回车键的键值为13
      send()
    }
  }
  window.addEventListener('beforeunload', quit)
  window.addEventListener('unload', quit)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', quit)
  window.removeEventListener('unload', quit)
})
</script>
<style>
@import '../../assets/styles/home.css';
</style>
<style>
@keyframes fColorAni {
  0% {
    color: green;
  }
  50% {
    color: #46b0ff;
  }
  100% {
    color: #333;
  }
}
.unread {
  animation: fColorAni 0.3s infinite;
}
</style>

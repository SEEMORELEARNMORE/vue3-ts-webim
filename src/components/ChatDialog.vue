<template>
  <div class="popup" v-if="visable">
    <div class="dialog">
      <div class="title" v-if="title">{{ title }}</div>
      <div class="content">
        <slot></slot>
      </div>
      <div class="btn">
        <button v-if="confirmBtn" @click="confirm">{{ confirmBtn ? confirmBtn : '确认' }}</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue'
const visable = ref(true)
const emit = defineEmits(['confirm'])
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  confirmBtn: {
    type: [String],
    default: '',
  },
})
function hide() {
  visable.value = false
}
function confirm() {
  hide()
  emit('confirm')
}
</script>
<style scoped>
@import '../assets/styles/dialog.css'
</style>

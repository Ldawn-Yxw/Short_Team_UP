<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f6fa;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

/* 全局按钮样式重置 */
button {
  border: none;
  outline: none;
  cursor: pointer;
}

/* 全局输入框样式重置 */
input, select, textarea {
  border: none;
  outline: none;
  font-family: inherit;
}

/* 链接样式重置 */
a {
  color: inherit;
  text-decoration: none;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

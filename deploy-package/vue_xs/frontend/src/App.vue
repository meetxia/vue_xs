<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
import Footer from '@/components/layout/Footer.vue'
</script>

<template>
  <div id="app" class="min-h-screen flex flex-col bg-gray-50">
    <!-- 顶部导航 -->
    <Header />

    <!-- 主要内容 -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- 页脚 -->
    <Footer />
  </div>
</template>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

a {
  text-decoration: none;
}
</style>

<template>
  <footer class="site-footer">
    <div class="footer-container">
      <!-- 主要内容区 -->
      <div class="footer-main">
        <!-- 关于我们 -->
        <div class="footer-section">
          <h3 class="section-title">关于MOMO小说</h3>
          <p class="section-desc">
            专注于为读者提供优质的网络小说阅读体验，
            海量正版小说，精彩内容每日更新。
          </p>
          <div class="social-links">
            <a href="#" class="social-link" title="微信公众号">
              <el-icon><ChatDotRound /></el-icon>
            </a>
            <a href="#" class="social-link" title="微博">
              <el-icon><Share /></el-icon>
            </a>
            <a href="#" class="social-link" title="QQ群">
              <el-icon><User /></el-icon>
            </a>
          </div>
        </div>

        <!-- 快速链接 -->
        <div class="footer-section">
          <h3 class="section-title">快速链接</h3>
          <ul class="link-list">
            <li><router-link to="/novels">小说库</router-link></li>
            <li><router-link to="/ranking">排行榜</router-link></li>
            <li><router-link to="/categories">分类导航</router-link></li>
            <li><router-link to="/about">关于我们</router-link></li>
          </ul>
        </div>

        <!-- 用户服务 -->
        <div class="footer-section">
          <h3 class="section-title">用户服务</h3>
          <ul class="link-list">
            <li><router-link to="/help">帮助中心</router-link></li>
            <li><router-link to="/feedback">意见反馈</router-link></li>
            <li><router-link to="/terms">服务条款</router-link></li>
            <li><router-link to="/privacy">隐私政策</router-link></li>
          </ul>
        </div>

        <!-- 联系方式 -->
        <div class="footer-section">
          <h3 class="section-title">联系我们</h3>
          <ul class="contact-list">
            <li>
              <el-icon><Message /></el-icon>
              <span>service@momo-novel.com</span>
            </li>
            <li>
              <el-icon><Phone /></el-icon>
              <span>400-123-4567</span>
            </li>
            <li>
              <el-icon><Location /></el-icon>
              <span>广东省广州市天河区</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="footer-bottom">
        <div class="copyright">
          <p>© 2024 MOMO小说. All rights reserved.</p>
          <p class="备案号">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">
              粤ICP备XXXXXXXX号
            </a>
          </p>
        </div>
        <div class="footer-links">
          <a href="/sitemap">网站地图</a>
          <span class="separator">|</span>
          <a href="/rss">RSS订阅</a>
          <span class="separator">|</span>
          <a href="/友情链接">友情链接</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {
  ChatDotRound,
  Share,
  User,
  Message,
  Phone,
  Location
} from '@element-plus/icons-vue'
</script>

<style scoped>
.site-footer {
  @apply bg-gray-900 text-gray-300 mt-auto;
}

.footer-container {
  @apply max-w-7xl mx-auto px-4 py-12;
}

.footer-main {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8;
}

.footer-section {
  @apply space-y-4;
}

.section-title {
  @apply text-white text-lg font-semibold mb-4;
}

.section-desc {
  @apply text-sm leading-relaxed text-gray-400;
}

.social-links {
  @apply flex gap-3 mt-4;
}

.social-link {
  @apply w-10 h-10 flex items-center justify-center 
         bg-gray-800 rounded-full hover:bg-blue-600 
         transition-colors duration-200 text-gray-300 hover:text-white;
}

.link-list {
  @apply space-y-2 list-none p-0;
}

.link-list a {
  @apply text-gray-400 hover:text-white 
         transition-colors duration-200 text-sm no-underline;
}

.contact-list {
  @apply space-y-3 list-none p-0;
}

.contact-list li {
  @apply flex items-center gap-2 text-sm text-gray-400;
}

.footer-bottom {
  @apply pt-8 border-t border-gray-800 
         flex flex-col md:flex-row justify-between items-center 
         gap-4 text-sm;
}

.copyright {
  @apply text-center md:text-left;
}

.copyright p {
  @apply text-gray-500;
}

.copyright a {
  @apply text-gray-500 hover:text-gray-300 
         transition-colors duration-200 no-underline;
}

.footer-links {
  @apply flex items-center gap-2;
}

.footer-links a {
  @apply text-gray-500 hover:text-gray-300 
         transition-colors duration-200 no-underline;
}

.separator {
  @apply text-gray-700;
}

@media (max-width: 768px) {
  .footer-main {
    @apply grid-cols-1;
  }
  
  .footer-bottom {
    @apply flex-col text-center;
  }
}
</style>


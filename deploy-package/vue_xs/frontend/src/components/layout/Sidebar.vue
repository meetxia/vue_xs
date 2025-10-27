<template>
  <aside class="sidebar" :class="sidebarClass">
    <div class="sidebar-header" v-if="title">
      <h3 class="sidebar-title">{{ title }}</h3>
      <button v-if="collapsible" class="collapse-btn" @click="toggleCollapse">
        <el-icon>
          <component :is="isCollapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>
    </div>

    <div class="sidebar-content">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="sidebar-footer">
      <slot name="footer"></slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'

interface Props {
  title?: string
  width?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  position?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  width: '250px',
  collapsible: false,
  defaultCollapsed: false,
  position: 'left'
})

const isCollapsed = ref(props.defaultCollapsed)

const sidebarClass = computed(() => ({
  'is-collapsed': isCollapsed.value,
  [`sidebar-${props.position}`]: true
}))

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

defineExpose({
  isCollapsed,
  toggleCollapse
})
</script>

<style scoped>
.sidebar {
  @apply bg-white border-r border-gray-200 
         transition-all duration-300 flex flex-col;
  width: v-bind(width);
}

.sidebar.is-collapsed {
  width: 60px;
}

.sidebar-right {
  @apply border-r-0 border-l border-gray-200;
}

.sidebar-header {
  @apply flex items-center justify-between 
         px-4 py-3 border-b border-gray-200;
}

.sidebar-title {
  @apply text-lg font-semibold text-gray-800 
         truncate transition-opacity duration-300;
}

.sidebar.is-collapsed .sidebar-title {
  @apply opacity-0 w-0;
}

.collapse-btn {
  @apply flex items-center justify-center 
         w-8 h-8 rounded hover:bg-gray-100 
         transition-colors duration-200 text-gray-600;
}

.sidebar-content {
  @apply flex-1 overflow-y-auto p-4;
}

.sidebar.is-collapsed .sidebar-content {
  @apply p-2;
}

.sidebar-footer {
  @apply px-4 py-3 border-t border-gray-200;
}

/* 自定义滚动条 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.sidebar-content::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}
</style>


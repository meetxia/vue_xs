<template>
  <div class="waterfall-container" ref="containerRef">
    <div
      v-for="(column, index) in columns"
      :key="index"
      class="waterfall-column"
      :style="{ width: columnWidth }"
    >
      <slot
        name="item"
        v-for="item in column"
        :key="item.id"
        :item="item"
      ></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

interface Props {
  items: any[]
  columnCount?: number
  gap?: number
}

const props = withDefaults(defineProps<Props>(), {
  columnCount: 4,
  gap: 20
})

const containerRef = ref<HTMLElement>()
const columns = ref<any[][]>([])
const actualColumnCount = ref(props.columnCount)

// 计算列宽
const columnWidth = computed(() => {
  return `calc((100% - ${(actualColumnCount.value - 1) * props.gap}px) / ${actualColumnCount.value})`
})

// 分配卡片到列
const distributeItems = () => {
  const newColumns: any[][] = Array.from(
    { length: actualColumnCount.value },
    () => []
  )
  
  // 记录每列的高度（通过项目数量近似）
  const columnHeights = Array(actualColumnCount.value).fill(0)
  
  props.items.forEach((item) => {
    // 找到最短的列
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    
    // 将项目添加到最短的列
    newColumns[shortestColumnIndex].push(item)
    
    // 更新列高度（简化计算，实际应该根据卡片高度）
    columnHeights[shortestColumnIndex] += 1
  })
  
  columns.value = newColumns
}

// 响应式调整列数
const updateColumnCount = () => {
  if (!containerRef.value) return
  
  const width = containerRef.value.offsetWidth
  
  if (width < 640) {
    actualColumnCount.value = 1
  } else if (width < 768) {
    actualColumnCount.value = 2
  } else if (width < 1024) {
    actualColumnCount.value = 3
  } else if (width < 1280) {
    actualColumnCount.value = 4
  } else {
    actualColumnCount.value = props.columnCount
  }
  
  nextTick(() => {
    distributeItems()
  })
}

// 监听items变化
watch(() => props.items, () => {
  nextTick(() => {
    distributeItems()
  })
}, { deep: true })

// 监听列数变化
watch(actualColumnCount, () => {
  distributeItems()
})

// 窗口大小变化监听
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateColumnCount()
  
  // 使用ResizeObserver监听容器大小变化
  if (containerRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      updateColumnCount()
    })
    resizeObserver.observe(containerRef.value)
  } else {
    // 降级方案：使用window resize
    window.addEventListener('resize', updateColumnCount)
  }
  
  distributeItems()
})

onBeforeUnmount(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  } else {
    window.removeEventListener('resize', updateColumnCount)
  }
})
</script>

<style scoped>
.waterfall-container {
  @apply flex gap-5 w-full;
}

.waterfall-column {
  @apply flex flex-col;
  gap: v-bind("`${props.gap}px`");
}
</style>


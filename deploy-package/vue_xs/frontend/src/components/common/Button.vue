<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
    :type="nativeType"
    @click="handleClick"
  >
    <el-icon v-if="loading" class="is-loading">
      <Loading />
    </el-icon>
    <el-icon v-else-if="icon" class="button-icon">
      <component :is="icon" />
    </el-icon>
    <span v-if="$slots.default" class="button-text">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'large' | 'default' | 'small'
  plain?: boolean
  round?: boolean
  circle?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: any
  nativeType?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  plain: false,
  round: false,
  circle: false,
  disabled: false,
  loading: false,
  nativeType: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => {
  return [
    'custom-button',
    `custom-button--${props.type}`,
    `custom-button--${props.size}`,
    {
      'is-plain': props.plain,
      'is-round': props.round,
      'is-circle': props.circle,
      'is-disabled': props.disabled || props.loading,
      'is-loading': props.loading
    }
  ]
})

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.custom-button {
  @apply inline-flex items-center justify-center px-4 py-2 font-medium rounded-md 
         transition-all duration-200 cursor-pointer border outline-none;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
}

.custom-button:hover:not(.is-disabled) {
  @apply opacity-80;
}

.custom-button:active:not(.is-disabled) {
  @apply scale-95;
}

/* 类型样式 */
.custom-button--primary {
  @apply bg-blue-500 text-white border-blue-500;
}

.custom-button--success {
  @apply bg-green-500 text-white border-green-500;
}

.custom-button--warning {
  @apply bg-yellow-500 text-white border-yellow-500;
}

.custom-button--danger {
  @apply bg-red-500 text-white border-red-500;
}

.custom-button--info {
  @apply bg-gray-500 text-white border-gray-500;
}

.custom-button--default {
  @apply bg-white text-gray-700 border-gray-300;
}

/* 朴素样式 */
.custom-button--primary.is-plain {
  @apply bg-blue-50 text-blue-500 border-blue-200;
}

.custom-button--success.is-plain {
  @apply bg-green-50 text-green-500 border-green-200;
}

.custom-button--warning.is-plain {
  @apply bg-yellow-50 text-yellow-500 border-yellow-200;
}

.custom-button--danger.is-plain {
  @apply bg-red-50 text-red-500 border-red-200;
}

/* 尺寸 */
.custom-button--large {
  @apply px-6 py-3 text-base;
}

.custom-button--small {
  @apply px-3 py-1 text-sm;
}

/* 圆角 */
.custom-button.is-round {
  @apply rounded-full;
}

/* 圆形按钮 */
.custom-button.is-circle {
  @apply rounded-full w-10 h-10 p-0;
}

.custom-button--large.is-circle {
  @apply w-12 h-12;
}

.custom-button--small.is-circle {
  @apply w-8 h-8;
}

/* 禁用状态 */
.custom-button.is-disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* 图标间距 */
.button-icon {
  @apply mr-1;
}

.custom-button.is-circle .button-icon {
  @apply mr-0;
}

.is-loading {
  @apply animate-spin mr-1;
}

.custom-button.is-circle .is-loading {
  @apply mr-0;
}
</style>


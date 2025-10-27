<template>
  <div v-if="visible" class="loading-overlay" :class="overlayClass">
    <div class="loading-spinner" :class="spinnerClass">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  text?: string
  fullscreen?: boolean
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  fullscreen: false,
  size: 'default'
})

const overlayClass = computed(() => ({
  'is-fullscreen': props.fullscreen
}))

const spinnerClass = computed(() => ({
  [`spinner-${props.size}`]: true
}))
</script>

<style scoped>
.loading-overlay {
  @apply flex items-center justify-center;
}

.loading-overlay.is-fullscreen {
  @apply fixed inset-0 bg-white bg-opacity-90 z-50;
}

.loading-spinner {
  @apply flex flex-col items-center justify-center relative;
}

.spinner-small {
  width: 40px;
  height: 40px;
}

.spinner-default {
  width: 60px;
  height: 60px;
}

.spinner-large {
  width: 80px;
  height: 80px;
}

.spinner-ring {
  @apply absolute border-4 border-transparent border-t-blue-500 
         rounded-full animate-spin;
  width: 100%;
  height: 100%;
}

.spinner-ring:nth-child(1) {
  animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #3b82f6 transparent transparent transparent;
}

.spinner-ring:nth-child(2) {
  animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: -0.375s;
  border-color: transparent #60a5fa transparent transparent;
}

.spinner-ring:nth-child(3) {
  animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: -0.75s;
  border-color: transparent transparent #93c5fd transparent;
}

.spinner-ring:nth-child(4) {
  animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  animation-delay: -1.125s;
  border-color: transparent transparent transparent #dbeafe;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  @apply mt-16 text-gray-600 text-sm;
}
</style>


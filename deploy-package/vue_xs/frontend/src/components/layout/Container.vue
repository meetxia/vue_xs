<template>
  <div class="page-container" :class="containerClass">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'small' | 'default' | 'large'
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'xl',
  padding: 'default',
  center: true
})

const containerClass = computed(() => ({
  [`max-w-${props.maxWidth}`]: true,
  [`padding-${props.padding}`]: true,
  'mx-auto': props.center
}))
</script>

<style scoped>
.page-container {
  @apply w-full;
}

.max-w-sm {
  max-width: 640px;
}

.max-w-md {
  max-width: 768px;
}

.max-w-lg {
  max-width: 1024px;
}

.max-w-xl {
  max-width: 1280px;
}

.max-w-2xl {
  max-width: 1536px;
}

.max-w-full {
  max-width: 100%;
}

.padding-none {
  @apply p-0;
}

.padding-small {
  @apply px-4 py-2;
}

.padding-default {
  @apply px-4 md:px-6 py-4;
}

.padding-large {
  @apply px-6 md:px-8 py-6 md:py-8;
}
</style>


<template>
  <div class="custom-card" :class="cardClass">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="card-body" :class="bodyClass">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  shadow?: 'always' | 'hover' | 'never'
  bordered?: boolean
  padding?: 'none' | 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  shadow: 'always',
  bordered: true,
  padding: 'default'
})

const cardClass = computed(() => ({
  [`shadow-${props.shadow}`]: true,
  'is-bordered': props.bordered
}))

const bodyClass = computed(() => ({
  [`padding-${props.padding}`]: true
}))
</script>

<style scoped>
.custom-card {
  @apply bg-white rounded-lg overflow-hidden transition-shadow duration-200;
}

.custom-card.is-bordered {
  @apply border border-gray-200;
}

.custom-card.shadow-always {
  @apply shadow-md;
}

.custom-card.shadow-hover {
  @apply shadow-sm hover:shadow-md;
}

.custom-card.shadow-never {
  @apply shadow-none;
}

.card-header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.card-title {
  @apply text-lg font-semibold text-gray-800;
}

.card-body {
  @apply transition-all;
}

.card-body.padding-none {
  @apply p-0;
}

.card-body.padding-small {
  @apply p-3;
}

.card-body.padding-default {
  @apply p-6;
}

.card-body.padding-large {
  @apply p-8;
}

.card-footer {
  @apply px-6 py-4 border-t border-gray-200 bg-gray-50;
}
</style>


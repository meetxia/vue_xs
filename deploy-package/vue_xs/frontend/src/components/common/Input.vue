<template>
  <div class="custom-input" :class="inputWrapperClass">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="input-wrapper" :class="{ 'has-prefix': $slots.prefix, 'has-suffix': $slots.suffix }">
      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix"></slot>
      </span>
      
      <input
        v-if="type !== 'textarea'"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :class="inputClass"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <textarea
        v-else
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :rows="rows"
        :class="inputClass"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      ></textarea>
      
      <span v-if="$slots.suffix || showWordLimit" class="input-suffix">
        <slot name="suffix"></slot>
        <span v-if="showWordLimit" class="word-limit">
          {{ modelValue?.length || 0 }}/{{ maxlength }}
        </span>
      </span>
    </div>
    
    <div v-if="error || hint" class="input-message">
      <span v-if="error" class="text-red-500 text-sm">{{ error }}</span>
      <span v-else-if="hint" class="text-gray-500 text-sm">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea'
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  maxlength?: number
  showWordLimit?: boolean
  rows?: number
  size?: 'large' | 'default' | 'small'
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  showWordLimit: false,
  rows: 3,
  size: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const isFocused = ref(false)

const inputWrapperClass = computed(() => ({
  [`input-${props.size}`]: true,
  'is-disabled': props.disabled,
  'is-error': props.error
}))

const inputClass = computed(() => [
  'input-inner',
  {
    'is-disabled': props.disabled,
    'is-error': props.error
  }
])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('change', target.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}
</script>

<style scoped>
.custom-input {
  @apply w-full mb-4;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.input-wrapper {
  @apply relative flex items-center;
}

.input-prefix,
.input-suffix {
  @apply flex items-center px-3 text-gray-500;
}

.input-inner {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md 
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
         transition-all duration-200;
}

.input-inner:disabled {
  @apply bg-gray-100 cursor-not-allowed opacity-60;
}

.input-inner.is-error {
  @apply border-red-500 focus:ring-red-500;
}

textarea.input-inner {
  @apply resize-y min-h-[80px];
}

.input-wrapper.has-prefix .input-inner {
  @apply pl-10;
}

.input-wrapper.has-suffix .input-inner {
  @apply pr-10;
}

.input-large .input-inner {
  @apply py-3 text-base;
}

.input-small .input-inner {
  @apply py-1 text-sm;
}

.word-limit {
  @apply text-xs text-gray-400;
}

.input-message {
  @apply mt-1;
}
</style>


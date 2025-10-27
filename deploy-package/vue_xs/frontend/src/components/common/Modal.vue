<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-wrapper">
          <div class="modal-container" :class="modalClass" @click.stop>
            <!-- 头部 -->
            <div v-if="!hideHeader" class="modal-header">
              <slot name="header">
                <h3 class="modal-title">{{ title }}</h3>
              </slot>
              <button
                v-if="showClose"
                class="modal-close"
                @click="handleClose"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>

            <!-- 内容 -->
            <div class="modal-body" :class="bodyClass">
              <slot></slot>
            </div>

            <!-- 底部 -->
            <div v-if="!hideFooter" class="modal-footer">
              <slot name="footer">
                <Button @click="handleClose">取消</Button>
                <Button type="primary" :loading="loading" @click="handleConfirm">
                  确定
                </Button>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'
import Button from './Button.vue'

interface Props {
  visible: boolean
  title?: string
  width?: string
  top?: string
  hideHeader?: boolean
  hideFooter?: boolean
  showClose?: boolean
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  loading?: boolean
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  width: '500px',
  top: '15vh',
  hideHeader: false,
  hideFooter: false,
  showClose: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  loading: false,
  center: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  confirm: []
}>()

const modalClass = computed(() => ({
  'is-center': props.center
}))

const bodyClass = computed(() => ({
  'text-center': props.center
}))

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleOverlayClick = () => {
  if (props.closeOnClickModal) {
    handleClose()
  }
}

// ESC键关闭
watch(() => props.visible, (val) => {
  if (val && props.closeOnPressEscape) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  }
})
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 
         flex items-start justify-center overflow-auto;
  padding: 15vh 0 50px;
}

.modal-wrapper {
  @apply w-full flex justify-center;
  max-width: v-bind(width);
  margin: 0 auto;
}

.modal-container {
  @apply bg-white rounded-lg shadow-xl w-full 
         transform transition-all duration-300;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  @apply flex items-center justify-between px-6 py-4 
         border-b border-gray-200;
}

.modal-title {
  @apply text-lg font-semibold text-gray-800;
}

.modal-close {
  @apply text-gray-400 hover:text-gray-600 
         transition-colors duration-200 cursor-pointer
         flex items-center justify-center w-8 h-8 rounded
         hover:bg-gray-100;
}

.modal-body {
  @apply px-6 py-4 overflow-auto flex-1;
}

.modal-footer {
  @apply flex items-center justify-end gap-3 
         px-6 py-4 border-t border-gray-200;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}
</style>


<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize } from '@/types'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
})

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const emit = defineEmits<Emits>()

const buttonClasses = computed(() => {
  const classes = ['btn']

  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push('btn-primary')
      break
    case 'secondary':
      classes.push('btn-secondary')
      break
    case 'danger':
      classes.push('btn-danger')
      break
    case 'ghost':
      classes.push('btn-ghost')
      break
  }

  // Size classes
  switch (props.size) {
    case 'sm':
      classes.push('btn-sm')
      break
    case 'md':
      classes.push('btn-md')
      break
    case 'lg':
      classes.push('btn-lg')
      break
  }

  return classes.join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <svg
      v-if="loading"
      class="mr-2 h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <slot />
  </button>
</template>

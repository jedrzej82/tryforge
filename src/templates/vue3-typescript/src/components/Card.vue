<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true,
})
</script>

<template>
  <div class="card">
    <div v-if="$slots.header || title" class="border-b border-gray-200 px-6 py-4">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <div :class="padding ? 'p-6' : ''">
      <slot />
    </div>

    <div v-if="$slots.footer" class="border-t border-gray-200 px-6 py-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCounterStore } from '@/stores/counter'
import Button from '@/components/Button.vue'
import Card from '@/components/Card.vue'

const counter = useCounterStore()
const message = ref('Welcome to Vue 3 + TypeScript')
const loading = ref(false)

const handleAsyncIncrement = async () => {
  loading.value = true
  await counter.incrementAsync()
  loading.value = false
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-bold text-gray-900">{{ message }}</h1>
      <p class="mt-2 text-lg text-gray-600">
        A modern template with Composition API, Pinia, and TailwindCSS
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <Card title="Counter Example" subtitle="Pinia store with TypeScript">
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-5xl font-bold text-primary-600">{{ counter.count }}</p>
            <p class="mt-2 text-sm text-gray-500">
              Double: {{ counter.doubleCount }} | {{ counter.isEven ? 'Even' : 'Odd' }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button @click="counter.increment">Increment</Button>
            <Button variant="secondary" @click="counter.decrement">Decrement</Button>
            <Button variant="ghost" @click="counter.reset">Reset</Button>
            <Button :loading="loading" @click="handleAsyncIncrement">Async +1</Button>
          </div>
        </div>
      </Card>

      <Card title="Features" subtitle="What's included in this template">
        <ul class="space-y-2">
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">Vue 3.4+ with TypeScript 5</span>
          </li>
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">Composition API with script setup</span>
          </li>
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">Vite for lightning-fast builds</span>
          </li>
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">Vue Router 4 with type-safe routes</span>
          </li>
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">Pinia for state management</span>
          </li>
          <li class="flex items-start">
            <svg
              class="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm text-gray-700">TailwindCSS for styling</span>
          </li>
        </ul>
      </Card>
    </div>

    <Card title="Quick Start" subtitle="Get started with development">
      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium text-gray-900">Install dependencies:</h4>
          <pre
            class="mt-2 rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
          ><code>npm install</code></pre>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-900">Start development server:</h4>
          <pre
            class="mt-2 rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
          ><code>npm run dev</code></pre>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-900">Build for production:</h4>
          <pre
            class="mt-2 rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
          ><code>npm run build</code></pre>
        </div>
      </div>
    </Card>
  </div>
</template>

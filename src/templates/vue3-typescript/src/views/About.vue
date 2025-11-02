<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'
import { formatDate } from '@/utils/helpers'

interface Feature {
  name: string
  description: string
  icon: string
}

const features = ref<Feature[]>([
  {
    name: 'TypeScript Support',
    description: 'Full TypeScript support with strict mode enabled for type safety.',
    icon: '🔷',
  },
  {
    name: 'Composition API',
    description: 'Modern Vue 3 Composition API with script setup syntax.',
    icon: '🎯',
  },
  {
    name: 'State Management',
    description: 'Pinia stores with TypeScript for predictable state management.',
    icon: '📦',
  },
  {
    name: 'Routing',
    description: 'Vue Router 4 with type-safe navigation and route guards.',
    icon: '🧭',
  },
  {
    name: 'Styling',
    description: 'TailwindCSS with custom configuration and utility classes.',
    icon: '🎨',
  },
  {
    name: 'Testing',
    description: 'Vitest and Vue Test Utils for comprehensive testing.',
    icon: '✅',
  },
])

const currentDate = formatDate(new Date())
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-bold text-gray-900">About This Template</h1>
      <p class="mt-2 text-lg text-gray-600">
        A production-ready Vue 3 template with TypeScript and modern tooling
      </p>
      <p class="mt-4 text-sm text-gray-500">Last updated: {{ currentDate }}</p>
    </div>

    <Card>
      <div class="prose max-w-none">
        <h2 class="text-2xl font-bold text-gray-900">Overview</h2>
        <p class="mt-2 text-gray-600">
          This template provides a solid foundation for building modern Vue 3 applications. It
          includes best practices, TypeScript support, and all the tools you need to build
          production-ready applications.
        </p>

        <h3 class="mt-6 text-xl font-bold text-gray-900">Why This Template?</h3>
        <ul class="mt-2 list-disc space-y-2 pl-5 text-gray-600">
          <li>Production-ready configuration out of the box</li>
          <li>Type-safe development with TypeScript strict mode</li>
          <li>Modern tooling with Vite for fast development</li>
          <li>Comprehensive examples and best practices</li>
          <li>Extensive documentation and code comments</li>
        </ul>
      </div>
    </Card>

    <div>
      <h2 class="mb-4 text-2xl font-bold text-gray-900">Features</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="feature in features" :key="feature.name" :padding="true">
          <div class="flex items-start space-x-3">
            <span class="text-3xl">{{ feature.icon }}</span>
            <div>
              <h3 class="font-semibold text-gray-900">{{ feature.name }}</h3>
              <p class="mt-1 text-sm text-gray-600">{{ feature.description }}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <Card>
      <div class="prose max-w-none">
        <h2 class="text-2xl font-bold text-gray-900">Project Structure</h2>
        <pre
          class="mt-4 rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
        ><code>src/
├── components/     # Reusable Vue components
├── composables/    # Composition API functions
├── views/          # Route views/pages
├── router/         # Vue Router configuration
├── stores/         # Pinia stores
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── assets/         # Static assets and styles</code></pre>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button variant="primary" @click="$router.push('/dashboard')">
            View Dashboard
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>

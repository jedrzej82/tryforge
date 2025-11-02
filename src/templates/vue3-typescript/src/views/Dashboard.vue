<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFetch } from '@/composables/useFetch'
import { useCounterStore } from '@/stores/counter'
import Card from '@/components/Card.vue'
import Button from '@/components/Button.vue'

interface Todo {
  userId: number
  id: number
  title: string
  completed: boolean
}

const counter = useCounterStore()

// Example of useFetch composable
const {
  data: todos,
  loading,
  error,
  execute: fetchTodos,
} = useFetch<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=5')

// Example of computed properties with TypeScript
const completedTodos = computed(() => {
  return todos.value?.filter((todo) => todo.completed) || []
})

const pendingTodos = computed(() => {
  return todos.value?.filter((todo) => !todo.completed) || []
})

const stats = computed(() => ({
  total: todos.value?.length || 0,
  completed: completedTodos.value.length,
  pending: pendingTodos.value.length,
}))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-2 text-lg text-gray-600">
        Real-world examples with API calls and state management
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-6 md:grid-cols-3">
      <Card>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600">Counter Value</p>
          <p class="mt-2 text-4xl font-bold text-primary-600">{{ counter.count }}</p>
          <p class="mt-1 text-sm text-gray-500">
            {{ counter.isEven ? 'Even number' : 'Odd number' }}
          </p>
        </div>
      </Card>

      <Card>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600">Total Tasks</p>
          <p class="mt-2 text-4xl font-bold text-gray-900">{{ stats.total }}</p>
          <p class="mt-1 text-sm text-gray-500">From API</p>
        </div>
      </Card>

      <Card>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-600">Completion Rate</p>
          <p class="mt-2 text-4xl font-bold text-green-600">
            {{ stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0 }}%
          </p>
          <p class="mt-1 text-sm text-gray-500">{{ stats.completed }} / {{ stats.total }}</p>
        </div>
      </Card>
    </div>

    <!-- Todos Section -->
    <Card title="Todo List" subtitle="Fetched from JSONPlaceholder API">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"></div>
      </div>

      <div v-else-if="error" class="rounded-lg bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading todos</h3>
            <p class="mt-1 text-sm text-red-700">{{ error.message }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="!todos || todos.length === 0" class="text-center py-12">
        <p class="text-gray-500">No todos found</p>
        <Button class="mt-4" @click="fetchTodos">Load Todos</Button>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
        >
          <input
            type="checkbox"
            :checked="todo.completed"
            disabled
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div class="flex-1">
            <p
              :class="[
                'text-sm font-medium',
                todo.completed ? 'text-gray-400 line-through' : 'text-gray-900',
              ]"
            >
              {{ todo.title }}
            </p>
            <p class="text-xs text-gray-500">ID: {{ todo.id }}</p>
          </div>
          <span
            :class="[
              'rounded-full px-2 py-1 text-xs font-medium',
              todo.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800',
            ]"
          >
            {{ todo.completed ? 'Completed' : 'Pending' }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <Button variant="secondary" @click="fetchTodos" :disabled="loading">
            Refresh
          </Button>
          <div class="text-sm text-gray-500">
            {{ stats.completed }} completed, {{ stats.pending }} pending
          </div>
        </div>
      </template>
    </Card>

    <!-- Counter Actions -->
    <Card title="Store Actions" subtitle="Interact with Pinia store">
      <div class="flex flex-wrap gap-2">
        <Button @click="counter.increment">Increment</Button>
        <Button variant="secondary" @click="counter.decrement">Decrement</Button>
        <Button variant="ghost" @click="counter.incrementBy(5)">Add 5</Button>
        <Button variant="danger" @click="counter.reset">Reset</Button>
      </div>
    </Card>
  </div>
</template>

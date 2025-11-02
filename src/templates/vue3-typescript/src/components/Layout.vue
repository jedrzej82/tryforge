<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isSidebarOpen = ref(false)

const navigation = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Dashboard', path: '/dashboard' },
]

const isActive = (path: string) => {
  return route.path === path
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <header class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex">
            <div class="flex flex-shrink-0 items-center">
              <h1 class="text-xl font-bold text-primary-600">Vue 3 App</h1>
            </div>
            <nav class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <RouterLink
                v-for="item in navigation"
                :key="item.path"
                :to="item.path"
                :class="[
                  isActive(item.path)
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                ]"
              >
                {{ item.name }}
              </RouterLink>
            </nav>
          </div>

          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              @click="toggleSidebar"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  v-if="!isSidebarOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="isSidebarOpen" class="sm:hidden">
        <div class="space-y-1 pb-3 pt-2">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            :class="[
              isActive(item.path)
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
              'block border-l-4 py-2 pl-3 pr-4 text-base font-medium',
            ]"
            @click="isSidebarOpen = false"
          >
            {{ item.name }}
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-gray-500">
          Built with Vue 3, TypeScript, and TailwindCSS
        </p>
      </div>
    </footer>
  </div>
</template>

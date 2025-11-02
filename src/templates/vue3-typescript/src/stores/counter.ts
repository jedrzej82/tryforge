import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Counter Store')

  // Getters
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)

  // Actions
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function incrementBy(amount: number) {
    count.value += amount
  }

  function reset() {
    count.value = 0
  }

  async function incrementAsync() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    count.value++
  }

  return {
    // State
    count,
    name,
    // Getters
    doubleCount,
    isEven,
    // Actions
    increment,
    decrement,
    incrementBy,
    reset,
    incrementAsync,
  }
})

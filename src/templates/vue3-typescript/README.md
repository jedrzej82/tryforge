# Vue 3 + TypeScript Template

A production-ready Vue 3 template with TypeScript, Composition API, Pinia, and TailwindCSS.

## Features

- **Vue 3.4+** - Latest Vue 3 with Composition API
- **TypeScript 5** - Strict type checking enabled
- **Composition API** - Modern `<script setup>` syntax
- **Vite** - Lightning-fast build tooling
- **Vue Router 4** - Type-safe routing
- **Pinia** - Intuitive state management
- **TailwindCSS** - Utility-first CSS framework
- **VueUse** - Collection of essential Vue Composition Utilities
- **Vitest** - Blazing fast unit testing
- **ESLint + Prettier** - Code quality and formatting

## Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/         # Static assets and styles
│   └── styles/
│       └── main.css
├── components/     # Reusable Vue components
│   ├── Button.vue
│   ├── Card.vue
│   └── Layout.vue
├── composables/    # Composition API functions
│   ├── useAsync.ts
│   └── useFetch.ts
├── router/         # Vue Router configuration
│   └── index.ts
├── stores/         # Pinia stores
│   └── counter.ts
├── types/          # TypeScript type definitions
│   └── index.ts
├── utils/          # Utility functions
│   └── helpers.ts
├── views/          # Route views/pages
│   ├── Home.vue
│   ├── About.vue
│   └── Dashboard.vue
├── App.vue         # Root component
├── main.ts         # Application entry point
└── vite-env.d.ts   # Vite type declarations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Lint and fix files |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Type check without emitting files |

## TypeScript

This template uses TypeScript strict mode for maximum type safety:

```typescript
// Strict mode enabled in tsconfig.json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

### Type-Safe Components

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User } from '@/types'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

interface Emits {
  (e: 'update', value: number): void
  (e: 'submit', user: User): void
}

const emit = defineEmits<Emits>()
</script>
```

## State Management

Uses Pinia with setup store syntax:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  function login(userData: User) {
    user.value = userData
  }

  function logout() {
    user.value = null
  }

  return { user, isAuthenticated, login, logout }
})
```

## Composables

### useAsync

Handle async operations with loading and error states:

```typescript
import { useAsync } from '@/composables/useAsync'

const { data, loading, error, execute } = useAsync(async () => {
  const response = await fetch('/api/data')
  return response.json()
})

// Execute the async function
await execute()
```

### useFetch

Make HTTP requests with automatic state management:

```typescript
import { useFetch } from '@/composables/useFetch'

const { data, loading, error, execute } = useFetch<User[]>('/api/users', {
  immediate: true,
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error)
})
```

## Routing

Type-safe routing with Vue Router 4:

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigate with type safety
router.push({ name: 'dashboard', params: { id: '123' } })

// Access route params with types
const route = useRoute()
const id = route.params.id as string
```

## Styling

This template uses TailwindCSS with custom configuration. Utility classes are defined in `src/assets/styles/main.css`:

```css
@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-lg font-medium
           transition-colors focus-visible:outline-none;
  }

  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700;
  }
}
```

## Testing

Uses Vitest for unit testing:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button.vue'

describe('Button', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' }
    })
    expect(wrapper.text()).toContain('Click me')
  })
})
```

## Code Quality

### ESLint

Configured with Vue 3, TypeScript, and Prettier:

```bash
npm run lint
```

### Prettier

Automatically formats code:

```bash
npm run format
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=My App
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

## Best Practices

1. **Use TypeScript strictly** - Enable strict mode and define proper types
2. **Component composition** - Break down large components into smaller, reusable ones
3. **Composables for logic** - Extract reusable logic into composables
4. **Type your props and emits** - Always define proper TypeScript interfaces
5. **Use Pinia for global state** - Keep component state local when possible
6. **Write tests** - Test critical functionality with Vitest
7. **Follow Vue 3 patterns** - Use Composition API and `<script setup>`

## Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The build output will be in the `dist` directory, ready to be deployed to any static hosting service.

## Browser Support

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## License

MIT

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [VueUse Documentation](https://vueuse.org/)

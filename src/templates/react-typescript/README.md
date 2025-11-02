# React + TypeScript Template

A production-ready React application template with TypeScript, Vite, TailwindCSS, and modern development tools.

## Features

- **React 18** - Latest React with concurrent features
- **TypeScript 5** - Strict type checking for better code quality
- **Vite** - Lightning-fast HMR and optimized builds
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing with TypeScript
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Production-Ready** - Optimized build configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (with TypeScript compilation)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Layout.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
├── hooks/            # Custom React hooks
│   ├── useAsync.ts
│   └── useFetch.ts
├── pages/            # Page components
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   └── NotFoundPage.tsx
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   └── helpers.ts
├── styles/           # Global styles
│   └── index.css
├── App.tsx           # Main app component
├── main.tsx          # App entry point
└── vite-env.d.ts     # Vite environment types
```

## Component Examples

### Button Component

```tsx
import Button from '@/components/Button';

<Button variant="primary" size="lg" loading={false}>
  Click Me
</Button>
```

### Card Component

```tsx
import Card from '@/components/Card';

<Card hover>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content</p>
  </Card.Body>
  <Card.Footer>
    <button>Action</button>
  </Card.Footer>
</Card>
```

### Custom Hooks

```tsx
import { useFetch } from '@/hooks/useFetch';

const { data, loading, error, refetch } = useFetch<User[]>('/api/users');
```

## TypeScript Configuration

This template uses strict TypeScript configuration:

- Strict mode enabled
- No implicit any
- No unused locals/parameters
- Exact optional property types
- Path aliases configured (`@/components`, `@/hooks`, etc.)

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Environment variables must be prefixed with `VITE_` to be accessible in the client:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=My App
```

Access in code:

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
```

## Best Practices

1. **Type Safety** - Always define proper types, avoid `any`
2. **Component Composition** - Break down complex components into smaller ones
3. **Custom Hooks** - Extract reusable logic into custom hooks
4. **Error Handling** - Use ErrorBoundary for graceful error handling
5. **Loading States** - Always handle loading and error states
6. **Accessibility** - Include ARIA attributes where needed
7. **Code Organization** - Follow the established folder structure
8. **Path Aliases** - Use `@/` imports for cleaner import statements

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed

## License

MIT

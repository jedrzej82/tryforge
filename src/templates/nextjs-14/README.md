# Next.js 14 Template

A modern, production-ready Next.js 14 application template with App Router, TypeScript, and Server Components.

## Features

- **Next.js 14** - Latest version with App Router
- **TypeScript** - Full type safety
- **Server Components** - React Server Components by default
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting and formatting
- **API Routes** - Built-in API routes with type safety
- **SEO Optimized** - Metadata API for optimal SEO
- **Performance** - Image and font optimization out of the box

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create a `.env.local` file:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── app/                    # App Router directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── loading.tsx        # Loading UI
│   ├── error.tsx          # Error UI
│   ├── not-found.tsx      # 404 page
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── blog/              # Blog pages
├── components/            # React components
│   ├── ui/               # UI components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
├── types/                # TypeScript types
├── public/               # Static files
└── ...config files
```

## Key Concepts

### Server Components vs Client Components

By default, all components in the App Router are Server Components. Use the `'use client'` directive at the top of a file to create a Client Component.

**Server Components:**
- Run on the server
- Can directly access backend resources
- Zero bundle size
- Cannot use browser APIs or React hooks

**Client Components:**
- Run on the client
- Can use React hooks (useState, useEffect, etc.)
- Can handle user interactions
- Add to JavaScript bundle size

### Data Fetching

Server Components can be async and fetch data directly:

```typescript
async function Page() {
  const data = await fetch('https://api.example.com/data')
  const json = await data.json()

  return <div>{json.title}</div>
}
```

### Metadata API

Export metadata from any page or layout for SEO:

```typescript
export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
}
```

### Route Handlers (API Routes)

Create API endpoints in the `app/api` directory:

```typescript
// app/api/hello/route.ts
export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello World' })
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
```

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

### Other Platforms

This template can be deployed to any platform that supports Node.js:

- Build the application: `npm run build`
- Start the server: `npm run start`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

MIT

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Server Component - can be async
async function ServerDataComponent() {
  // Simulate data fetching
  await new Promise((resolve) => setTimeout(resolve, 100))

  return (
    <div className="rounded-lg bg-blue-50 p-4">
      <h3 className="font-semibold text-blue-900">Server Component Data</h3>
      <p className="mt-2 text-sm text-blue-700">
        This data was fetched on the server at {new Date().toLocaleTimeString()}
      </p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Next.js 14
          </span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          A modern application with App Router, TypeScript, and Server Components.
          Built with performance and developer experience in mind.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/dashboard">
            <Button>Get Started</Button>
          </Link>
          <Link href="/blog">
            <Button variant="outline">View Blog</Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mt-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Features
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            title="App Router"
            description="Built with Next.js 14 App Router for better performance and developer experience."
          />
          <Card
            title="TypeScript"
            description="Fully typed with TypeScript 5 for type safety and better IDE support."
          />
          <Card
            title="Server Components"
            description="React Server Components by default for optimal performance and smaller bundles."
          />
          <Card
            title="Tailwind CSS"
            description="Styled with Tailwind CSS for rapid UI development and consistent design."
          />
          <Card
            title="API Routes"
            description="Built-in API routes with type-safe request and response handling."
          />
          <Card
            title="SEO Optimized"
            description="Metadata API for SEO optimization with OpenGraph and Twitter cards."
          />
        </div>
      </div>

      {/* Server Component Example */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Server Components in Action
        </h2>
        <div className="mt-6">
          <Suspense fallback={
            <div className="rounded-lg bg-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          }>
            <ServerDataComponent />
          </Suspense>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <p className="mt-4 text-lg opacity-90">
          Explore the dashboard or read our blog to learn more.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="secondary">Go to Dashboard</Button>
          </Link>
          <Link href="/api/hello" target="_blank">
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Test API
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

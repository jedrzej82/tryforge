import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest blog posts and articles',
}

// Simulated blog posts data
const blogPosts = [
  {
    slug: 'getting-started-with-nextjs-14',
    title: 'Getting Started with Next.js 14',
    description: 'Learn how to build modern web applications with Next.js 14 and the new App Router.',
    date: '2024-01-15',
    author: 'John Doe',
    readTime: '5 min read',
  },
  {
    slug: 'server-components-explained',
    title: 'React Server Components Explained',
    description: 'A deep dive into React Server Components and how they improve performance.',
    date: '2024-01-10',
    author: 'Jane Smith',
    readTime: '8 min read',
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Next.js',
    description: 'Essential TypeScript patterns and best practices for building type-safe applications.',
    date: '2024-01-05',
    author: 'John Doe',
    readTime: '6 min read',
  },
  {
    slug: 'optimizing-next-app',
    title: 'Optimizing Your Next.js Application',
    description: 'Performance optimization techniques for Next.js applications.',
    date: '2024-01-01',
    author: 'Jane Smith',
    readTime: '10 min read',
  },
]

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Blog
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Thoughts, tutorials, and insights about web development
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group"
          >
            <article className="rounded-lg border bg-white p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4">
                <time className="text-sm text-gray-500">
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900 group-hover:text-blue-600">
                {post.title}
              </h2>
              <p className="mb-4 text-gray-600">{post.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{post.author}</span>
                <span>{post.readTime}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}

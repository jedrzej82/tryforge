import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'

// Type for blog post
interface BlogPost {
  slug: string
  title: string
  description: string
  content: string
  date: string
  author: string
  readTime: string
}

// Simulated blog posts database
const blogPosts: Record<string, BlogPost> = {
  'getting-started-with-nextjs-14': {
    slug: 'getting-started-with-nextjs-14',
    title: 'Getting Started with Next.js 14',
    description: 'Learn how to build modern web applications with Next.js 14 and the new App Router.',
    content: `
      Next.js 14 introduces significant improvements to the App Router, making it the recommended way to build Next.js applications.

      ## What's New

      The App Router brings several key features:
      - Server Components by default
      - Improved data fetching with async/await
      - Better streaming and suspense support
      - Enhanced routing with layouts

      ## Getting Started

      To create a new Next.js 14 project, run:

      \`\`\`bash
      npx create-next-app@latest my-app
      \`\`\`

      This will set up a new project with TypeScript, ESLint, and Tailwind CSS.

      ## Server Components

      By default, all components in the App Router are Server Components. This means they run on the server and don't add to your JavaScript bundle size.

      To use Client Components, add the 'use client' directive at the top of your file.
    `,
    date: '2024-01-15',
    author: 'John Doe',
    readTime: '5 min read',
  },
  'server-components-explained': {
    slug: 'server-components-explained',
    title: 'React Server Components Explained',
    description: 'A deep dive into React Server Components and how they improve performance.',
    content: `
      React Server Components represent a fundamental shift in how we think about React applications.

      ## Benefits

      - Zero bundle size for server components
      - Direct database access
      - Improved initial page load
      - Better code splitting

      ## When to Use Server Components

      Use Server Components when:
      - Fetching data from a database
      - Accessing backend resources directly
      - Keeping sensitive information on the server

      Use Client Components when:
      - Adding interactivity and event listeners
      - Using React hooks like useState, useEffect
      - Using browser-only APIs
    `,
    date: '2024-01-10',
    author: 'Jane Smith',
    readTime: '8 min read',
  },
  'typescript-best-practices': {
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Next.js',
    description: 'Essential TypeScript patterns and best practices for building type-safe applications.',
    content: `
      TypeScript brings type safety to your Next.js applications. Here are some best practices.

      ## Type Your Props

      Always define types for your component props:

      \`\`\`typescript
      interface ButtonProps {
        children: React.ReactNode
        onClick?: () => void
      }

      export function Button({ children, onClick }: ButtonProps) {
        return <button onClick={onClick}>{children}</button>
      }
      \`\`\`

      ## Use Strict Mode

      Enable strict mode in your tsconfig.json for better type checking.
    `,
    date: '2024-01-05',
    author: 'John Doe',
    readTime: '6 min read',
  },
  'optimizing-next-app': {
    slug: 'optimizing-next-app',
    title: 'Optimizing Your Next.js Application',
    description: 'Performance optimization techniques for Next.js applications.',
    content: `
      Performance is crucial for user experience. Here's how to optimize your Next.js app.

      ## Image Optimization

      Use the Next.js Image component for automatic optimization:

      \`\`\`typescript
      import Image from 'next/image'

      <Image src="/photo.jpg" width={500} height={300} alt="Photo" />
      \`\`\`

      ## Code Splitting

      Next.js automatically code splits your application. Use dynamic imports for heavy components:

      \`\`\`typescript
      const DynamicComponent = dynamic(() => import('./HeavyComponent'))
      \`\`\`
    `,
    date: '2024-01-01',
    author: 'Jane Smith',
    readTime: '10 min read',
  },
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }))
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = blogPosts[params.slug]

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = blogPosts[params.slug]

  if (!post) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/blog">
        <Button variant="outline" className="mb-8">
          ← Back to Blog
        </Button>
      </Link>

      <article>
        <header className="mb-8">
          <time className="text-sm text-gray-500">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            {post.title}
          </h1>
          <p className="mt-4 text-xl text-gray-600">{post.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{post.author}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-12 border-t pt-8">
        <Link href="/blog">
          <Button variant="outline">← Back to all posts</Button>
        </Link>
      </div>
    </div>
  )
}

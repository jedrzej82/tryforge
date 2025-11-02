import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">Page not found</h2>
        <p className="mt-2 text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
          <Link href="/blog">
            <Button variant="outline">View blog</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

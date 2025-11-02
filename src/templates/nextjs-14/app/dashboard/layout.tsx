import { ReactNode } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to your dashboard. This is a nested layout example.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

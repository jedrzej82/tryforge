import { Suspense } from 'react'
import { Card } from '@/components/ui/Card'

// Simulated async data fetching
async function fetchDashboardStats() {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    totalUsers: 1234,
    activeUsers: 567,
    revenue: 89012,
    growth: 23.5,
  }
}

async function DashboardStats() {
  const stats = await fetchDashboardStats()

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Total Users"
        description={stats.totalUsers.toLocaleString()}
      />
      <Card
        title="Active Users"
        description={stats.activeUsers.toLocaleString()}
      />
      <Card
        title="Revenue"
        description={`$${stats.revenue.toLocaleString()}`}
      />
      <Card
        title="Growth"
        description={`${stats.growth}%`}
      />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Overview
        </h2>
        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats />
        </Suspense>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="rounded-lg border bg-white p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-gray-900">Activity {i + 1}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(Date.now() - i * 3600000).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

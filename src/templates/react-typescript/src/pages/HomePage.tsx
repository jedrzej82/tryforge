import { useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useFetch } from '@/hooks/useFetch';
import type { User } from '@/types';

/**
 * Home Page - Demonstrates component usage and hooks
 */
function HomePage() {
  const [count, setCount] = useState(0);
  const [showExample, setShowExample] = useState(false);

  // Example API call (will fail unless you have a real endpoint)
  const { data, loading, error } = useFetch<User[]>(
    'https://jsonplaceholder.typicode.com/users?_limit=3',
    {},
    []
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to React + TypeScript
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          A production-ready template with Vite, TailwindCSS, and modern development tools.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">TypeScript</h3>
          </Card.Header>
          <Card.Body>
            <p className="text-gray-600">
              Strict type checking with TypeScript 5 for better code quality and developer
              experience.
            </p>
          </Card.Body>
        </Card>

        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Vite</h3>
          </Card.Header>
          <Card.Body>
            <p className="text-gray-600">
              Lightning-fast HMR and optimized builds with Vite for the best development experience.
            </p>
          </Card.Body>
        </Card>

        <Card hover>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">TailwindCSS</h3>
          </Card.Header>
          <Card.Body>
            <p className="text-gray-600">
              Utility-first CSS framework for rapid UI development with custom design system.
            </p>
          </Card.Body>
        </Card>
      </section>

      {/* Interactive Example */}
      <section>
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-gray-900">Interactive Example</h3>
          </Card.Header>
          <Card.Body>
            <div className="flex items-center gap-4 mb-4">
              <p className="text-gray-700">Counter: {count}</p>
              <Button onClick={() => setCount(count + 1)} size="sm">
                Increment
              </Button>
              <Button onClick={() => setCount(count - 1)} variant="secondary" size="sm">
                Decrement
              </Button>
              <Button onClick={() => setCount(0)} variant="danger" size="sm">
                Reset
              </Button>
            </div>
            <Button onClick={() => setShowExample(!showExample)} variant="outline" fullWidth>
              {showExample ? 'Hide' : 'Show'} API Example
            </Button>
          </Card.Body>
        </Card>
      </section>

      {/* API Example */}
      {showExample && (
        <section>
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">API Data Example</h3>
            </Card.Header>
            <Card.Body>
              {loading && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading users...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">Error: {error.message}</p>
                </div>
              )}

              {data && (
                <div className="space-y-4">
                  {data.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </section>
      )}
    </div>
  );
}

export default HomePage;

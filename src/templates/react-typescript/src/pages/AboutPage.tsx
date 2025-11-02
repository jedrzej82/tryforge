import Card from '@/components/Card';

/**
 * About Page - Information about the template
 */
function AboutPage() {
  const features = [
    {
      title: 'React 18',
      description: 'Latest React with concurrent features and automatic batching',
    },
    {
      title: 'TypeScript 5',
      description: 'Strict type checking for better code quality and IntelliSense',
    },
    {
      title: 'Vite',
      description: 'Next-generation frontend tooling with instant HMR',
    },
    {
      title: 'TailwindCSS',
      description: 'Utility-first CSS framework for rapid UI development',
    },
    {
      title: 'React Router',
      description: 'Client-side routing with TypeScript support',
    },
    {
      title: 'ESLint & Prettier',
      description: 'Code quality and formatting tools configured and ready',
    },
  ];

  const bestPractices = [
    'Strict TypeScript configuration with no implicit any',
    'Component composition with proper prop typing',
    'Custom hooks for reusable logic',
    'Error boundaries for graceful error handling',
    'Loading states and async operations',
    'Accessible components with ARIA attributes',
    'Path aliases for cleaner imports',
    'Production-ready build configuration',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About This Template</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A production-ready React + TypeScript template built with modern tools and best practices
          for professional web development.
        </p>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} hover>
              <Card.Body>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      {/* Best Practices */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices Included</h2>
        <Card>
          <Card.Body>
            <ul className="space-y-3">
              {bestPractices.map((practice, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{practice}</span>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </section>

      {/* Project Structure */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Structure</h2>
        <Card>
          <Card.Body>
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {`src/
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
└── vite-env.d.ts     # Vite environment types`}
            </pre>
          </Card.Body>
        </Card>
      </section>

      {/* Getting Started */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
        <Card>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Development</h3>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded">npm run dev</code>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Build</h3>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded">npm run build</code>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Type Check</h3>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded">
                  npm run type-check
                </code>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Lint</h3>
                <code className="block bg-gray-900 text-gray-100 p-3 rounded">
                  npm run lint:fix
                </code>
              </div>
            </div>
          </Card.Body>
        </Card>
      </section>
    </div>
  );
}

export default AboutPage;

/**
 * TryForge CLI - Prompt Choices
 * Reusable choice lists for interactive prompts
 */

const chalk = require('chalk');

/**
 * Template choices with descriptions
 */
const TEMPLATE_CHOICES = [
  {
    name: `${chalk.cyan('React 18 + TypeScript + Vite')} - Modern React with Vite bundler`,
    value: 'react-vite-ts',
    short: 'React + Vite + TS',
    description: 'Blazing fast React 18 development with TypeScript and Vite',
    tags: ['frontend', 'react', 'typescript', 'vite']
  },
  {
    name: `${chalk.cyan('Next.js 14 with App Router')} - Full-stack React framework`,
    value: 'nextjs-14-app',
    short: 'Next.js 14',
    description: 'Production-ready Next.js with App Router, Server Components, and RSC',
    tags: ['fullstack', 'react', 'nextjs', 'ssr']
  },
  {
    name: `${chalk.cyan('Express + TypeScript Backend')} - Node.js REST API`,
    value: 'express-ts-api',
    short: 'Express API',
    description: 'RESTful API with Express, TypeScript, and best practices',
    tags: ['backend', 'nodejs', 'express', 'api']
  },
  {
    name: `${chalk.cyan('Vue 3 + TypeScript + Vite')} - Vue Composition API`,
    value: 'vue-vite-ts',
    short: 'Vue 3 + Vite',
    description: 'Modern Vue 3 with Composition API, TypeScript, and Vite',
    tags: ['frontend', 'vue', 'typescript', 'vite']
  },
  {
    name: `${chalk.cyan('Full-Stack MERN')} - MongoDB + Express + React + Node`,
    value: 'mern-stack',
    short: 'MERN Stack',
    description: 'Complete MERN stack with authentication and database setup',
    tags: ['fullstack', 'react', 'mongodb', 'express']
  },
  {
    name: `${chalk.cyan('Full-Stack PERN')} - PostgreSQL + Express + React + Node`,
    value: 'pern-stack',
    short: 'PERN Stack',
    description: 'Complete PERN stack with PostgreSQL and Prisma ORM',
    tags: ['fullstack', 'react', 'postgresql', 'express']
  },
  {
    name: `${chalk.cyan('Svelte + SvelteKit')} - Lightweight modern framework`,
    value: 'sveltekit',
    short: 'SvelteKit',
    description: 'Fast and efficient Svelte with SvelteKit full-stack framework',
    tags: ['fullstack', 'svelte', 'sveltekit']
  },
  {
    name: `${chalk.cyan('NestJS Backend')} - Enterprise Node.js framework`,
    value: 'nestjs-api',
    short: 'NestJS',
    description: 'Scalable server-side applications with NestJS and TypeScript',
    tags: ['backend', 'nodejs', 'nestjs', 'typescript']
  }
];

/**
 * Database choices
 */
const DATABASE_CHOICES = [
  {
    name: `${chalk.blue('PostgreSQL')} - Powerful open-source relational database`,
    value: 'postgresql',
    short: 'PostgreSQL',
    description: 'Advanced SQL database with strong ACID compliance',
    defaultPort: 5432,
    connectionExample: 'postgresql://user:password@localhost:5432/dbname'
  },
  {
    name: `${chalk.blue('MySQL')} - Popular open-source relational database`,
    value: 'mysql',
    short: 'MySQL',
    description: 'Fast and reliable SQL database',
    defaultPort: 3306,
    connectionExample: 'mysql://user:password@localhost:3306/dbname'
  },
  {
    name: `${chalk.blue('MongoDB')} - Flexible NoSQL document database`,
    value: 'mongodb',
    short: 'MongoDB',
    description: 'Scalable document-oriented NoSQL database',
    defaultPort: 27017,
    connectionExample: 'mongodb://localhost:27017/dbname'
  },
  {
    name: `${chalk.blue('SQLite')} - Lightweight file-based database`,
    value: 'sqlite',
    short: 'SQLite',
    description: 'Zero-configuration serverless database',
    defaultPort: null,
    connectionExample: './database.sqlite'
  },
  {
    name: `${chalk.blue('Redis')} - In-memory data structure store`,
    value: 'redis',
    short: 'Redis',
    description: 'High-performance caching and session storage',
    defaultPort: 6379,
    connectionExample: 'redis://localhost:6379'
  },
  {
    name: `${chalk.gray('None')} - Skip database setup`,
    value: 'none',
    short: 'None',
    description: 'Configure database later',
    defaultPort: null,
    connectionExample: null
  }
];

/**
 * Authentication method choices
 */
const AUTH_CHOICES = [
  {
    name: `${chalk.green('JWT')} - JSON Web Tokens (stateless)`,
    value: 'jwt',
    short: 'JWT',
    description: 'Token-based authentication with access and refresh tokens',
    features: ['Access tokens', 'Refresh tokens', 'Password hashing', 'Token validation']
  },
  {
    name: `${chalk.green('OAuth 2.0')} - Third-party authentication`,
    value: 'oauth',
    short: 'OAuth',
    description: 'Social login with Google, GitHub, Facebook, etc.',
    features: ['Google OAuth', 'GitHub OAuth', 'Social profiles', 'Secure tokens']
  },
  {
    name: `${chalk.green('Session-based')} - Traditional server sessions`,
    value: 'session',
    short: 'Session',
    description: 'Cookie-based session authentication with Redis',
    features: ['Session cookies', 'Redis storage', 'CSRF protection', 'Secure cookies']
  },
  {
    name: `${chalk.green('Passport.js')} - Flexible authentication middleware`,
    value: 'passport',
    short: 'Passport',
    description: 'Multiple strategies (Local, JWT, OAuth)',
    features: ['Multiple strategies', 'Local auth', 'Social login', 'Extensible']
  },
  {
    name: `${chalk.gray('None')} - Skip authentication`,
    value: 'none',
    short: 'None',
    description: 'Add authentication later',
    features: []
  }
];

/**
 * Testing framework choices
 */
const TESTING_CHOICES = [
  {
    name: `${chalk.yellow('Jest')} - Delightful JavaScript testing`,
    value: 'jest',
    short: 'Jest',
    description: 'Zero-config testing framework with great DX',
    features: ['Snapshot testing', 'Code coverage', 'Mocking', 'Watch mode']
  },
  {
    name: `${chalk.yellow('Vitest')} - Vite-native test framework`,
    value: 'vitest',
    short: 'Vitest',
    description: 'Blazing fast unit tests powered by Vite',
    features: ['Vite integration', 'Fast execution', 'Jest compatible', 'ESM support']
  },
  {
    name: `${chalk.yellow('Mocha + Chai')} - Flexible testing combo`,
    value: 'mocha',
    short: 'Mocha',
    description: 'Feature-rich testing framework with assertion library',
    features: ['Flexible', 'Async support', 'Multiple reporters', 'Extensible']
  },
  {
    name: `${chalk.yellow('Playwright')} - E2E testing framework`,
    value: 'playwright',
    short: 'Playwright',
    description: 'Modern end-to-end testing for web apps',
    features: ['Cross-browser', 'Auto-wait', 'Screenshots', 'Trace viewer']
  },
  {
    name: `${chalk.gray('None')} - Skip testing setup`,
    value: 'none',
    short: 'None',
    description: 'Add tests later',
    features: []
  }
];

/**
 * CSS/Styling framework choices
 */
const STYLING_CHOICES = [
  {
    name: `${chalk.magenta('Tailwind CSS')} - Utility-first CSS framework`,
    value: 'tailwind',
    short: 'Tailwind',
    description: 'Modern utility-first CSS with JIT compiler',
    features: ['Utility classes', 'JIT mode', 'Dark mode', 'Responsive design']
  },
  {
    name: `${chalk.magenta('Bootstrap 5')} - Popular component library`,
    value: 'bootstrap',
    short: 'Bootstrap',
    description: 'Battle-tested responsive framework',
    features: ['Components', 'Grid system', 'Utilities', 'Icons']
  },
  {
    name: `${chalk.magenta('Material-UI (MUI)')} - React component library`,
    value: 'mui',
    short: 'Material-UI',
    description: 'Google Material Design for React',
    features: ['Material Design', 'Components', 'Theming', 'Accessibility']
  },
  {
    name: `${chalk.magenta('Chakra UI')} - Simple modular components`,
    value: 'chakra',
    short: 'Chakra UI',
    description: 'Accessible React component library',
    features: ['Accessible', 'Composable', 'Dark mode', 'TypeScript']
  },
  {
    name: `${chalk.magenta('Styled Components')} - CSS-in-JS solution`,
    value: 'styled-components',
    short: 'Styled Components',
    description: 'Component-scoped styling with tagged templates',
    features: ['CSS-in-JS', 'Scoped styles', 'Dynamic props', 'SSR support']
  },
  {
    name: `${chalk.magenta('Sass/SCSS')} - CSS preprocessor`,
    value: 'sass',
    short: 'Sass',
    description: 'Powerful CSS extension language',
    features: ['Variables', 'Nesting', 'Mixins', 'Modules']
  },
  {
    name: `${chalk.magenta('Plain CSS')} - Vanilla CSS`,
    value: 'css',
    short: 'CSS',
    description: 'Modern CSS with CSS modules',
    features: ['CSS Modules', 'PostCSS', 'Autoprefixer', 'Clean']
  }
];

/**
 * Deployment platform choices
 */
const DEPLOYMENT_CHOICES = [
  {
    name: `${chalk.cyan('Vercel')} - Frontend cloud platform`,
    value: 'vercel',
    short: 'Vercel',
    description: 'Zero-config deployment for Next.js and more',
    features: ['Edge network', 'Serverless functions', 'Auto SSL', 'Preview deployments'],
    bestFor: ['Next.js', 'React', 'Vue', 'Static sites']
  },
  {
    name: `${chalk.cyan('Netlify')} - Modern web platform`,
    value: 'netlify',
    short: 'Netlify',
    description: 'Deploy and host modern web projects',
    features: ['CDN', 'Serverless functions', 'Forms', 'Split testing'],
    bestFor: ['Static sites', 'JAMstack', 'React', 'Vue']
  },
  {
    name: `${chalk.cyan('Railway')} - Full-stack deployment`,
    value: 'railway',
    short: 'Railway',
    description: 'Deploy backends, databases, and more',
    features: ['Databases', 'Docker support', 'Auto-scaling', 'Free tier'],
    bestFor: ['Node.js', 'Databases', 'Docker', 'Full-stack']
  },
  {
    name: `${chalk.cyan('Render')} - Unified cloud platform`,
    value: 'render',
    short: 'Render',
    description: 'Build, deploy, and scale apps',
    features: ['Static sites', 'Web services', 'Databases', 'Cron jobs'],
    bestFor: ['Full-stack', 'APIs', 'Databases', 'Static sites']
  },
  {
    name: `${chalk.cyan('Docker')} - Container configuration`,
    value: 'docker',
    short: 'Docker',
    description: 'Create Docker containers for deployment',
    features: ['Containerization', 'Docker Compose', 'Multi-stage builds', 'Portable'],
    bestFor: ['Any platform', 'Self-hosted', 'Kubernetes', 'Custom deployment']
  },
  {
    name: `${chalk.gray('None')} - Skip deployment config`,
    value: 'none',
    short: 'None',
    description: 'Configure deployment later',
    features: [],
    bestFor: []
  }
];

/**
 * Package manager choices
 */
const PACKAGE_MANAGER_CHOICES = [
  {
    name: 'npm - Node Package Manager (default)',
    value: 'npm',
    short: 'npm',
    lockfile: 'package-lock.json'
  },
  {
    name: 'yarn - Fast, reliable dependency management',
    value: 'yarn',
    short: 'Yarn',
    lockfile: 'yarn.lock'
  },
  {
    name: 'pnpm - Fast, disk-efficient package manager',
    value: 'pnpm',
    short: 'pnpm',
    lockfile: 'pnpm-lock.yaml'
  }
];

/**
 * Feature choices (checkbox selection)
 */
const FEATURE_CHOICES = [
  {
    name: 'Authentication & Authorization',
    value: 'auth',
    checked: true,
    description: 'User registration, login, and access control'
  },
  {
    name: 'Database & ORM',
    value: 'database',
    checked: true,
    description: 'Database setup with migrations and seeding'
  },
  {
    name: 'API Documentation',
    value: 'api-docs',
    checked: true,
    description: 'Swagger/OpenAPI documentation'
  },
  {
    name: 'Testing Setup',
    value: 'testing',
    checked: true,
    description: 'Unit, integration, and E2E tests'
  },
  {
    name: 'Email Service',
    value: 'email',
    checked: false,
    description: 'Email sending with templates'
  },
  {
    name: 'File Upload',
    value: 'upload',
    checked: false,
    description: 'File upload with cloud storage'
  },
  {
    name: 'Real-time Updates',
    value: 'websocket',
    checked: false,
    description: 'WebSocket support with Socket.io'
  },
  {
    name: 'Caching',
    value: 'cache',
    checked: false,
    description: 'Redis caching layer'
  },
  {
    name: 'Task Queue',
    value: 'queue',
    checked: false,
    description: 'Background job processing'
  },
  {
    name: 'Logging & Monitoring',
    value: 'logging',
    checked: true,
    description: 'Application logging and error tracking'
  },
  {
    name: 'Docker Setup',
    value: 'docker',
    checked: true,
    description: 'Docker and Docker Compose configuration'
  },
  {
    name: 'CI/CD Pipeline',
    value: 'cicd',
    checked: false,
    description: 'GitHub Actions or GitLab CI'
  }
];

/**
 * Graphics style choices
 */
const GRAPHICS_STYLE_CHOICES = [
  {
    name: 'Modern - Clean, contemporary design',
    value: 'modern',
    short: 'Modern'
  },
  {
    name: 'Minimalist - Simple, focused aesthetics',
    value: 'minimalist',
    short: 'Minimalist'
  },
  {
    name: 'Professional - Business-oriented look',
    value: 'professional',
    short: 'Professional'
  },
  {
    name: 'Playful - Fun, energetic vibe',
    value: 'playful',
    short: 'Playful'
  },
  {
    name: 'Elegant - Sophisticated and refined',
    value: 'elegant',
    short: 'Elegant'
  }
];

/**
 * License choices
 */
const LICENSE_CHOICES = [
  {
    name: 'MIT - Permissive open source',
    value: 'MIT',
    short: 'MIT'
  },
  {
    name: 'Apache 2.0 - Permissive with patent grant',
    value: 'Apache-2.0',
    short: 'Apache 2.0'
  },
  {
    name: 'GPL 3.0 - Strong copyleft',
    value: 'GPL-3.0',
    short: 'GPL 3.0'
  },
  {
    name: 'ISC - Simplified permissive',
    value: 'ISC',
    short: 'ISC'
  },
  {
    name: 'Proprietary - All rights reserved',
    value: 'UNLICENSED',
    short: 'Proprietary'
  }
];

module.exports = {
  TEMPLATE_CHOICES,
  DATABASE_CHOICES,
  AUTH_CHOICES,
  TESTING_CHOICES,
  STYLING_CHOICES,
  DEPLOYMENT_CHOICES,
  PACKAGE_MANAGER_CHOICES,
  FEATURE_CHOICES,
  GRAPHICS_STYLE_CHOICES,
  LICENSE_CHOICES
};

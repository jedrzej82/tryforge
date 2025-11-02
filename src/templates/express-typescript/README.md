# Express + TypeScript Backend Template

A production-ready Express.js backend template with TypeScript, featuring a clean layered architecture, JWT authentication, Prisma ORM, comprehensive error handling, and testing setup.

## Features

- **TypeScript 5**: Full type safety with strict mode enabled
- **Express.js**: Fast, unopinionated web framework
- **Prisma**: Modern database ORM with type safety
- **JWT Authentication**: Secure token-based authentication
- **Layered Architecture**: Clean separation of concerns (Routes → Controllers → Services)
- **Request Validation**: Input validation with Joi
- **Error Handling**: Centralized error handling with custom error classes
- **Logging**: Winston logger with daily log rotation
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest with TypeScript support
- **Code Quality**: ESLint + Prettier configured

## Project Structure

```
.
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client setup
│   │   ├── env.ts       # Environment variables (type-safe)
│   │   └── logger.ts    # Winston logger setup
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication & authorization
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── models/          # Data models
│   │   └── user.model.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   └── users.service.ts
│   ├── types/           # TypeScript types
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   └── AsyncHandler.ts
│   ├── validators/      # Request validation schemas
│   │   └── user.validator.ts
│   ├── app.ts           # Express app setup
│   ├── server.ts        # Server startup & shutdown
│   └── index.ts         # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── tests/               # Test files
│   ├── setup.ts
│   ├── auth.test.ts
│   └── utils/
└── logs/                # Application logs (auto-generated)
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters-long
```

3. Set up the database:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database (optional)
npm run prisma:seed
```

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

### Production

Build and run for production:

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| GET | `/api/v1/auth/me` | Get current user | Private |
| POST | `/api/v1/auth/logout` | Logout user | Private |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/users` | Get all users (paginated) | Admin |
| GET | `/api/v1/users/:id` | Get user by ID | Private |
| PATCH | `/api/v1/users/:id` | Update user | Private |
| PATCH | `/api/v1/users/:id/password` | Change password | Private |
| DELETE | `/api/v1/users/:id` | Delete user | Admin |

### Example Requests

**Register a new user:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Get current user (requires authentication):**

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Architecture

### Layered Architecture

The application follows a clean layered architecture:

1. **Routes Layer**: Defines API endpoints and applies middleware
2. **Controllers Layer**: Handles HTTP requests and responses
3. **Services Layer**: Contains business logic and database operations
4. **Models Layer**: Data transformation and utilities

### Error Handling

The application uses a centralized error handling approach:

- **ApiError**: Custom error class with HTTP status codes
- **Error Middleware**: Catches all errors and formats responses
- **Async Handler**: Wraps async route handlers to catch errors

Example:

```typescript
throw ApiError.notFound('User not found');
throw ApiError.badRequest('Invalid input', validationErrors);
```

### Type Safety

All environment variables are validated and typed:

```typescript
import { env } from './config/env';

// TypeScript knows all the types!
const port = env.server.port; // number
const jwtSecret = env.jwt.secret; // string
```

### Authentication & Authorization

JWT-based authentication with access and refresh tokens:

```typescript
// Require authentication
router.get('/protected', authenticate, controller);

// Require specific role
router.get('/admin', authenticate, authorize('ADMIN'), controller);
```

## Testing

Run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Database

The template uses Prisma as the ORM. To work with the database:

```bash
# Open Prisma Studio (GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset

# Generate Prisma Client after schema changes
npm run prisma:generate
```

### Database Schema

The template includes a basic User model. Extend `prisma/schema.prisma` to add more models:

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

### Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
# Run TypeScript type checker
npm run type-check
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3000 |
| `API_PREFIX` | API route prefix | /api/v1 |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | Access token expiration | 7d |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | 30d |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |
| `BCRYPT_ROUNDS` | Bcrypt hashing rounds | 10 |

## Security Features

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **JWT**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable rounds
- **Input Validation**: Joi schemas for all inputs
- **SQL Injection Protection**: Prisma parameterized queries

## Logging

Winston logger with daily log rotation:

- **Console**: Colored output in development
- **Files**: Rotating log files in production
  - `combined-YYYY-MM-DD.log`: All logs
  - `error-YYYY-MM-DD.log`: Error logs only
  - `exceptions-YYYY-MM-DD.log`: Uncaught exceptions
  - `rejections-YYYY-MM-DD.log`: Unhandled promise rejections

## Deployment

### Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t my-api .
docker run -p 3000:3000 --env-file .env my-api
```

### Environment Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT secrets (generate with `openssl rand -base64 32`)
3. Configure proper CORS origins
4. Set up database connection pooling
5. Enable HTTPS/TLS
6. Configure reverse proxy (nginx/Apache)
7. Set up monitoring and logging

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Run linting and tests before committing

## License

MIT

## Support

For issues and questions, please open an issue on the repository.

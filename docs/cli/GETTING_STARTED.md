# Getting Started with TryForge CLI

Welcome to TryForge! This guide will help you get started with the Triple AI Application Framework.

## What is TryForge?

TryForge is an AI-powered development tool that helps you create production-ready applications using:
- **Claude AI** - Intelligent code generation and analysis
- **GitHub Spark** - Rapid prototyping and deployment
- **Pollinations AI** - Professional graphics generation

## Prerequisites

Before you begin, ensure you have:
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git (recommended)
- Claude API key from [Anthropic Console](https://console.anthropic.com)

## Installation

### Global Installation (Recommended)

```bash
npm install -g tryforge
```

### Local Installation

```bash
npm install tryforge
```

## Quick Start (5 Minutes)

### 1. Configure API Keys

Open the admin panel to configure your API keys:

```bash
tryforge admin
```

This will open a web interface where you can:
- Set your Claude API key
- Configure GitHub token (optional)
- Set up Pollinations AI (optional)

### 2. Create Your First App

Create a new application using natural language:

```bash
tryforge create "A personal blog with user authentication"
```

Or use explicit options:

```bash
tryforge create --framework react --database postgresql --auth jwt
```

Or use interactive mode (recommended for beginners):

```bash
tryforge create --interactive
```

### 3. Navigate to Your Project

```bash
cd my-blog
```

### 4. Start Development Server

```bash
tryforge preview
```

This starts a live preview with hot reload at http://localhost:3000

### 5. Make Changes

The preview will automatically reload as you make changes to your code.

## What Gets Created?

TryForge generates a complete, production-ready application:

```
my-app/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── api/            # API routes
│   ├── utils/          # Utilities
│   └── styles/         # Stylesheets
├── public/
│   └── images/         # Graphics and assets
├── tests/              # Test files
├── database/           # Database configuration
├── .env.example        # Environment variables template
├── package.json        # Dependencies
└── README.md           # Project documentation
```

### Features Included

- ✅ Frontend with your chosen framework
- ✅ Backend API with database integration
- ✅ Authentication system (JWT/OAuth/Session)
- ✅ Professional graphics (logo, favicon, etc.)
- ✅ Tests (unit, integration, e2e)
- ✅ Documentation
- ✅ Deployment configuration
- ✅ CI/CD setup
- ✅ Docker support

## Next Steps

### Learn the Basics

1. **Explore Examples**
   ```bash
   tryforge examples
   ```

2. **Read Guides**
   ```bash
   tryforge guide --list
   ```

3. **View All Commands**
   ```bash
   tryforge --help
   ```

### Common Tasks

#### Generate New Components

```bash
tryforge generate component "UserProfile with avatar and bio"
```

#### Auto-Generate Database Models

```bash
tryforge models:generate -d "Blog with posts, comments, and users"
```

#### Auto-Generate Graphics

```bash
tryforge graphics:generate -n "MyApp" --style modern
```

#### Run Tests

```bash
tryforge test all
```

#### Deploy to Production

```bash
tryforge deploy vercel
```

## Troubleshooting

### Common Issues

**Module not found**
```bash
npm install
```

**API key invalid**
```bash
tryforge admin
# Re-enter your API key
```

**Port already in use**
```bash
lsof -ti:3000 | xargs kill
```

### Get Help

- Run diagnostic: `tryforge doctor`
- Search help: `tryforge help --search <keyword>`
- View troubleshooting guide: `tryforge guide troubleshooting`
- GitHub Issues: https://github.com/jedrzej82/tryforge/issues
- Discussions: https://github.com/jedrzej82/tryforge/discussions

## Best Practices

### 1. Start with Interactive Mode

If you're new to TryForge, use interactive mode:
```bash
tryforge create --interactive
```

### 2. Be Specific in Descriptions

When using natural language, be specific:
```bash
# Good
tryforge create "E-commerce store for handmade jewelry with Stripe payments"

# Less specific
tryforge create "online store"
```

### 3. Review Generated Code

Always review and understand the generated code before deploying.

### 4. Use Version Control

Initialize git and commit regularly:
```bash
git init
git add .
git commit -m "Initial commit"
```

### 5. Run Tests Frequently

Use watch mode during development:
```bash
tryforge test --watch
```

## What's Next?

Now that you have TryForge installed and running, explore these topics:

- [Commands Reference](COMMANDS.md) - Complete command documentation
- [Examples](EXAMPLES.md) - Real-world examples
- [Best Practices](BEST_PRACTICES.md) - Tips and recommendations
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions

## Resources

- 📚 [Full Documentation](https://docs.tryforge.dev)
- 💬 [GitHub Discussions](https://github.com/jedrzej82/tryforge/discussions)
- 🐛 [Report Issues](https://github.com/jedrzej82/tryforge/issues)
- 📺 [Video Tutorials](https://youtube.com/tryforge)
- 💡 [Blog](https://blog.tryforge.dev)

---

**Happy Coding with TryForge! 🔥**

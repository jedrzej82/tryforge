# TryForge CLI - Frequently Asked Questions

## General Questions

### What is TryForge?

TryForge is a Triple AI Application Framework that uses Claude AI, GitHub Spark, and Pollinations AI to help you create production-ready applications quickly.

### Is TryForge free?

TryForge CLI is open source and free. However, you need:
- Claude API key (paid - https://console.anthropic.com)
- GitHub account (free)
- Pollinations AI is free

### What can I build with TryForge?

- Web applications (React, Vue, Angular, Svelte)
- REST APIs (Express, Fastify)
- Full-stack applications (Next.js)
- Mobile backends
- Admin dashboards
- E-commerce stores
- Blogs and CMSs

### How does AI generation work?

TryForge uses:
- **Claude AI** for code generation and analysis
- **Pollinations AI** for graphics generation
- **GitHub Spark** for rapid prototyping

You describe what you want, and AI generates the code.

## Installation & Setup

### What are the system requirements?

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git (recommended)
- 4GB RAM minimum
- macOS, Linux, or Windows

### How do I get an API key?

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Create a new API key
4. Run `tryforge admin` to configure

### Can I use TryForge without an API key?

No, you need a Claude API key for code generation. However, you can:
- Use free trial credits
- Use templates without generation
- View examples and documentation

### How much does the API cost?

Claude API pricing varies. Check https://www.anthropic.com/pricing for current rates.

## Project Creation

### How long does it take to create an app?

- Simple app: 2-5 minutes
- Medium app: 5-15 minutes
- Complex app: 15-30 minutes

Depends on:
- Complexity of description
- Number of features
- Internet speed
- API response time

### Can I customize the generated code?

Yes! All generated code is fully editable. TryForge creates a starting point that you can customize.

### What frameworks are supported?

- **Frontend:** React, Vue, Angular, Svelte, Next.js
- **Backend:** Express, Fastify, NestJS
- **Database:** PostgreSQL, MySQL, MongoDB, SQLite
- **Styling:** CSS, SCSS, Tailwind, styled-components

### Can I add my own templates?

Currently, you can modify existing templates but not add new ones. Custom template support is planned.

## Database & Models

### What is auto-generate models?

TryForge can analyze your description and automatically create:
- Database models/schemas
- Relationships
- Migrations
- Validation rules

Example:
```bash
tryforge models:generate -d "Blog with posts, comments, and users"
```

### What ORMs are supported?

- Prisma (recommended)
- Sequelize
- TypeORM
- Mongoose (MongoDB)

### Can I use my existing database?

Yes! TryForge can:
- Connect to existing database
- Generate models from existing schema
- Create migrations for changes

### How does model detection work?

TryForge scans your code for database queries and identifies missing models. Run:
```bash
tryforge models:detect
```

## Graphics Generation

### What graphics can be generated?

- Logos (SVG, PNG)
- Favicons (multiple sizes)
- Hero images
- OG images (social media)
- App icons
- Background images

### Can I specify exact designs?

You can specify:
- Style (modern, minimalist, professional)
- Colors
- Application type
- Application name

AI generates based on these parameters.

### What if I don't like the generated graphics?

- Regenerate with different parameters
- Use your own graphics
- Edit generated graphics
- Request variations

### Are graphics optimized for web?

Yes! Graphics are:
- Compressed for web
- Multiple sizes generated
- Format optimized (WebP, PNG, SVG)
- SEO-friendly naming

## Code Generation

### How specific should my descriptions be?

More specific = better results. Compare:

**Less specific:**
```bash
tryforge create "blog"
```

**More specific:**
```bash
tryforge create "Personal blog with user authentication, markdown support, and SEO optimization"
```

### Can I generate just components?

Yes:
```bash
tryforge generate component "UserProfile with avatar and bio"
```

### Can I generate tests?

Yes:
```bash
tryforge generate test --file src/components/Button.jsx
```

### Does it follow best practices?

Yes! Generated code includes:
- TypeScript types
- Error handling
- Input validation
- Security measures
- Tests
- Documentation

## Refactoring & Analysis

### What can be analyzed?

- Code quality
- Performance
- Security vulnerabilities
- Bundle size
- Database schema
- UI/UX

### Is refactoring safe?

TryForge:
- Creates backups before refactoring
- Suggests changes (interactive mode)
- Runs tests after changes
- Preserves functionality

Always use version control!

### How often should I analyze?

- Before each commit (quick check)
- Before deployment (full analysis)
- After adding features
- Weekly (scheduled)

## Deployment

### What platforms are supported?

- Vercel
- Netlify
- Railway
- Render
- Heroku (coming soon)
- AWS (coming soon)

### Is deployment automatic?

Yes! TryForge:
- Configures deployment
- Sets environment variables
- Deploys to platform
- Provides URLs

### Can I deploy to multiple platforms?

Yes, you can deploy the same app to different platforms:
```bash
tryforge deploy vercel
tryforge deploy netlify
```

### What about environment variables?

Set them:
- Via platform dashboard (recommended)
- Via `tryforge admin`
- In `.env.production`

Never commit secrets!

## Testing

### Are tests generated automatically?

Yes, when you:
- Create a new project
- Generate components/features
- Explicitly generate tests

### What testing frameworks are used?

- **Unit:** Jest
- **Integration:** Jest + Supertest
- **E2E:** Playwright

### How do I run tests?

```bash
# All tests
tryforge test all

# Watch mode
tryforge test --watch

# Specific type
tryforge test e2e
```

## Performance

### Is TryForge fast?

Generation speed depends on:
- API response time (usually 5-30 seconds)
- Complexity of request
- Internet speed

Use `--verbose` to see progress.

### Can I speed it up?

- Be more specific in descriptions
- Use templates for common patterns
- Cache is used when possible
- Parallel generation where possible

### Does it work offline?

No, you need internet for:
- AI generation
- Graphics generation
- API calls

But you can work on generated code offline.

## Troubleshooting

### What if something goes wrong?

1. Run `tryforge doctor`
2. Check error message
3. Search: `tryforge help --search <error>`
4. View guide: `tryforge guide troubleshooting`
5. Report: https://github.com/jedrzej82/tryforge/issues

### Where are logs stored?

```bash
~/.tryforge/logs/
```

View latest:
```bash
tail -f ~/.tryforge/logs/latest.log
```

### How do I reset configuration?

```bash
# Remove config
rm -rf ~/.tryforge/

# Reconfigure
tryforge admin
```

## Best Practices

### Should I review generated code?

Yes! Always:
- Review before committing
- Understand what was generated
- Customize to your needs
- Test thoroughly

### Should I use version control?

Absolutely! Always:
```bash
git init
git add .
git commit -m "Initial commit"
```

### How often should I update?

```bash
# Check version
tryforge --version

# Update
npm update -g tryforge
```

Update:
- Monthly (minor updates)
- Immediately (security updates)

### Should I use watch mode?

Watch modes are great for development:
```bash
# Auto-generate models
tryforge models:watch &

# Auto-generate graphics
tryforge graphics:watch &

# Watch tests
tryforge test --watch
```

## Advanced Usage

### Can I use TryForge in CI/CD?

Yes! Example:
```yaml
# .github/workflows/deploy.yml
- name: Analyze code
  run: tryforge analyze codebase --output json

- name: Run tests
  run: tryforge test all

- name: Deploy
  run: tryforge deploy vercel
```

### Can I extend TryForge?

Currently limited, but planned:
- Custom templates
- Custom generators
- Plugins
- Extensions

### Is there a programmatic API?

Not yet, but planned. For now, use CLI.

### Can multiple developers use TryForge?

Yes! Each developer:
- Has their own API key
- Can use shared project
- Should coordinate model/graphics generation

## Security & Privacy

### Is my code sent to AI?

Only when you explicitly use generation commands. Analysis happens locally when possible.

### Is my API key safe?

API keys are:
- Stored locally (~/.tryforge/)
- Never sent to TryForge servers
- Used only for Claude API
- Should never be committed to git

### Can I use TryForge for proprietary code?

Yes! Check Claude API terms. Generated code is yours.

### Are there telemetry/analytics?

Currently no telemetry. This may change with opt-in analytics.

## Support & Community

### Where can I get help?

- Documentation: https://docs.tryforge.dev
- GitHub Issues: https://github.com/jedrzej82/tryforge/issues
- Discussions: https://github.com/jedrzej82/tryforge/discussions
- Discord: https://discord.gg/tryforge

### How do I report bugs?

1. Run `tryforge doctor`
2. Save output
3. Create issue: https://github.com/jedrzej82/tryforge/issues
4. Include:
   - Error message
   - Steps to reproduce
   - Doctor output
   - TryForge version

### How can I contribute?

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Share examples

### Is there a roadmap?

Yes! View at: https://github.com/jedrzej82/tryforge/projects

## Pricing & Licensing

### Is TryForge open source?

Yes! MIT License. Use freely for:
- Personal projects
- Commercial projects
- Learning

### What costs should I expect?

- TryForge CLI: Free
- Claude API: Pay per use
- Pollinations AI: Free
- GitHub: Free
- Deployment: Varies by platform

### Can I use TryForge commercially?

Yes! No restrictions. Generated code is yours.

---

**Didn't find your answer?**

Ask on GitHub Discussions:
https://github.com/jedrzej82/tryforge/discussions

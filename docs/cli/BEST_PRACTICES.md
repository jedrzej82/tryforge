# TryForge CLI - Best Practices

Guidelines for using TryForge effectively.

## Project Creation

### Be Specific in Descriptions

**Good:**
```bash
tryforge create "E-commerce store for handmade jewelry with Stripe payments, inventory management, and customer reviews"
```

**Less effective:**
```bash
tryforge create "online store"
```

### Use Interactive Mode for Learning

When starting out, use interactive mode:
```bash
tryforge create --interactive
```

It guides you through all options.

### Choose the Right Template Level

- **Minimal:** Quick prototypes, learning projects
- **Standard:** Most projects, good balance
- **Full:** Production apps, all features needed

### Plan Your Stack

Before creating:
1. Decide on framework
2. Choose database
3. Select authentication method
4. List required features

## Code Generation

### Describe Context Clearly

Include context in your descriptions:

```bash
# Good - includes context
tryforge generate component "ProductCard for e-commerce displaying image, price, rating, and add to cart button"

# Less effective
tryforge generate component "card"
```

### Generate Related Code Together

Generate features, not just components:

```bash
# Better - complete feature
tryforge generate feature "User authentication with login, register, and password reset"

# Less efficient - piecemeal
tryforge generate component "LoginForm"
tryforge generate component "RegisterForm"
tryforge generate component "PasswordReset"
```

### Review Generated Code

Always:
1. Read the generated code
2. Understand what it does
3. Customize to your needs
4. Test thoroughly

### Use TypeScript

TypeScript provides:
- Type safety
- Better IDE support
- Fewer runtime errors
- Better documentation

```bash
tryforge create --language typescript
```

## Database & Models

### Auto-Generate Early

Generate models early in development:

```bash
# Right after creating project
tryforge models:generate -d "Your app description"
```

This creates proper foundation.

### Use Interactive Mode for Models

Review each model before generating:

```bash
tryforge models:generate --interactive -d "Your description"
```

### Keep Models in Sync

Use watch mode during development:

```bash
tryforge models:watch &
```

Or run detect periodically:

```bash
tryforge models:detect
```

### Proper Relationships

Describe relationships clearly:

```bash
tryforge models:generate -d "Blog with posts (one-to-many with users), comments (many-to-one with posts), and tags (many-to-many with posts)"
```

### Migration Best Practices

- Review migrations before applying
- Never edit applied migrations
- Keep migrations in version control
- Test on dev database first

```bash
# Review migration
cat prisma/migrations/*/migration.sql

# Test on dev
tryforge db:migrate

# Then commit
git add prisma/migrations
git commit -m "Add user model migration"
```

## Graphics Generation

### Generate Graphics Early

Don't wait until the end:

```bash
# Early in project
tryforge graphics:generate -n "MyApp" --style modern
```

### Be Specific with Style

Describe your brand:

```bash
tryforge graphics:generate \
  -n "EcoShop" \
  --style minimalist \
  --colors "green and white" \
  --type e-commerce
```

### Use Watch Mode

Auto-generate missing graphics:

```bash
tryforge graphics:watch &
```

### Optimize for Production

Graphics are optimized by default. Don't disable unless needed:

```bash
# Keep optimization (default)
tryforge graphics:generate -n "MyApp"

# Only disable if you'll optimize manually
tryforge graphics:generate --no-optimize
```

## Testing

### Generate Tests Alongside Code

Always generate tests:

```bash
# Generate component with tests
tryforge generate component "Button" --with-tests

# Or generate tests separately
tryforge generate test --file src/components/Button.jsx
```

### Use Watch Mode in Development

Keep tests running:

```bash
tryforge test --watch
```

### Test Before Committing

```bash
# Run all tests
tryforge test all

# If pass, commit
git add .
git commit -m "Add feature X"
```

### Maintain High Coverage

Aim for:
- 80%+ coverage overall
- 100% for critical paths
- 90%+ for business logic

```bash
# Check coverage
tryforge test all --coverage
```

## Code Quality

### Analyze Regularly

```bash
# Before each commit
tryforge analyze codebase

# Full analysis weekly
tryforge analyze codebase --output markdown > ANALYSIS.md
```

### Fix Issues Immediately

Don't accumulate technical debt:

```bash
# Analyze
tryforge analyze codebase

# Refactor issues
tryforge refactor --scope quality

# Verify
tryforge test all
```

### Use Linting

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Performance Analysis

Regular performance checks:

```bash
# Performance analysis
tryforge analyze performance

# Bundle size
tryforge analyze bundle

# Optimize if needed
tryforge refactor --scope performance
```

## Security

### Never Commit Secrets

```bash
# Use .env
echo "ANTHROPIC_API_KEY=xxx" >> .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit .env.example instead
cp .env .env.example
# Remove sensitive values from .env.example
git add .env.example
```

### Regular Security Audits

```bash
# Security scan
tryforge analyze security

# Fix vulnerabilities
npm audit fix

# Check dependencies
npm outdated
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update (carefully)
npm update

# Test after updating
tryforge test all
```

### Use Environment Variables

```bash
# Good
const apiKey = process.env.API_KEY;

// Bad
const apiKey = "hardcoded-key-123";
```

## Development Workflow

### Version Control Everything

```bash
# Initialize git
git init

# Commit frequently
git add .
git commit -m "Clear, descriptive message"

# Use branches
git checkout -b feature/user-auth
```

### Commit Messages

Follow conventions:

```bash
# Good
git commit -m "feat: Add user authentication"
git commit -m "fix: Resolve login redirect bug"
git commit -m "refactor: Improve component structure"

# Less helpful
git commit -m "updates"
git commit -m "fixes"
```

### Development Branches

```bash
# Feature branch
git checkout -b feature/shopping-cart

# Work on feature
# Commit changes
git add .
git commit -m "feat: Add shopping cart"

# Merge to main
git checkout main
git merge feature/shopping-cart
```

### Use Preview During Development

```bash
# Start preview
tryforge preview

# Leave running
# Edit code
# See changes instantly
```

## Deployment

### Test Before Deploying

```bash
# 1. Run tests
tryforge test all

# 2. Build locally
tryforge build

# 3. Analyze
tryforge analyze codebase

# 4. Security check
tryforge analyze security

# 5. Deploy
tryforge deploy vercel
```

### Use Staging Environment

```bash
# Deploy to staging first
tryforge deploy vercel --env staging

# Test staging
# If good, deploy production
tryforge deploy vercel --env production
```

### Environment Variables

Set in platform dashboard:
- API keys
- Database URLs
- Third-party credentials
- Feature flags

Never in code!

### Monitor After Deployment

```bash
# Check status
tryforge deploy:status vercel

# View logs in platform dashboard
# Set up error tracking
# Monitor performance
```

## Refactoring

### Refactor Regularly

Don't wait for major refactor:

```bash
# Small, frequent refactors
tryforge refactor --scope ui --files "src/components/Header.jsx"

# Test after refactor
tryforge test all
```

### Refactor with Tests

```bash
# 1. Ensure tests pass
tryforge test all

# 2. Refactor
tryforge refactor --scope performance

# 3. Verify tests still pass
tryforge test all

# 4. Check nothing broke
tryforge preview
```

### Use Scoped Refactoring

```bash
# UI only
tryforge refactor --scope ui

# Performance only
tryforge refactor --scope performance

# Security only
tryforge refactor --scope security

# Everything (risky)
tryforge refactor --scope all
```

## Collaboration

### Team Coordination

When working in team:
1. Communicate before major generation
2. Review generated code in PRs
3. Use shared configuration
4. Document AI-generated changes

### Code Reviews

Review AI-generated code like any code:
- Understand the logic
- Check for security issues
- Verify tests
- Ensure it fits architecture

### Documentation

Document:
- Why you used TryForge
- What was generated
- What was customized
- How to regenerate

```markdown
## AI-Generated Code

This component was generated with:
```bash
tryforge generate component "UserProfile"
```

Customizations:
- Added custom avatar handling
- Modified styling for brand
```

## Performance Optimization

### Lazy Loading

```bash
# Generate with lazy loading
tryforge generate component "HeavyComponent" --lazy
```

### Code Splitting

Use framework features:
- React: `React.lazy()`
- Next.js: Dynamic imports
- Vue: Async components

### Image Optimization

Generated images are optimized, but:
- Use WebP format
- Responsive images
- Lazy load images
- Proper sizing

### Bundle Analysis

```bash
# Analyze bundle
tryforge analyze bundle

# Optimize if needed
tryforge refactor --scope performance
```

## Maintenance

### Regular Updates

```bash
# Weekly
npm outdated
npm update
tryforge test all

# Monthly
npm install -g tryforge@latest
```

### Documentation

Keep updated:
- README.md
- API documentation
- Setup instructions
- Deployment guide

### Backups

```bash
# Before major changes
git commit -am "Backup before refactor"
git tag backup-$(date +%Y%m%d)
```

### Monitoring

Track:
- Error rates
- Performance metrics
- User feedback
- API usage

## Learning Resources

### Practice with Examples

```bash
# View examples
tryforge examples

# Try different commands
tryforge examples create
tryforge examples models:generate
```

### Read Guides

```bash
# List guides
tryforge guide --list

# Read specific guide
tryforge guide getting-started
tryforge guide best-practices
```

### Experiment Safely

```bash
# Create test project
mkdir tryforge-test
cd tryforge-test
tryforge create --interactive

# Experiment
# Delete when done
cd ..
rm -rf tryforge-test
```

## Troubleshooting

### When Something Goes Wrong

```bash
# 1. Check health
tryforge doctor

# 2. Enable verbose
tryforge <command> --verbose

# 3. Check logs
tail -f ~/.tryforge/logs/latest.log

# 4. Search help
tryforge help --search <error>

# 5. Check troubleshooting guide
tryforge guide troubleshooting
```

### Backup Before Fixes

```bash
# Commit current state
git add .
git commit -m "Before fix attempt"

# Try fix
# If works, great!
# If not, revert:
git reset --hard HEAD
```

## Summary Checklist

Before starting a project:
- [ ] Install latest TryForge
- [ ] Configure API keys
- [ ] Plan your stack
- [ ] Initialize git

During development:
- [ ] Use specific descriptions
- [ ] Generate tests alongside code
- [ ] Use watch modes
- [ ] Commit frequently
- [ ] Review generated code
- [ ] Run tests regularly

Before deployment:
- [ ] All tests passing
- [ ] Code analyzed
- [ ] Security checked
- [ ] Build succeeds locally
- [ ] Environment variables set
- [ ] Documentation updated

After deployment:
- [ ] Monitor logs
- [ ] Check performance
- [ ] Get user feedback
- [ ] Plan improvements

---

**Remember:** TryForge is a tool to help you build faster. Always understand and review what it generates!

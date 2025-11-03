# TryForge CLI Troubleshooting Guide

Common issues and their solutions.

## Quick Diagnostics

Run the health check first:
```bash
tryforge doctor
```

This checks your installation and configuration.

## Installation Issues

### Module Not Found

**Error:**
```
Error: Cannot find module 'tryforge'
```

**Solutions:**
```bash
# Install dependencies
npm install

# Or clean install
rm -rf node_modules package-lock.json
npm install

# Or install globally
npm install -g tryforge
```

### Permission Denied

**Error:**
```
Error: EACCES: permission denied
```

**Solutions:**
```bash
# Use sudo (not recommended)
sudo npm install -g tryforge

# Better: Fix npm permissions
# Follow: https://docs.npmjs.com/resolving-eacces-permissions-errors

# Or use npx
npx tryforge create "My App"
```

### Version Conflicts

**Error:**
```
Error: Unsupported engine
```

**Solutions:**
```bash
# Check Node version
node --version

# Upgrade Node.js (requires v18+)
# Use nvm:
nvm install 18
nvm use 18

# Or download from: https://nodejs.org
```

## API Key Issues

### Invalid API Key

**Error:**
```
Error: Invalid API key
```

**Solutions:**
```bash
# Configure API key
tryforge admin

# Or set in .env
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Get key from: https://console.anthropic.com
```

### API Key Not Found

**Error:**
```
Error: ANTHROPIC_API_KEY not found
```

**Solutions:**
```bash
# Set via admin panel
tryforge admin

# Or export in shell
export ANTHROPIC_API_KEY="your-key-here"

# Or add to .bashrc/.zshrc
echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.bashrc
```

### API Rate Limit

**Error:**
```
Error: Rate limit exceeded
```

**Solutions:**
- Wait a few minutes and try again
- Check your API usage at https://console.anthropic.com
- Upgrade your API plan if needed

## Database Issues

### Connection Refused

**Error:**
```
Error: Connection refused to database
```

**Solutions:**
```bash
# Check if database is running
# PostgreSQL:
pg_isready

# MySQL:
mysqladmin ping

# Start database if needed
# PostgreSQL:
sudo service postgresql start

# MySQL:
sudo service mysql start

# MongoDB:
sudo service mongod start
```

### Invalid Connection String

**Error:**
```
Error: Invalid database connection string
```

**Solutions:**
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Format should be:
# PostgreSQL: postgresql://user:pass@localhost:5432/dbname
# MySQL: mysql://user:pass@localhost:3306/dbname
# MongoDB: mongodb://user:pass@localhost:27017/dbname

# Reconfigure
tryforge admin
```

### Migration Errors

**Error:**
```
Error: Migration failed
```

**Solutions:**
```bash
# Reset database
tryforge db:reset

# Or manually:
# 1. Drop database
# 2. Create database
# 3. Run migrations
tryforge db:migrate
```

## Port Issues

### Port Already in Use

**Error:**
```
Error: Port 3000 is already in use
```

**Solutions:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
# Edit configuration to use different port

# Check what's using the port
lsof -i :3000
```

### Multiple Ports in Use

```bash
# Kill all common dev ports
lsof -ti:3000,3001,3333,5000 | xargs kill
```

## Build Issues

### Build Failed

**Error:**
```
Error: Build failed
```

**Solutions:**
```bash
# Check for errors
npm run build

# Fix linting issues
npm run lint:fix

# Clear cache
rm -rf .next dist build
npm run build

# Check dependencies
npm install
```

### Type Errors

**Error:**
```
Error: Type 'X' is not assignable to type 'Y'
```

**Solutions:**
```bash
# Update TypeScript
npm install -D typescript@latest

# Regenerate types
npm run build

# Check tsconfig.json
```

### Module Resolution Errors

**Error:**
```
Error: Cannot resolve module 'X'
```

**Solutions:**
```bash
# Install missing dependency
npm install <package-name>

# Check import paths
# Use absolute imports or check paths in tsconfig.json
```

## Test Issues

### Tests Failing

**Error:**
```
Error: Tests failed
```

**Solutions:**
```bash
# Run tests with verbose output
tryforge test --verbose

# Update snapshots
npm test -- -u

# Clear test cache
jest --clearCache

# Check test configuration
```

### Test Timeout

**Error:**
```
Error: Test timeout exceeded
```

**Solutions:**
```bash
# Increase timeout in test file:
# jest.setTimeout(10000);

# Or in jest.config.js:
# testTimeout: 10000
```

## Deployment Issues

### Deployment Failed

**Error:**
```
Error: Deployment failed
```

**Solutions:**
```bash
# Check deployment logs
tryforge deploy:status vercel

# Ensure build works locally
tryforge build

# Check environment variables
# Set in platform dashboard

# Verify project configuration
```

### Environment Variables Not Set

**Error:**
```
Error: Environment variable X is not defined
```

**Solutions:**
- Set environment variables in platform dashboard
- Check .env.example for required variables
- Don't commit .env to git
- Use platform-specific env var format

## Graphics Generation Issues

### Graphics Generation Failed

**Error:**
```
Error: Failed to generate graphics
```

**Solutions:**
```bash
# Check Pollinations API status
# Try again with verbose mode
tryforge graphics:generate -n "MyApp" --verbose

# Use different style
tryforge graphics:generate --style minimalist

# Generate specific type
tryforge graphics:type logo -n "MyApp"
```

### Image Optimization Failed

**Error:**
```
Error: Image optimization failed
```

**Solutions:**
```bash
# Skip optimization
tryforge graphics:generate --no-optimize

# Install sharp
npm install sharp

# Check image format
```

## Model Generation Issues

### Model Detection Failed

**Error:**
```
Error: No models detected
```

**Solutions:**
```bash
# Ensure code has database queries
# Check ORM is specified correctly
tryforge models:detect --orm prisma

# Try manual generation
tryforge models:generate -d "Your description"
```

### Migration Generation Failed

**Error:**
```
Error: Failed to generate migration
```

**Solutions:**
```bash
# Skip migrations
tryforge models:generate --no-migrations

# Check database connection
tryforge admin

# Generate migrations manually later
```

## Performance Issues

### Slow Generation

**Issue:** Code generation is slow

**Solutions:**
- Check internet connection
- Verify API key is valid
- Try with smaller descriptions
- Use `--verbose` to see what's happening

### High Memory Usage

**Issue:** High memory consumption

**Solutions:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Close other applications
# Restart terminal
```

## CLI Issues

### Command Not Found

**Error:**
```
tryforge: command not found
```

**Solutions:**
```bash
# Install globally
npm install -g tryforge

# Or use npx
npx tryforge <command>

# Check PATH
echo $PATH | grep npm

# Reinstall
npm uninstall -g tryforge
npm install -g tryforge
```

### Outdated Version

**Issue:** Using old version

**Solutions:**
```bash
# Check current version
tryforge --version

# Update to latest
npm update -g tryforge

# Or reinstall
npm uninstall -g tryforge
npm install -g tryforge
```

## Getting More Help

### Run Diagnostics

```bash
tryforge doctor
```

### Search Help

```bash
tryforge help --search <keyword>
```

### View Logs

```bash
# Check logs directory
ls -la ~/.tryforge/logs/

# View latest log
tail -f ~/.tryforge/logs/latest.log
```

### Enable Debug Mode

```bash
# Run any command with --verbose
tryforge create "My App" --verbose
```

### Report Issues

1. Run `tryforge doctor` and save output
2. Include error messages
3. Describe steps to reproduce
4. Report at: https://github.com/jedrzej82/tryforge/issues

### Get Community Help

- GitHub Discussions: https://github.com/jedrzej82/tryforge/discussions
- Stack Overflow: Tag with `tryforge`
- Discord: https://discord.gg/tryforge

## Common Error Messages

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `EACCES` | Permission denied | Use sudo or fix npm permissions |
| `ENOENT` | File not found | Check file path exists |
| `EADDRINUSE` | Port in use | Kill process or use different port |
| `MODULE_NOT_FOUND` | Missing dependency | Run `npm install` |
| `Invalid API key` | Wrong/missing API key | Run `tryforge admin` |
| `Connection refused` | Database not running | Start database service |
| `Rate limit exceeded` | Too many API calls | Wait or upgrade API plan |
| `Build failed` | Syntax/type errors | Check errors and fix code |

## Prevention Tips

### 1. Regular Updates

```bash
# Update TryForge
npm update -g tryforge

# Update dependencies
npm update
```

### 2. Use Version Control

```bash
git init
git add .
git commit -m "Initial commit"
```

### 3. Environment Variables

- Never commit .env files
- Use .env.example as template
- Keep API keys secure

### 4. Regular Testing

```bash
# Run tests before committing
tryforge test all

# Use watch mode during development
tryforge test --watch
```

### 5. Code Analysis

```bash
# Regular code analysis
tryforge analyze codebase

# Security audits
tryforge analyze security
```

---

**Still having issues?**

Run `tryforge doctor` and report the output at:
https://github.com/jedrzej82/tryforge/issues

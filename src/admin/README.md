# TryForge Admin Panel

Web-based configuration panel for managing API keys and TryForge settings.

## Features

- 🔐 **Secure API Key Management** - Encrypted storage of sensitive credentials
- 🧪 **Key Validation** - Test API keys before saving
- 🎨 **Modern UI** - Clean, responsive interface
- 💾 **Auto-save** - Updates .env file automatically
- 🔒 **Encryption** - All sensitive data encrypted at rest

## Quick Start

### Launch Admin Panel

```bash
tryforge admin
```

This will start the admin panel on `http://localhost:3333`

### Custom Port

```bash
tryforge admin --port 4444
```

## AI Provider Selection

**Choose your AI provider** at the top of the admin panel:

- **Claude (Anthropic)** - Premium AI, best quality, pay-per-use or subscription
- **OpenRouter** - Access to 7+ free models including MiniMax M2

The intelligent generator will automatically use your selected provider for all code generation tasks.

## Configuration Sections

### 🤖 Claude Configuration

Configure Claude for intelligent code generation with two authentication modes:

#### API Key Mode (Pay-per-use)
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- Best for: Production use, predictable billing
- Costs: Pay per token used
- Setup: Create API key in Anthropic Console

#### Subscription Mode (Claude Pro/Max)
- **Session Token**: Extract from claude.ai browser cookies
- Best for: Users with existing Claude Pro/Max subscription
- Costs: Use your existing subscription tokens
- Setup:
  1. Login to [claude.ai](https://claude.ai)
  2. Open DevTools (F12) → Application → Cookies
  3. Copy the `sessionKey` cookie value
  4. Paste in admin panel
- **Organization ID**: Optional, for organization accounts

**Test Button**: Validates your credentials before saving

### 🌐 OpenRouter Configuration

Access multiple free AI models through a single API:

#### Why OpenRouter?
- **7+ Free Models**: Including MiniMax M2, Google Gemini, Meta Llama
- **Zero Cost**: Free models have no API costs
- **Huge Context**: Up to 1M tokens (Gemini Flash)
- **Easy Switching**: Change models without code changes
- **Perfect for Dev**: Test with free models, scale as needed

#### Free Models Available
1. **MiniMax M2** (minimax/minimax-01) - 200K context - **Recommended**
2. **Google Gemini Flash 1.5** - 1M context
3. **Google Gemini Flash 1.5 8B** - 1M context
4. **Meta Llama 3.2 3B** - 128K context
5. **Meta Llama 3.1 8B** - 128K context
6. **Microsoft Phi-3 Medium** - 128K context
7. **Qwen 2 7B** - 32K context

#### Setup
1. Create free account at [openrouter.ai](https://openrouter.ai)
2. Get API key from [OpenRouter Keys](https://openrouter.ai/keys)
3. Paste in admin panel
4. Select preferred model
5. Test and save

**Best For:**
- Development and testing
- Cost-conscious projects
- Experimenting with different models
- High-volume usage with free models

### 🚀 Deployment

Configure deployment platforms:
- **Vercel**: Get token from [Vercel Settings](https://vercel.com/account/tokens)
- **Netlify**: Get token from [Netlify Settings](https://app.netlify.com/user/applications)
- **Railway**: Get token from [Railway Settings](https://railway.app/account/tokens)
- **Render**: Get API key from [Render Dashboard](https://dashboard.render.com/account/api-keys)

### 📦 GitHub

Configure GitHub integration:
- **Username**: Your GitHub username
- **Email**: Email for commits

### 🗄️ Database

Configure database connections:
- **Database URL**: PostgreSQL connection string
- **Database User**: Username for PostgreSQL
- **Redis URL**: Optional Redis connection (for caching)

### ⚙️ Settings

Application settings:
- **Environment**: development/production/test
- **Log Level**: debug/info/warn/error
- **Port Configuration**: Frontend, Backend, Preview ports
- **Playwright**: Headless mode toggle

## Security

### Encryption

All sensitive API keys are encrypted using AES-256-CBC encryption:
- Encryption key stored in `.tryforge/encryption.key`
- Encrypted values stored in `.tryforge/config.json`
- Both files are gitignored for security

### Best Practices

1. **Never commit** `.env` files to git
2. **Rotate keys** regularly
3. **Use test button** to validate keys before saving
4. **Limit access** to admin panel (localhost only by default)

## Claude Authentication Modes

### When to use API Key Mode

✅ **Best for:**
- Production applications
- Automated systems
- High-volume usage
- Team collaboration

💰 **Billing:** Pay-per-use (token-based)

🔑 **Get key:** [Anthropic Console](https://console.anthropic.com/)

### When to use Subscription Mode

✅ **Best for:**
- Personal projects
- Development/testing
- Users with Claude Pro/Max subscription
- Cost-effective for moderate usage

💰 **Billing:** Included in Claude Pro/Max subscription

🔑 **Get token:** Extract from claude.ai browser cookies

**Note:** Subscription tokens may expire when you log out or after a period of time. API keys are more stable for production use.

## Files Modified

When you save configuration, the admin panel updates:

1. **`.env`** - Updated with new values
2. **`.tryforge/config.json`** - Encrypted sensitive data

## API Endpoints

The admin server exposes these endpoints:

- `GET /api/health` - Health check
- `GET /api/config` - Get current configuration
- `POST /api/config` - Update configuration
- `POST /api/test-key` - Test API key validity

## Architecture

```
src/admin/
├── config-manager.js   # Configuration management & encryption
├── admin-server.js     # Express server for API
├── public/
│   └── index.html      # Frontend web UI
└── README.md          # This file
```

## How It Works

1. **Launch**: Run `tryforge admin` to start server
2. **Load**: Frontend fetches current config (masked values)
3. **Edit**: Update API keys and settings in web UI
4. **Test**: Click "Test" to validate keys
5. **Save**: Click "Save Configuration"
6. **Encrypt**: Backend encrypts sensitive values
7. **Write**: Updates `.env` and `.tryforge/config.json`

## Troubleshooting

### Port already in use

```bash
tryforge admin --port 3334
```

### API key test fails

- Check internet connection
- Verify key is correct
- Check API service status

### Subscription token test fails

- Token may have expired (re-extract from cookies)
- Ensure you're logged in to claude.ai
- Check if subscription is active
- Try logging out and back in to claude.ai

### Token expires frequently

- Use API Key mode for production instead
- Subscription tokens are session-based
- Consider upgrading to API key for stability

### Configuration not saving

- Check file permissions
- Ensure `.env` exists
- Check console for errors

## Example Usage

### Using Claude (Premium)

```bash
# Start admin panel
tryforge admin

# Open browser to http://localhost:3333
# 1. Select "Claude" as AI Provider
# 2. Enter your Anthropic API key
# 3. Click "Test" to validate
# 4. Configure other settings
# 5. Click "Save Configuration"
# 6. Ready to use TryForge with Claude!
```

### Using OpenRouter (Free Models)

```bash
# Start admin panel
tryforge admin

# Open browser to http://localhost:3333
# 1. Select "OpenRouter" as AI Provider
# 2. Enter your OpenRouter API key (free from openrouter.ai)
# 3. Choose a free model (MiniMax M2 recommended)
# 4. Click "Test" to validate
# 5. Configure other settings
# 6. Click "Save Configuration"
# 7. Ready to use TryForge with FREE AI models!
```

## Security Notes

⚠️ **Important**: The admin panel runs on localhost only and should not be exposed to the internet. For production deployments, add authentication and HTTPS.

## Future Enhancements

- [ ] User authentication
- [ ] HTTPS support
- [ ] API key rotation
- [ ] Audit logging
- [ ] Multi-user support
- [ ] OAuth integration

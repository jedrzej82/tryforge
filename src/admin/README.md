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

## Configuration Sections

### 🤖 Claude API

Configure Anthropic Claude API for intelligent code generation:
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Test Button**: Validates your API key

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

### Configuration not saving

- Check file permissions
- Ensure `.env` exists
- Check console for errors

## Example Usage

```bash
# Start admin panel
tryforge admin

# Open browser to http://localhost:3333
# 1. Enter your Anthropic API key
# 2. Click "Test" to validate
# 3. Add deployment tokens (optional)
# 4. Configure GitHub settings
# 5. Click "Save Configuration"
# 6. Ready to use TryForge!
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

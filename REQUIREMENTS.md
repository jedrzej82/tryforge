# TryForge - System Requirements & Setup Guide

## 📋 Wymagania Systemowe

### Minimalne Wymagania

**Oprogramowanie:**
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: >= 2.30.0

**System Operacyjny:**
- Linux (Ubuntu 20.04+, Debian 11+, Fedora 35+)
- macOS (10.15+)
- Windows 10/11 (z WSL2 polecane)

**Zasoby Hardware:**
- **RAM**: Minimum 4GB, zalecane 8GB+
- **CPU**: Dual-core 2.0GHz+, zalecane quad-core
- **Dysk**: 10GB wolnego miejsca (dla dependencies + projektów)
- **Internet**: Stałe połączenie (do AI API, npm packages)

---

## ⚙️ Instalacja Krok po Kroku

### 1. Instalacja Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS (Homebrew):**
```bash
brew install node@18
```

**Windows:**
- Pobierz installer ze: https://nodejs.org/
- Lub użyj nvm-windows: https://github.com/coreybutler/nvm-windows

**Weryfikacja:**
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

### 2. Klonowanie Repository

```bash
git clone https://github.com/jedrzej82/tryforge.git
cd tryforge
```

### 3. Instalacja Dependencies

```bash
npm install
```

**To zainstaluje:**
- Core dependencies (express, axios, etc.)
- CLI tools (commander, inquirer, chalk, ora)
- Database clients (pg, ioredis)
- Automation (bull, playwright)
- Dev dependencies (eslint, jest, nodemon)

### 4. Konfiguracja Zmiennych Środowiskowych

Stwórz plik `.env` w głównym katalogu:

```bash
cp .env.example .env
```

**Edytuj `.env` i wypełnij wymagane wartości:**

```env
# ===================================
# CORE CONFIGURATION
# ===================================
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# ===================================
# AI SERVICES (Optional but recommended)
# ===================================

# Claude API (Anthropic)
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
# Get from: https://console.anthropic.com/

# GitHub Spark (for UI generation)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
# Get from: https://github.com/settings/tokens

# Pollinations AI (for graphics)
POLLINATIONS_API_KEY=xxxxxxxxxxxxx
# Get from: https://pollinations.ai/

# OpenAI (alternative AI provider)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
# Get from: https://platform.openai.com/

# ===================================
# DATABASE CONFIGURATION
# ===================================

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/tryforge
# Format: postgresql://[user]:[password]@[host]:[port]/[database]

# MongoDB (Optional)
MONGODB_URI=mongodb://localhost:27017/tryforge
# Format: mongodb://[user]:[password]@[host]:[port]/[database]

# Redis (Required for jobs, cache, analytics)
REDIS_URL=redis://localhost:6379
# Format: redis://[user]:[password]@[host]:[port]/[db]

# ===================================
# EXTERNAL SERVICES (Optional)
# ===================================

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# Get from: https://sendgrid.com/

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
# Get from: https://www.twilio.com/

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=tryforge-storage

# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
# Get from: https://dashboard.stripe.com/

# ===================================
# ADVANCED FEATURES
# ===================================

# Blockchain (for NFT/Web3 features)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com
WALLET_PRIVATE_KEY=0xxxxxxxxx
# Get Infura from: https://infura.io/

# Video Processing (for streaming features)
CLOUDFLARE_STREAM_API_KEY=xxxxxxxxxxxxx
# Get from: https://dash.cloudflare.com/

# Machine Learning (TensorFlow.js cloud)
TENSORFLOW_CLOUD_API_KEY=xxxxxxxxxxxxx

# ===================================
# MONITORING & ANALYTICS
# ===================================

# Sentry (Error tracking)
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxxxxxxxxxx
# Get from: https://sentry.io/

# Google Analytics
GA_TRACKING_ID=UA-xxxxxxxxxxxxx

# ===================================
# SECURITY
# ===================================

# JWT Secret (generate random string)
JWT_SECRET=generate-a-very-long-random-string-here
# Generate: openssl rand -base64 32

# Session Secret
SESSION_SECRET=another-long-random-string
# Generate: openssl rand -base64 32

# Encryption Key (for data encryption)
ENCRYPTION_KEY=xxxxxxxxxxxxx
# Generate: openssl rand -hex 32

# ===================================
# FEATURE FLAGS
# ===================================
ENABLE_VISUAL_EDITOR=true
ENABLE_WORKFLOW_BUILDER=true
ENABLE_AGENCY_TOOLS=true
ENABLE_AI_CODE_GEN=true
```

### 5. Setup Baz Danych

#### PostgreSQL

**Instalacja:**

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

**Tworzenie bazy:**

```bash
sudo -u postgres psql
CREATE DATABASE tryforge;
CREATE USER tryforge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tryforge TO tryforge_user;
\q
```

#### Redis

**Instalacja:**

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start service
sudo systemctl start redis  # Linux
brew services start redis   # macOS
```

**Weryfikacja:**

```bash
redis-cli ping  # Should return: PONG
```

#### MongoDB (Optional)

**Instalacja:**

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### 6. Instalacja Playwright (dla Web Crawling)

```bash
npx playwright install
```

To zainstaluje przeglądarki: Chromium, Firefox, WebKit

### 7. Globalna Instalacja CLI (Optional)

```bash
npm link
```

Teraz możesz używać `tryforge` z dowolnego miejsca w systemie.

---

## 🚀 Uruchomienie

### Tryb Development

**Pełna aplikacja z GUI:**
```bash
npm start
# Lub z auto-reload:
npm run dev
```

**Dostęp:**
- Main Dashboard: http://localhost:3000/
- Visual Editor: http://localhost:3000/editor
- Workflow Builder: http://localhost:3000/workflow-builder
- Agency Dashboard: http://localhost:3000/agency
- API Docs: http://localhost:3000/api-docs

**Tylko CLI:**
```bash
npm run cli create my-project
```

### Tryb Production

```bash
NODE_ENV=production npm start
```

---

## 🔑 API Keys - Gdzie Zdobyć

### Konieczne (Core Functionality)

1. **Brak** - TryForge działa bez API keys dla podstawowych funkcji!

### Zalecane (AI Features)

2. **Claude API** (Anthropic)
   - URL: https://console.anthropic.com/
   - Koszt: $0.008 per 1K tokens (input), $0.024 per 1K tokens (output)
   - Limit free: Brak, od razu płatne
   - Użycie w TryForge: AI code generation, analysis

3. **GitHub Token**
   - URL: https://github.com/settings/tokens
   - Koszt: Darmowe
   - Permissions needed: repo, workflow
   - Użycie: GitHub Spark UI generation

4. **OpenAI API** (Alternative)
   - URL: https://platform.openai.com/
   - Koszt: $0.002 per 1K tokens (GPT-3.5)
   - Free tier: $5 credit
   - Użycie: AI code generation (fallback)

### Opcjonalne (Advanced Features)

5. **SendGrid** (Email)
   - URL: https://sendgrid.com/
   - Free tier: 100 emails/day
   - Użycie: Email notifications, newsletters

6. **Twilio** (SMS)
   - URL: https://www.twilio.com/
   - Free tier: $15 credit
   - Użycie: SMS notifications, 2FA

7. **Stripe** (Payments)
   - URL: https://dashboard.stripe.com/
   - Free tier: Yes (test mode)
   - Użycie: Payment processing in generated apps

8. **AWS** (Storage)
   - URL: https://aws.amazon.com/
   - Free tier: 5GB S3 storage (12 months)
   - Użycie: File uploads, image storage

9. **Infura** (Blockchain)
   - URL: https://infura.io/
   - Free tier: 100,000 requests/day
   - Użycie: Ethereum/Polygon RPC for Web3 apps

---

## 🧪 Testowanie

### Run Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Manual Testing

```bash
# Test interactive mode
tryforge create

# Test specific template
tryforge create test-app --template mobile-app

# Test visual editor
tryforge editor ./test-app

# Test workflow builder
tryforge workflow
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module"

**Rozwiązanie:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Port 3000 already in use"

**Rozwiązanie:**
```bash
# Zmień port w .env
PORT=3001

# Lub zabij proces na porcie 3000
lsof -ti:3000 | xargs kill
```

### Problem: "Redis connection failed"

**Rozwiązanie:**
```bash
# Sprawdź czy Redis działa
redis-cli ping

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis   # macOS

# Sprawdź REDIS_URL w .env
```

### Problem: "PostgreSQL connection failed"

**Rozwiązanie:**
```bash
# Sprawdź czy PostgreSQL działa
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Sprawdź DATABASE_URL w .env
# Format: postgresql://user:password@host:port/database
```

### Problem: "Playwright browsers not found"

**Rozwiązanie:**
```bash
npx playwright install
```

### Problem: "Permission denied" podczas `npm link`

**Rozwiązanie:**
```bash
sudo npm link
```

---

## 📊 System Status Check

Uruchom diagnostykę systemu:

```bash
# Check all dependencies
node -e "require('./src/index.js').then(tf => tf.getSystemStatus())"
```

**Expected output:**
```
✅ Node.js: 18.x.x
✅ PostgreSQL: Connected
✅ Redis: Connected
✅ MongoDB: Connected (optional)
✅ All 18 modules loaded
✅ System ready!
```

---

## 🔄 Update TryForge

```bash
cd tryforge
git pull origin main
npm install
```

---

## 📚 Dokumentacja Dependencies

### Core Dependencies

1. **express** (^4.18.2)
   - Purpose: Web server framework
   - Docs: https://expressjs.com/

2. **axios** (^1.6.2)
   - Purpose: HTTP client for API calls
   - Docs: https://axios-http.com/

3. **bull** (^4.12.0)
   - Purpose: Redis-based queue for background jobs
   - Docs: https://github.com/OptimalBits/bull

4. **playwright** (^1.40.1)
   - Purpose: Browser automation for web crawling
   - Docs: https://playwright.dev/

5. **ioredis** (^5.3.2)
   - Purpose: Redis client
   - Docs: https://github.com/luin/ioredis

6. **pg** (^8.11.3)
   - Purpose: PostgreSQL client
   - Docs: https://node-postgres.com/

7. **ws** (^8.18.3)
   - Purpose: WebSocket server for real-time features
   - Docs: https://github.com/websockets/ws

### CLI Dependencies

8. **commander** (^11.1.0)
   - Purpose: CLI framework
   - Docs: https://github.com/tj/commander.js

9. **inquirer** (^9.2.12)
   - Purpose: Interactive command line prompts
   - Docs: https://github.com/SBoudrias/Inquirer.js

10. **chalk** (^4.1.2)
    - Purpose: Terminal colors
    - Docs: https://github.com/chalk/chalk

11. **ora** (^5.4.1)
    - Purpose: Elegant terminal spinners
    - Docs: https://github.com/sindresorhus/ora

### Utility Dependencies

12. **cheerio** (^1.0.0-rc.12)
    - Purpose: HTML parsing for web scraping
    - Docs: https://cheerio.js.org/

13. **dotenv** (^16.3.1)
    - Purpose: Environment variables
    - Docs: https://github.com/motdotla/dotenv

14. **winston** (^3.11.0)
    - Purpose: Logging
    - Docs: https://github.com/winstonjs/winston

15. **node-cron** (^3.0.3)
    - Purpose: Scheduled tasks
    - Docs: https://github.com/node-cron/node-cron

---

## 🎯 Optional Dependencies (dla specific features)

Jeśli chcesz używać zaawansowanych funkcji, zainstaluj dodatkowe dependencies:

### ML/AI Features
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

### Mobile Development
```bash
npm install react-native-cli expo-cli
```

### Blockchain
```bash
npm install web3 ethers hardhat @openzeppelin/contracts
```

### Desktop Apps
```bash
npm install electron electron-builder
```

### Video Processing
```bash
# Install FFmpeg system-wide
# Ubuntu: sudo apt-get install ffmpeg
# macOS: brew install ffmpeg
npm install fluent-ffmpeg
```

---

## 🔒 Security Best Practices

1. **Nigdy nie commituj .env do git**
```bash
# Already in .gitignore
echo ".env" >> .gitignore
```

2. **Use strong secrets**
```bash
# Generate secure random strings
openssl rand -base64 32
```

3. **Keep dependencies updated**
```bash
npm audit
npm audit fix
npm update
```

4. **Use environment-specific configs**
```bash
# .env.development
# .env.production
# .env.test
```

---

## 📈 Performance Tips

1. **Use Redis for caching**
   - Włącz Redis cache w .env
   - 10x faster dla repeated queries

2. **Enable clustering**
```bash
NODE_ENV=production CLUSTER_MODE=true npm start
```

3. **Use CDN dla static assets**
   - Cloudflare, AWS CloudFront

4. **Database indexing**
   - TryForge automatycznie tworzy indeksy

---

## 🌐 Deployment Ready

TryForge jest gotowe do deployment na:

- **Heroku**: `git push heroku main`
- **AWS**: Use Elastic Beanstalk
- **Google Cloud**: Use App Engine
- **Azure**: Use App Service
- **DigitalOcean**: Use App Platform
- **Vercel**: Frontend-only features
- **Docker**: `docker-compose up`

Szczegóły: Zobacz `docs/DEPLOYMENT.md`

---

## ✅ System Gotowy!

Jeśli wszystkie powyższe kroki przebiegły pomyślnie, masz:

- ✅ Działające środowisko Node.js
- ✅ Wszystkie dependencies zainstalowane
- ✅ Bazy danych skonfigurowane
- ✅ API keys ustawione (optional)
- ✅ TryForge gotowe do użycia

**Rozpocznij:**

```bash
tryforge create
```

lub

```bash
npm start
# Otwórz: http://localhost:3000
```

---

## 📞 Wsparcie

Problemy? Sprawdź:
- GitHub Issues: https://github.com/jedrzej82/tryforge/issues
- Documentation: `/docs/`
- Examples: `/examples/`

---

**Powodzenia z TryForge! 🚀**

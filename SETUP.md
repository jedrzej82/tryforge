# ⚙️ INSTRUKCJA INSTALACJI I KONFIGURACJI

**Kompletny przewodnik po setupie TryForge w Ubuntu VirtualBox**

---

## 📋 SPIS TREŚCI

1. [Wymagania Systemowe](#wymagania-systemowe)
2. [Instalacja Podstawowa](#instalacja-podstawowa)
3. [Konfiguracja Triple AI](#konfiguracja-triple-ai)
4. [Pierwszy Start](#pierwszy-start)
5. [Troubleshooting](#troubleshooting)

---

## 💻 WYMAGANIA SYSTEMOWE

### Host System (Windows/Mac/Linux)

**Minimum:**
- RAM: 8GB
- Dysk: 50GB wolnego miejsca
- Procesor: Dual-core 2GHz+
- VirtualBox 6.0+

**Rekomendowane:**
- RAM: 16GB+
- Dysk: 100GB+ SSD
- Procesor: Quad-core 2.5GHz+
- VirtualBox 7.0+

---

### Ubuntu VirtualBox VM

**Konfiguracja VM:**
```
OS: Ubuntu 22.04 LTS (64-bit)
RAM: 4GB minimum (8GB rekomendowane)
Dysk: 30GB minimum (50GB rekomendowane)
CPU: 2 cores minimum (4 cores rekomendowane)
Network: NAT lub Bridged Adapter
```

**Dodatkowe Ustawienia:**
```
Display:
- Video Memory: 128MB
- Graphics Controller: VBoxSVGA
- Enable 3D Acceleration

Network:
- Adapter 1: NAT (for internet)
- Port Forwarding:
  - Host: 5173 → Guest: 5173 (frontend)
  - Host: 3000 → Guest: 3000 (backend)
```

---

## 🚀 INSTALACJA PODSTAWOWA

### Krok 1: Przygotowanie Ubuntu VM

**Aktualizacja Systemu:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Instalacja Podstawowych Narzędzi:**
```bash
sudo apt install -y \
  git \
  curl \
  wget \
  build-essential \
  software-properties-common \
  ca-certificates \
  gnupg \
  lsb-release
```

---

### Krok 2: Instalacja Node.js

**Instalacja Node.js 18.x (LTS):**
```bash
# Dodaj NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instaluj Node.js i npm
sudo apt install -y nodejs

# Weryfikacja
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

**Konfiguracja npm (opcjonalne):**
```bash
# Globalny katalog bez sudo
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Dodaj do PATH (w ~/.bashrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### Krok 3: Instalacja PostgreSQL

**Instalacja PostgreSQL 14:**
```bash
# Instalacja
sudo apt install -y postgresql postgresql-contrib

# Start i enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Weryfikacja
sudo systemctl status postgresql
```

**Konfiguracja PostgreSQL:**
```bash
# Przełącz się na użytkownika postgres
sudo -u postgres psql

# W psql console:
-- Utwórz użytkownika dla aplikacji
CREATE USER devuser WITH PASSWORD 'devpass123';

-- Daj uprawnienia
ALTER USER devuser CREATEDB;

-- Wyjdź
\q
```

**Test połączenia:**
```bash
psql -U devuser -d postgres -h localhost
# Password: devpass123
# Jeśli działa - PostgreSQL gotowy!
```

---

### Krok 4: Instalacja Redis (dla caching)

**Instalacja:**
```bash
sudo apt install -y redis-server

# Start i enable
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Weryfikacja
redis-cli ping
# Odpowiedź: PONG
```

**Konfiguracja (opcjonalna):**
```bash
sudo nano /etc/redis/redis.conf

# Zmień jeśli potrzeba:
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart po zmianach
sudo systemctl restart redis-server
```

---

### Krok 5: Instalacja Claude Code CLI

**Instalacja globalnie:**
```bash
npm install -g @anthropic-ai/claude-code

# Weryfikacja
claude --version
```

**Konfiguracja (pierwsze uruchomienie):**
```bash
claude

# Nastąpi:
# 1. Prośba o API key (jeśli potrzebny)
# 2. Konfiguracja preferences
# 3. Setup workspace
```

---

### Krok 6: Instalacja Playwright

**Instalacja (dla GitHub Spark automation):**
```bash
# Instalacja playwright
npm install -g playwright

# Instalacja browsers
npx playwright install chromium

# Install system dependencies
npx playwright install-deps chromium
```

**Test Playwright:**
```bash
# Utwórz test file
cat > test-playwright.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://github.com');
  await page.screenshot({ path: 'github.png' });
  await browser.close();
  console.log('✅ Playwright działa!');
})();
EOF

# Uruchom test
node test-playwright.js

# Jeśli pojawił się screenshot github.png - działa!
```

---

### Krok 7: Instalacja Dodatkowych Narzędzi

**Firefox (dla Spark UI):**
```bash
sudo apt install -y firefox
```

**Git Configuration:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**VSCode (opcjonalnie):**
```bash
sudo snap install code --classic
```

---

## 🤖 KONFIGURACJA TRIPLE AI

### 1. Claude API (już skonfigurowane przez CLI)

Claude Code CLI używa Claude API automatycznie.

---

### 2. GitHub Spark Setup

**Utworzenie GitHub Account:**
```
1. Idź do https://github.com
2. Utwórz account (jeśli nie masz)
3. Verify email
```

**Konfiguracja GitHub Spark Access:**

W projekcie zostanie utworzony automatyczny script który:
- Uruchomi Playwright
- Otworzy GitHub Spark
- Zaloguje się (raz, sesja będzie zapisana)
- Będzie automatyzował Spark requests

**Pierwsza Konfiguracja (one-time):**
```bash
# Po instalacji systemu, uruchom:
claude --teleport session_[TWÓJ_SESSION_ID]

# System automatycznie zapyta o GitHub login podczas pierwszego użycia Spark
# Logowanie nastąpi w browserze (Firefox)
# Sesja będzie zapisana w .github-session/auth.json
# Następne użycia będą automatyczne!
```

---

### 3. Pollinations AI Setup

**Brak konfiguracji potrzebnej!**

Pollinations AI działa przez publiczne API:
```
https://image.pollinations.ai/prompt/[PROMPT]
```

System automatycznie:
- Tworzy prompts (Claude generuje opisy)
- Pobiera obrazy
- Optymalizuje je
- Zapisuje w projekcie

Nie potrzeba API keys, account, ani konfiguracji!

---

## 🎯 PIERWSZY START

### Krok 1: Sklonuj Repozytorium Template

**Clone project template:**
```bash
cd ~
git clone https://github.com/jedrzej82/statsmate-sports-ana.git
cd statsmate-sports-ana
```

**Lub stwórz nowy projekt:**
```bash
mkdir my-tryforge
cd my-tryforge
git init
```

---

### Krok 2: Uruchom Claude Code CLI

**Teleport do istniejącego projektu:**
```bash
cd ~/statsmate-sports-ana
claude --teleport session_011CUhVxdLSL6szuDF44cnsZ
```

**Lub start nowej sesji:**
```bash
cd ~/my-tryforge
claude
```

---

### Krok 3: Inicjalizacja Systemu

**W Claude Code CLI, wpisz:**
```
setup: initialize
```

**System automatycznie:**
```
✅ Sprawdzi wszystkie dependencies
✅ Skonfiguruje PostgreSQL connection
✅ Ustawi Redis connection
✅ Utworzy folder structure
✅ Skonfiguruje environment variables
✅ Utworzy automation scripts
✅ Skonfiguruje Playwright dla Spark
✅ Utworzy development database
✅ Przygotuje wszystko do użycia

Czas: ~2-3 minuty
```

---

### Krok 4: Test Systemu

**Utwórz pierwszą testową aplikację:**
```
create: Simple todo app
```

**System powinien:**
```
📋 Planning architecture...
✅ Architecture ready

🎨 Generating graphics with Pollinations...
✅ Logo created
✅ Background created

🤖 Generating UI with GitHub Spark...
[Browser opens automatically]
✅ Components generated
✅ Committed to GitHub

🧠 Creating backend with Claude...
✅ Database schema created
✅ API routes created
✅ Tests created

🔧 Integrating everything...
✅ Integration complete

🧪 Running tests...
✅ All tests passed

🚀 Deploying locally...
✅ Backend started on http://localhost:3000
✅ Frontend started on http://localhost:5173

🎉 TODO APP CREATED!
Time: ~4 minutes

Access: http://localhost:5173
```

**Jeśli to wszystko działa - system gotowy!** ✅

---

## 🔧 KONFIGURACJA ZAAWANSOWANA

### Environment Variables

**Główny plik konfiguracyjny:**
```bash
# ~/.tryforge/.env

# Database
DATABASE_URL=postgresql://devuser:devpass123@localhost:5432/bolt_apps
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass123

# Redis
REDIS_URL=redis://localhost:6379

# Ports
FRONTEND_PORT=5173
BACKEND_PORT=3000

# GitHub
GITHUB_USERNAME=your-username
GITHUB_EMAIL=your-email@example.com

# Pollinations AI
POLLINATIONS_BASE_URL=https://image.pollinations.ai

# Development
NODE_ENV=development
LOG_LEVEL=info

# Playwright
PLAYWRIGHT_HEADLESS=false  # Set to true to hide browser
```

---

### Automation Scripts Location

System utworzy:
```
~/.tryforge/
├── automation/
│   ├── spark-bot.js          # GitHub Spark automation
│   ├── pollinations.js       # Image generation
│   ├── integrator.js         # Integration scripts
│   └── deploy.js             # Deployment automation
├── templates/
│   ├── react-template/       # React project template
│   ├── vue-template/         # Vue project template
│   └── express-template/     # Express backend template
├── cache/
│   ├── images/               # Cached Pollinations images
│   ├── components/           # Cached Spark components
│   └── npm/                  # npm cache
└── .github-session/
    └── auth.json             # Saved GitHub session
```

---

### Performance Tuning

**PostgreSQL Tuning:**
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# Dla development (4GB RAM VM):
shared_buffers = 512MB
effective_cache_size = 2GB
maintenance_work_mem = 128MB
work_mem = 16MB

# Restart
sudo systemctl restart postgresql
```

**Redis Tuning:**
```bash
sudo nano /etc/redis/redis.conf

# For caching optimization:
maxmemory 512mb
maxmemory-policy allkeys-lru

# Restart
sudo systemctl restart redis-server
```

**Node.js Memory:**
```bash
# Zwiększ limit dla dużych projektów
export NODE_OPTIONS="--max-old-space-size=4096"

# Dodaj do ~/.bashrc
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
```

---

## 🚨 TROUBLESHOOTING

### Problem 1: PostgreSQL nie startuje

**Diagnoza:**
```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql -n 50
```

**Rozwiązanie:**
```bash
# Recreate cluster jeśli uszkodzony
sudo pg_dropcluster --stop 14 main
sudo pg_createcluster 14 main
sudo systemctl start postgresql
```

---

### Problem 2: npm permissions errors

**Rozwiązanie:**
```bash
# Fix npm global permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall global packages
npm install -g @anthropic-ai/claude-code playwright
```

---

### Problem 3: Playwright browser nie otwiera

**Rozwiązanie:**
```bash
# Reinstall browsers
npx playwright install --force chromium

# Install system dependencies
sudo npx playwright install-deps

# Test
npx playwright open https://github.com
```

---

### Problem 4: Port already in use

**Diagnoza:**
```bash
# Check co używa portu 3000
lsof -ti:3000

# Check co używa portu 5173
lsof -ti:5173
```

**Rozwiązanie:**
```bash
# Kill process na porcie
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:5173)

# Lub zmień porty w config
```

---

### Problem 5: Redis connection refused

**Rozwiązanie:**
```bash
# Check status
sudo systemctl status redis-server

# Restart
sudo systemctl restart redis-server

# Check port
ss -tulpn | grep 6379

# Test connection
redis-cli ping
```

---

### Problem 6: GitHub Spark automation fails

**Diagnoza:**
```bash
# Check saved session
ls -la ~/.tryforge/.github-session/

# Check browser
firefox --version

# Check Playwright
npx playwright --version
```

**Rozwiązanie:**
```bash
# Delete saved session (force re-login)
rm -rf ~/.tryforge/.github-session/

# Reinstall playwright
npm install -g playwright@latest
npx playwright install chromium

# Try again - will prompt for GitHub login
```

---

## ✅ VERIFICATION CHECKLIST

### Po instalacji sprawdź:

```
□ Node.js zainstalowany
  node --version → v18.x.x lub wyższy

□ npm działa
  npm --version → 9.x.x lub wyższy

□ PostgreSQL działa
  sudo systemctl status postgresql → active

□ Redis działa
  redis-cli ping → PONG

□ Claude Code CLI zainstalowany
  claude --version → pokazuje wersję

□ Playwright zainstalowany
  npx playwright --version → pokazuje wersję

□ Git skonfigurowany
  git config --global user.name → pokazuje name

□ Firefox zainstalowany
  firefox --version → pokazuje wersję

□ Porty dostępne
  lsof -ti:3000 → nic (port wolny)
  lsof -ti:5173 → nic (port wolny)

□ Test aplikacja stworzona
  create: Simple test app → działa!
```

---

## 📊 SYSTEM STATUS

**Sprawdź status systemu:**
```bash
# W Claude Code CLI:
status

# Pokaże:
System Status: ✅ Ready

Services:
✅ PostgreSQL: Running
✅ Redis: Running
✅ Node.js: v18.17.0
✅ npm: v9.8.1
✅ Playwright: Ready

Automation:
✅ Pollinations AI: Ready
✅ GitHub Spark: Ready (session valid)
✅ Claude: Ready

Resources:
- CPU: 45% (4 cores available)
- RAM: 3.2GB / 8GB (40% used)
- Disk: 15GB / 50GB (30% used)

Recent Activity:
- Last app created: 2 hours ago
- Apps created today: 3
- Total apps: 12

Quick Stats:
- Average creation time: 4.5 minutes
- Success rate: 100%
- Tests passing: 100%
```

---

## 🎓 NEXT STEPS

**Po ukończeniu setupu:**

1. **Przeczytaj dokumentację:**
   ```
   - CREATE_MODE.md - Tworzenie aplikacji
   - REFACTOR_MODE.md - Ulepszanie aplikacji
   - COMMANDS.md - Wszystkie komendy
   - WORKFLOWS.md - Przykłady użycia
   ```

2. **Utwórz pierwszą prawdziwą aplikację:**
   ```
   create: [Twój pomysł]
   ```

3. **Eksperymentuj z refactorem:**
   ```
   refactor: statsmate
   ```

4. **Dołącz do community:**
   - GitHub Discussions
   - Discord server
   - Issue tracker

---

**Setup complete! Gotowy do tworzenia aplikacji w minuty!** 🚀

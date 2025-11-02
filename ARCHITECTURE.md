# 🏗️ ARCHITEKTURA SYSTEMU TRYFORGE

**Szczegółowy opis architektury systemu tworzenia aplikacji webowych**

---

## 📋 SPIS TREŚCI

1. [Przegląd Architektury](#przegląd-architektury)
2. [Warstwy Systemu](#warstwy-systemu)
3. [Flow Danych](#flow-danych)
4. [Komponenty](#komponenty)
5. [Komunikacja Między Warstwami](#komunikacja-między-warstwami)

---

## 🎯 PRZEGLĄD ARCHITEKTURY

### Filozofia Projektowa

System oparty jest na **architekturze warstwowej** z wyraźnym podziałem odpowiedzialności:

**Zasady:**
- Każda warstwa ma jedną, jasno określoną rolę
- Warstwy komunikują się tylko z sąsiednimi
- AI services są wymienne i niezależne
- Użytkownik widzi tylko interfejs CLI
- Automatyzacja ukryta przed użytkownikiem

### Diagram Wysokiego Poziomu

```
┌─────────────────────────────────────────────┐
│           UŻYTKOWNIK (Terminal)             │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│       WARSTWA 1: CLI INTERFACE              │
│         (Claude Code CLI)                   │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    WARSTWA 2: ORCHESTRATION LAYER           │
│         (Claude - Główny AI)                │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    WARSTWA 3: AI SERVICES LAYER             │
│  ┌─────────┬─────────┬──────────────┐      │
│  │Pollina- │ GitHub  │   Claude     │      │
│  │tions AI │  Spark  │  (Backend)   │      │
│  └─────────┴─────────┴──────────────┘      │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    WARSTWA 4: AUTOMATION LAYER              │
│  ┌──────────┬──────────┬──────────┐        │
│  │Playwright│   Git    │  Build   │        │
│  │Automation│Automation│Automation│        │
│  └──────────┴──────────┴──────────┘        │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    WARSTWA 5: EXECUTION ENVIRONMENT         │
│       (VirtualBox Ubuntu)                   │
│  ┌──────────┬──────────┬──────────┐        │
│  │PostgreSQL│ Node.js  │ Frontend │        │
│  │ Database │ Backend  │Dev Server│        │
│  └──────────┴──────────┴──────────┘        │
└─────────────────────────────────────────────┘
```

---

## 🔷 WARSTWY SYSTEMU

### WARSTWA 1: CLI Interface

**Rola:** Punkt kontaktu z użytkownikiem

**Odpowiedzialności:**
- Przyjmowanie komend tekstowych od użytkownika
- Wyświetlanie progress indicators
- Pokazywanie real-time feedback
- Formatowanie output (kolory, emoji, tabele)
- Obsługa błędów i warnings

**Technologie:**
- Claude Code CLI
- Node.js terminal interface
- ANSI colors dla czytelności
- Markdown rendering w terminalu

**Interakcje:**
- INPUT: Komendy użytkownika (tekstowe)
- OUTPUT: Feedback, progress, results
- Komunikacja z Warstwą 2 (Orchestration)

**Przykłady Interakcji:**

**Tworzenie nowej aplikacji:**
```
User → CLI: "create: Blog platform with comments"
CLI → Orchestrator: {type: "create", description: "Blog platform..."}
Orchestrator → CLI: {status: "planning", progress: 10}
CLI → User: "📋 Planning architecture... 10%"
```

**Refaktoryzacja:**
```
User → CLI: "refactor: improve performance"
CLI → Orchestrator: {type: "refactor", target: "performance"}
Orchestrator → CLI: {status: "analyzing", files: 45}
CLI → User: "🔍 Analyzing 45 files... 25%"
```

---

### WARSTWA 2: Orchestration Layer (Claude)

**Rola:** Mózg całego systemu

**Odpowiedzialności:**
- Analiza intencji użytkownika
- Planowanie architektury aplikacji
- Podział zadań między AI services
- Koordynacja workflow
- Zarządzanie stanem całego procesu
- Integracja komponentów od różnych AI
- Kontrola jakości i testing
- Final assembly aplikacji

**Kluczowe Moduły:**

**1. Intent Analyzer**
- Rozumie co użytkownik chce zrobić
- Klasyfikuje typ zadania (create/refactor)
- Wyciąga wymagania funkcjonalne
- Identyfikuje technologie do użycia

**2. Architecture Planner**
- Projektuje strukturę bazy danych
- Planuje API endpoints
- Określa komponenty frontend
- Wybiera patterns i best practices

**3. Task Distributor**
- Dzieli pracę między AI services
- Określa co robi Pollinations
- Określa co robi Spark
- Określa co Claude robi sam
- Ustala kolejność wykonania

**4. Integration Manager**
- Łączy komponenty od różnych AI
- Naprawia konflikty
- Dodaje missing connections
- Testuje integracje

**5. Quality Controller**
- Uruchamia testy
- Sprawdza best practices
- Weryfikuje security
- Optymalizuje performance

**Flow Decyzyjny:**

**CREATE MODE:**
```
1. Receive user description
2. Analyze requirements
3. Plan database schema
4. Plan API structure
5. Plan frontend components
6. Identify graphics needs
7. Delegate to AI services:
   → Pollinations: Generate graphics
   → Spark: Build UI components
   → Claude: Build backend
8. Wait for all AI to finish
9. Integrate everything
10. Test
11. Deploy locally
12. Report to user
```

**REFACTOR MODE:**
```
1. Receive refactor request
2. Scan entire codebase
3. Identify issues/opportunities
4. Generate improvement plan
5. Present plan to user
6. Get user approval
7. Delegate improvements:
   → Pollinations: New graphics if needed
   → Spark: UI modernization
   → Claude: Backend optimization
8. Apply changes incrementally
9. Run regression tests
10. Show before/after comparison
11. Commit changes
```

---

### WARSTWA 3: AI Services Layer

**Rola:** Wyspecjalizowane AI do konkretnych zadań

**Trzy niezależne serwisy:**

#### 🎨 Pollinations AI Service

**Specjalizacja:** Generowanie grafiki

**Kiedy używany:**
- Logo i branding
- Hero images
- Background images
- Illustrations (empty states, errors, success)
- Icons
- Product images
- User avatars (placeholders)
- Decorative elements

**Input Format:**
```
{
  type: "generate_image",
  description: "Modern gradient background purple blue",
  size: {width: 1920, height: 1080},
  style: "modern minimalist",
  purpose: "login_background"
}
```

**Output Format:**
```
{
  url: "https://image.pollinations.ai/prompt/...",
  localPath: "src/assets/login-bg.png",
  metadata: {
    width: 1920,
    height: 1080,
    format: "png"
  }
}
```

**Integracja:**
- API calls przez HTTP
- Automatyczny download obrazów
- Optymalizacja rozmiaru
- Konwersja formatów jeśli potrzeba

#### 🤖 GitHub Spark Service

**Specjalizacja:** Frontend UI components

**Kiedy używany:**
- React/Vue/Angular components
- Page layouts
- Forms i inputs
- Navigation
- Responsive design
- CSS styling
- Animations
- State management

**Input Format:**
```
{
  type: "generate_component",
  componentName: "UserProfile",
  description: "User profile page with avatar and stats",
  framework: "React",
  styling: "CSS modules",
  customAssets: [
    "src/assets/profile-bg.png",
    "src/assets/avatar-placeholder.png"
  ],
  apiEndpoints: [
    "/api/users/profile",
    "/api/users/stats"
  ]
}
```

**Output Format:**
```
{
  files: [
    "src/components/UserProfile.jsx",
    "src/components/UserProfile.module.css",
    "src/components/StatsCard.jsx"
  ],
  gitCommit: "abc123def",
  preview: "https://spark.github.com/preview/..."
}
```

**Integracja:**
- Playwright automation
- Automatyczne commit do GitHub
- Auto-pull do local repo
- Parsing generated files

#### 🧠 Claude Backend Service

**Specjalizacja:** Backend logic, database, API

**Kiedy używany:**
- Database schema design
- API endpoints (REST/GraphQL)
- Business logic
- Authentication/Authorization
- Data validation
- Error handling
- Testing
- Documentation

**Input Format:**
```
{
  type: "generate_backend",
  features: [
    "user_authentication",
    "blog_posts_crud",
    "comments_system"
  ],
  database: "PostgreSQL",
  framework: "Express.js",
  architecture: "REST API"
}
```

**Output Format:**
```
{
  files: [
    "backend/src/routes/auth.js",
    "backend/src/routes/posts.js",
    "backend/src/models/User.js",
    "backend/sql/schema.sql"
  ],
  endpoints: [
    "POST /api/auth/login",
    "GET /api/posts",
    "POST /api/posts/:id/comments"
  ],
  tests: [
    "backend/tests/auth.test.js",
    "backend/tests/posts.test.js"
  ]
}
```

**Integracja:**
- Bezpośrednie tworzenie plików
- Automatyczne SQL migrations
- Automatyczne npm install
- Automatyczne testy

---

### WARSTWA 4: Automation Layer

**Rola:** Automatyzacja procesów manualnych

**Trzy główne moduły:**

#### 🎭 Playwright Automation Module

**Zadanie:** Automatyzacja interakcji z GitHub Spark

**Proces:**
```
1. Launch Chromium browser (headless lub visible)
2. Navigate to GitHub Spark
3. Authenticate (using saved session)
4. Load repository
5. Select correct branch
6. Paste AI-generated prompt
7. Click "Generate"
8. Wait for Spark to finish
9. Wait for commit to GitHub
10. Close browser
11. Notify Orchestrator
```

**Obsługa Błędów:**
- Session timeout → Re-authenticate
- Network error → Retry with backoff
- Generation timeout → Cancel and notify
- Unexpected UI → Screenshot and report

**Konfiguracja:**
- Headless mode dla production
- Visible mode dla debugging
- Screenshots on errors
- Video recording opcjonalnie

#### 🔄 Git Automation Module

**Zadanie:** Automatyczne zarządzanie Git

**Operacje:**
```
Auto-Commit:
- Wykrywa nowe/zmienione pliki
- Generuje sensowny commit message
- Commituje automatycznie
- Pushuje do remote

Auto-Pull:
- Monitoruje remote changes
- Wykrywa nowe commity (np. od Spark)
- Pulluje automatycznie
- Rozwiązuje merge conflicts (proste przypadki)
- Notyfikuje użytkownika o zmianach

Branch Management:
- Tworzy feature branches
- Merguje do main
- Taguje releases
```

**Smart Commit Messages:**
```
Wykrywa typ zmiany:
- "feat: Add user authentication" (nowa funkcja)
- "refactor: Improve database queries" (refactor)
- "fix: Resolve login bug" (bugfix)
- "style: Update UI components" (styling)
- "docs: Add API documentation" (docs)
```

#### ⚙️ Build Automation Module

**Zadanie:** Automatyczne buildy i reload

**Procesy:**

**Development Mode:**
```
1. Watch file changes
2. Auto-restart backend on .js changes
3. Hot reload frontend on .jsx changes
4. Auto-refresh browser
5. Show build errors in CLI
```

**Production Build:**
```
1. Run tests
2. Build frontend (optimize, minify)
3. Prepare backend (remove dev dependencies)
4. Generate production .env
5. Create deployment package
6. Run final smoke tests
```

**Dependency Management:**
```
Auto npm install when:
- package.json changes detected
- New dependencies needed by AI
- Security updates available

Auto cleanup:
- Remove unused dependencies
- Update outdated packages
- Fix vulnerability warnings
```

---

### WARSTWA 5: Execution Environment

**Rola:** Środowisko uruchomieniowe aplikacji

**Komponenty:**

#### 🗄️ PostgreSQL Database

**Konfiguracja:**
- Local instance w VirtualBox
- Auto-create databases
- Auto-run migrations
- Backup automation
- Performance monitoring

**Zarządzanie:**
```
Create Mode:
- Nowa baza dla każdej nowej aplikacji
- Schema generowany przez Claude
- Initial data seeding
- Indexes i constraints automatycznie

Refactor Mode:
- Migrations dla zmian schema
- Data preservation
- Rollback capability
```

#### 🟢 Node.js Backend Server

**Konfiguracja:**
- Express.js domyślnie
- Auto-restart on changes
- Environment variables management
- Logging i monitoring
- Error tracking

**Features:**
```
Development:
- Nodemon auto-restart
- Detailed error messages
- Debug mode
- API documentation (auto-generated)

Production:
- PM2 process manager
- Clustering
- Load balancing
- Health checks
```

#### ⚛️ Frontend Dev Server

**Konfiguracja:**
- Vite domyślnie (szybki)
- Hot Module Replacement
- Proxy do backend API
- HTTPS w dev mode
- Mobile preview

**Features:**
```
Development:
- Instant HMR
- Error overlay
- Component inspector
- Performance metrics

Build:
- Minification
- Code splitting
- Tree shaking
- Asset optimization
```

---

## 🔄 FLOW DANYCH

### CREATE MODE - Kompletny Flow

**Faza 1: Inicjalizacja**
```
User Input: "create: Social media app for sports fans"
    ↓
CLI Interface: Parse command
    ↓
Orchestrator: Analyze intent
    ↓
Architecture Planner: Design system
    ↓
Output: Complete architecture plan
```

**Faza 2: Graphics Generation**
```
Orchestrator: Identify graphics needs
    ↓
Task Distributor: Create Pollinations tasks
    ↓
Pollinations AI: Generate images
    ↓
Automation: Download & optimize
    ↓
Output: src/assets/*.png files
```

**Faza 3: Frontend Generation**
```
Orchestrator: Build Spark prompt
    ↓
Playwright: Automate Spark interaction
    ↓
GitHub Spark: Generate React components
    ↓
Git Automation: Auto-pull changes
    ↓
Output: src/components/*.jsx files
```

**Faza 4: Backend Generation**
```
Orchestrator: Design API
    ↓
Claude Backend: Generate code
    ↓
File System: Write backend files
    ↓
Database: Run migrations
    ↓
Output: backend/src/*.js + database
```

**Faza 5: Integration**
```
Integration Manager: Connect components
    ↓
Frontend: Add API calls
    ↓
Backend: Configure CORS
    ↓
Database: Seed initial data
    ↓
Output: Integrated application
```

**Faza 6: Testing & Deployment**
```
Quality Controller: Run tests
    ↓
Build Automation: Build application
    ↓
Execution Environment: Start servers
    ↓
CLI Interface: Show live URL
    ↓
Output: Running application
```

### REFACTOR MODE - Kompletny Flow

**Faza 1: Analysis**
```
User Input: "refactor: improve statsmate UI"
    ↓
CLI Interface: Parse command
    ↓
Orchestrator: Scan codebase
    ↓
Code Analyzer: Find issues
    ↓
Output: Analysis report
```

**Faza 2: Planning**
```
Improvement Planner: Generate proposals
    ↓
CLI Interface: Show proposals to user
    ↓
User: Approve changes
    ↓
Task Distributor: Create improvement tasks
    ↓
Output: Improvement plan
```

**Faza 3: Execution**
```
Parallel execution:

Graphics Track:
Pollinations → New images → Download

UI Track:
Spark → New components → Auto-pull

Backend Track:
Claude → Optimizations → Apply changes
```

**Faza 4: Testing**
```
Regression Tests: Ensure nothing broke
    ↓
Performance Tests: Measure improvements
    ↓
Visual Tests: Compare UI before/after
    ↓
Output: Test results
```

**Faza 5: Completion**
```
Git: Commit all changes
    ↓
Build: Rebuild application
    ↓
Server: Restart with changes
    ↓
CLI: Show comparison report
    ↓
Output: Improved application
```

---

## 🔌 KOMUNIKACJA MIĘDZY WARSTWAMI

### Protokoły Komunikacji

**CLI ↔ Orchestrator:**
```
Format: JSON messages
Transport: Internal Node.js IPC
Frequency: Real-time (event-driven)

Example:
{
  type: "command",
  command: "create",
  params: {
    description: "Blog platform",
    features: ["comments", "likes"]
  },
  timestamp: "2025-11-02T10:00:00Z"
}
```

**Orchestrator ↔ AI Services:**
```
Pollinations:
  - Protocol: HTTPS REST API
  - Format: URL parameters
  - Response: Binary image data

Spark:
  - Protocol: Browser automation (Playwright)
  - Format: DOM interactions
  - Response: Git commits

Claude Backend:
  - Protocol: Internal function calls
  - Format: JavaScript objects
  - Response: File system operations
```

**Orchestrator ↔ Automation:**
```
Format: Event emitters
Transport: Node.js EventEmitter
Pattern: Observer pattern

Example:
orchestrator.on('spark-needed', async (prompt) => {
  await playwrightAutomation.runSpark(prompt);
  orchestrator.emit('spark-complete', files);
});
```

**Automation ↔ Environment:**
```
Git:
  - Commands via child_process
  - Monitoring via fs.watch

Build:
  - npm scripts via child_process
  - Log streaming via stdout/stderr

Database:
  - pg library for PostgreSQL
  - SQL queries via connection pool
```

---

## 🎯 DESIGN PATTERNS UŻYWANE

### 1. Orchestrator Pattern
- Centralny koordynator (Claude)
- Delegacja do wyspecjalizowanych services
- Aggregacja rezultatów

### 2. Pipeline Pattern
- Sekwencyjne przetwarzanie
- Każdy stage dodaje wartość
- Clear input/output contracts

### 3. Observer Pattern
- Event-driven communication
- Loose coupling między komponentami
- Asynchronous notifications

### 4. Strategy Pattern
- Wybór AI service bazując na zadaniu
- Wymienne implementacje
- Runtime decision making

### 5. Factory Pattern
- Tworzenie różnych typów aplikacji
- Parametryzowane generowanie
- Reusable templates

---

## 📊 SKALOWALNOŚĆ I PERFORMANCE

### Optymalizacje

**Parallel Processing:**
- Graphics generation równolegle
- Multiple Spark tasks jednocześnie
- Backend i frontend generation w parallel

**Caching:**
- Downloaded images cached
- npm packages cached
- Build artifacts cached
- Spark prompts i results cached

**Resource Management:**
- Connection pooling dla database
- Browser instance reuse w Playwright
- Memory cleanup po operacjach

**Load Distribution:**
- Queue system dla długich operacji
- Priority system dla critical tasks
- Backpressure handling

---

## 🔐 SECURITY CONSIDERATIONS

### Bezpieczeństwo na Każdym Poziomie

**CLI Layer:**
- Input sanitization
- Command validation
- User authentication

**Orchestrator:**
- Code injection prevention
- Safe eval practices
- Dependency verification

**AI Services:**
- API key management
- Rate limiting
- Secure credential storage

**Automation:**
- Browser sandboxing
- Safe git operations
- File system permissions

**Environment:**
- Database encryption
- Secure env variables
- Network isolation

---

**Ta architektura zapewnia:**
- ✅ Modułowość i maintainability
- ✅ Skalowalność i performance
- ✅ Bezpieczeństwo i reliability
- ✅ Łatwość rozbudowy
- ✅ Doskonałe user experience

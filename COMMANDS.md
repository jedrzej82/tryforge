# 📝 DOSTĘPNE KOMENDY

**Kompletna lista komend systemu TryForge**

---

## 📋 SPIS TREŚCI

1. [CREATE Commands](#create-commands)
2. [REFACTOR Commands](#refactor-commands)
3. [ANALYZE Commands](#analyze-commands)
4. [DEPLOY Commands](#deploy-commands)
5. [UTILITY Commands](#utility-commands)

---

## 🚀 CREATE COMMANDS

### Podstawowe Tworzenie

**Komenda:**
```
create: [opis aplikacji]
```

**Przykłady:**
```
create: Blog platform with posts and comments
create: E-commerce store for sports equipment
create: Social media app for sharing workouts
create: Project management tool for remote teams
create: Booking system for sports facilities
```

**Co się dzieje:**
- Claude analizuje opis
- Claude planuje architekturę (database, API, components)
- Claude tworzy szczegółowe opisy dla Pollinations i Spark
- Pollinations generuje grafiki (według opisów Claude)
- Spark generuje frontend (według opisów Claude)
- Claude tworzy backend sam
- Claude integruje wszystko razem
- Aplikacja gotowa!

---

### CREATE z Opcjami

**Framework Selection:**
```
create: Blog platform --framework vue
create: E-commerce --framework angular
create: Dashboard --framework svelte
```

**Opcje frameworków:**
- `react` (default)
- `vue`
- `angular`
- `svelte`

---

**Styling Selection:**
```
create: Blog --styling tailwind
create: Store --styling scss
create: App --styling styled-components
```

**Opcje stylingu:**
- `css` (CSS modules, default)
- `scss`
- `tailwind`
- `styled-components`
- `emotion`

---

**Database Selection:**
```
create: App --database mongodb
create: CRM --database mysql
create: Analytics --database postgresql
```

**Opcje database:**
- `postgresql` (default)
- `mysql`
- `mongodb`
- `sqlite`

---

**Authentication:**
```
create: App --auth jwt
create: Platform --auth oauth
create: System --auth session
create: Tool --auth none
```

**Opcje auth:**
- `jwt` (JSON Web Tokens, default)
- `oauth` (Google, GitHub, etc.)
- `session` (Session-based)
- `none` (No authentication)

---

**Graphics Style:**
```
create: App --graphics modern
create: Blog --graphics minimalist
create: Game --graphics playful
```

**Opcje graphics:**
- `modern` (default)
- `minimalist`
- `professional`
- `playful`
- `colorful`

---

**Complete Example:**
```
create: E-commerce platform for handmade crafts
  --framework react
  --styling tailwind
  --database postgresql
  --auth jwt
  --graphics professional
  --colors purple
  --features products,cart,checkout,reviews,admin
```

---

### CREATE Templates

**Minimal Template:**
```
create: Blog --template minimal
```
**Zawiera:**
- Basic structure only
- Minimum features
- No authentication
- Simple styling
- Fastest generation (2-3 min)

---

**Standard Template:**
```
create: Blog --template standard
```
**Zawiera:**
- Common features
- Authentication
- Modern styling
- Responsive design
- Standard generation time (4-6 min)

---

**Full Template:**
```
create: Blog --template full
```
**Zawiera:**
- All possible features
- Advanced authentication
- Premium styling
- Admin panel
- Analytics
- Longest generation time (8-12 min)

---

## 🔧 REFACTOR COMMANDS

### Podstawowy Refactor

**Komenda:**
```
refactor: [co ulepszyć]
```

**Przykłady:**
```
refactor: improve UI design
refactor: optimize performance
refactor: add dark mode
refactor: modernize components
refactor: improve mobile experience
```

**Co się dzieje:**
- Claude analizuje cały codebase
- Claude identyfikuje problemy
- Claude tworzy plan ulepszeń
- Claude tworzy opisy dla Pollinations i Spark
- Pollinations regeneruje lepsze grafiki (według opisów Claude)
- Spark modernizuje komponenty (według opisów Claude)
- Claude optymalizuje backend sam
- Claude integruje ulepszenia
- Pokazuje przed/po porównanie

---

### Targeted Refactor

**UI/UX Only:**
```
refactor: UI improvements only
refactor: modernize design
refactor: add dark mode support
refactor: improve responsive design
```

**Performance Only:**
```
refactor: performance optimization
refactor: optimize database queries
refactor: reduce bundle size
refactor: add caching layer
```

**Security Only:**
```
refactor: security improvements
refactor: fix vulnerabilities
refactor: add input validation
refactor: improve authentication
```

**Code Quality:**
```
refactor: improve code quality
refactor: reduce code duplication
refactor: add error handling
refactor: improve structure
```

---

### Refactor with Scope

**Specific Components:**
```
refactor: improve HomePage component
refactor: optimize Dashboard performance
refactor: redesign LoginForm
```

**Specific Features:**
```
refactor: improve search functionality
refactor: enhance user profile page
refactor: optimize product listing
```

**Full Application:**
```
refactor: complete modernization
refactor: full stack optimization
refactor: comprehensive improvements
```

---

## 🔍 ANALYZE COMMANDS

### Code Analysis

**Full Analysis:**
```
analyze: codebase
```
**Rezultat:**
- Code structure report
- Performance bottlenecks
- Security vulnerabilities
- Code quality metrics
- Improvement suggestions

---

**Performance Analysis:**
```
analyze: performance
```
**Rezultat:**
- Load time metrics
- Database query analysis
- Bundle size breakdown
- Memory usage patterns
- Optimization opportunities

---

**Security Analysis:**
```
analyze: security
```
**Rezultat:**
- Vulnerability scan
- Dependency check
- Authentication review
- Input validation gaps
- Security best practices

---

**UI/UX Analysis:**
```
analyze: ui
```
**Rezultat:**
- Design consistency check
- Accessibility score
- Mobile responsiveness
- User flow analysis
- UX improvements suggestions

---

### Specific Analysis

**Database Analysis:**
```
analyze: database
```
**Rezultat:**
- Query performance
- Missing indexes
- N+1 query problems
- Schema optimization
- Data integrity

---

**Bundle Analysis:**
```
analyze: bundle
```
**Rezultat:**
- Bundle size breakdown
- Large dependencies identified
- Tree-shaking opportunities
- Code splitting suggestions
- Lazy load candidates

---

**Dependencies Analysis:**
```
analyze: dependencies
```
**Rezultat:**
- Outdated packages
- Security vulnerabilities
- Unused dependencies
- License conflicts
- Update recommendations

---

## 🚀 DEPLOY COMMANDS

### Local Deployment

**Start Development:**
```
start
```
**Działanie:**
- Start PostgreSQL
- Start backend server
- Start frontend dev server
- Open browser preview
- Show live URLs

---

**Stop All:**
```
stop
```
**Działanie:**
- Stop frontend server
- Stop backend server
- Stop PostgreSQL (optional)

---

**Restart:**
```
restart
```
**Działanie:**
- Stop all servers
- Clear caches
- Restart all servers
- Reload browser

---

### Production Build

**Build for Production:**
```
build
```
**Działanie:**
- Run all tests
- Build frontend (minify, optimize)
- Prepare backend (remove dev deps)
- Generate production config
- Create deployment package

---

**Deploy Local:**
```
deploy: local
```
**Działanie:**
- Build production version
- Setup production database
- Start production servers
- Run smoke tests
- Show production URLs

---

## 🛠️ UTILITY COMMANDS

### Testing

**Run All Tests:**
```
test
```
**Działanie:**
- Backend unit tests
- Frontend component tests
- Integration tests
- E2E tests
- Coverage report

---

**Run Specific Tests:**
```
test: backend
test: frontend
test: integration
test: e2e
```

---

**Watch Mode:**
```
test: watch
```
**Działanie:**
- Run tests on file changes
- Continuous testing
- Fast feedback loop

---

### Code Quality

**Lint Code:**
```
lint
```
**Działanie:**
- ESLint check
- Prettier formatting
- TypeScript check (if applicable)
- Fix auto-fixable issues

---

**Format Code:**
```
format
```
**Działanie:**
- Prettier formatting
- Consistent code style
- Auto-fix spacing, indentation

---

### Database Operations

**Database Reset:**
```
db: reset
```
**Działanie:**
- Drop all tables
- Run migrations
- Seed default data

---

**Database Migrate:**
```
db: migrate
```
**Działanie:**
- Run pending migrations
- Update schema
- Backup before migrate

---

**Database Seed:**
```
db: seed
```
**Działanie:**
- Add sample data
- Create test users
- Populate tables

---

**Database Backup:**
```
db: backup
```
**Działanie:**
- Export current database
- Save to backups folder
- Timestamp backup file

---

### Documentation

**Generate Docs:**
```
docs: generate
```
**Działanie:**
- API documentation (from code comments)
- Component documentation
- Architecture diagrams
- README update

---

**View Docs:**
```
docs: view
```
**Działanie:**
- Start documentation server
- Open in browser
- Interactive API explorer

---

### Git Operations

**Auto Commit:**
```
commit: [message]
```
**Przykład:**
```
commit: Add user authentication
```
**Działanie:**
- Stage all changes
- Create commit with message
- Run pre-commit hooks

---

**Smart Commit:**
```
commit
```
**Działanie:**
- Analyze changes
- Generate descriptive commit message
- Commit automatically
- Follow conventional commits

---

### Help & Information

**Help:**
```
help
help: create
help: refactor
help: commands
```
**Rezultat:**
- Show available commands
- Show examples
- Show documentation links

---

**Status:**
```
status
```
**Rezultat:**
- Project info
- Running servers
- Recent activity
- Health checks
- Quick stats

---

**Version:**
```
version
```
**Rezultat:**
- System version
- Framework versions
- Database version
- Node.js version

---

## 🎯 ADVANCED COMMANDS

### Interactive Mode

**Interactive Create:**
```
create
```
**(No description - starts interactive wizard)**

**Workflow:**
```
System: What type of application?
1. Blog/Content Platform
2. E-commerce
3. Social Network
4. Project Management
5. Booking System
6. Custom

You: 2

System: E-commerce for what products?
You: Sports equipment

System: Required features?
[✓] Product catalog
[✓] Shopping cart
[✓] Checkout
[ ] Reviews
[ ] Wishlist
[ ] Admin panel

[... interactive selection continues ...]
```

---

### Batch Operations

**Multiple Commands:**
```
create: Blog platform && test && deploy: local
```
**Działanie:**
- Create application
- Run all tests
- Deploy locally
- All in sequence

---

### Custom Scripts

**Run Custom Script:**
```
run: [script-name]
```
**Przykłady:**
```
run: seed-products
run: generate-reports
run: cleanup-old-data
```

---

## 📊 COMMAND OUTPUT

### Success Output Example

```
✅ Command completed successfully!

📊 Results:
- Files created: 87
- Components: 24
- API endpoints: 15
- Database tables: 8
- Tests: 45 (all passing)
- Time taken: 5 minutes 32 seconds

🌐 Your application:
Frontend: http://localhost:5173
Backend:  http://localhost:3000
API Docs: http://localhost:3000/api-docs

📚 Next steps:
- Customize design: refactor: improve UI
- Add features: refactor: add [feature]
- Deploy: deploy: production
```

---

### Error Output Example

```
❌ Command failed

🔍 Error Details:
- Type: Database connection error
- Message: Could not connect to PostgreSQL
- Location: backend/src/db/connection.js:15

💡 Suggestions:
1. Ensure PostgreSQL is running:
   sudo systemctl start postgresql

2. Check database credentials in .env

3. Verify database exists:
   psql -l

Need help? Type: help: troubleshooting
```

---

## 💡 TIPS & TRICKS

### Komenda Shortcuts

**Quick Aliases:**
```
c: = create:
r: = refactor:
a: = analyze:
t: = test
d: = deploy:
```

**Przykłady:**
```
c: Blog platform
r: improve UI
a: performance
t
d: local
```

---

### Command History

**Show Recent Commands:**
```
history
```

**Repeat Last Command:**
```
!!
```

**Repeat Command by Number:**
```
!5
(repeats 5th command from history)
```

---

### Command Chaining

**Sequential Execution:**
```
command1 && command2 && command3
```
**Przykład:**
```
test && build && deploy: local
```
**(Next runs only if previous succeeds)**

---

**Parallel Execution:**
```
command1 & command2 & command3
```
**(All run simultaneously)**

---

**Conditional Execution:**
```
command1 || command2
```
**(command2 runs only if command1 fails)**

---

## 🎓 LEARNING PATH

**Beginner Commands:**
```
1. create: Simple blog
2. start
3. analyze: codebase
4. refactor: improve UI
5. test
```

**Intermediate Commands:**
```
1. create: E-commerce --template full
2. analyze: performance
3. refactor: optimize performance
4. db: seed
5. deploy: local
```

**Advanced Commands:**
```
1. create: Custom app with complex requirements
2. analyze: security && analyze: performance
3. refactor: comprehensive improvements
4. test: e2e && test: coverage
5. build && deploy: production
```

---

**Wszystkie komendy są intuicyjne i konwersacyjne - opisz co chcesz, Claude zrobi resztę!** 🚀

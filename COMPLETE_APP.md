# TryForge - Kompletna Aplikacja Wszystko-w-Jednym

## 🎉 Pełna Integracja - Jedna Aplikacja

TryForge to kompletna platforma rozwoju aplikacji enterprise z pełnym interfejsem webowym, która integruje wszystkie moduły w jednej aplikacji.

## 🚀 Uruchomienie Aplikacji

### Szybki Start

```bash
# Instalacja zależności
npm install

# Uruchomienie pełnej aplikacji webowej
npm start

# Aplikacja dostępna na: http://localhost:3000
```

### Dostępne Interfejsy

**Główny Dashboard**
- URL: `http://localhost:3000/`
- Centralny panel kontrolny ze wszystkimi modułami
- Szybki dostęp do wszystkich funkcji

**Visual Editor**
- URL: `http://localhost:3000/editor`
- Pełny edytor GUI z edycją kolorów i tekstu
- Edycja każdego elementu indywidualnie
- Real-time preview

**Workflow Builder**
- URL: `http://localhost:3000/workflow-builder`
- 30+ węzłów workflow
- Drag & drop visual builder
- Wykonywanie workflow w czasie rzeczywistym

**Agency Dashboard**
- URL: `http://localhost:3000/agency`
- Zarządzanie klientami i projektami
- Generator propozycji
- Time tracking i fakturowanie

## 📦 Wszystkie Moduły w Jednej Aplikacji

### 1. **TryForge Core** (`src/index.js`)
Główna klasa integrująca wszystkie moduły:
- Triple AI Orchestration
- Project Generator
- AI Code Generator
- Intelligent IDE
- Visual Editor
- Workflow Engine
- Workflow Builder
- Web Crawler
- Job Processor
- Rate Limiter
- Analytics Engine
- Big Data Processor
- Data Visualization
- Advanced Templates
- **Agency Tools** (NOWE!)

### 2. **Web Application** (`src/app.js`)
Kompletna aplikacja Express z:
- REST API dla wszystkich modułów
- WebSocket dla real-time updates
- Pełne GUI dla wszystkich funkcji
- 3 dedykowane interfejsy (Dashboard, Editor, Workflow, Agency)

### 3. **Agency Tools** (`src/core/agency-tools.js`)
Kompletne narzędzia dla agencji:
- Multi-tenant project management
- Client management i portal
- Proposal generator z cenami
- Time tracking
- Invoicing & billing
- Team collaboration
- Agency dashboard

## 🎯 API Endpoints

### Project Management
```bash
POST /api/projects/create      # Tworzenie projektu
POST /api/projects/analyze     # Analiza projektu
POST /api/projects/refactor    # Refaktoryzacja
```

### AI Code Generation
```bash
POST /api/ai/generate          # Generowanie kodu z promptu
POST /api/ai/review            # Review kodu przez AI
POST /api/ai/debug             # Debugging z AI
```

### Visual Editor
```bash
GET  /editor                   # Interfejs edytora
POST /api/editor/load          # Ładowanie projektu
GET  /api/editor/elements/:id  # Pobieranie elementów
POST /api/editor/update        # Aktualizacja elementu
POST /api/editor/export        # Export kodu
```

### Workflow Builder
```bash
GET  /workflow-builder         # Interfejs buildera
POST /api/workflows/create     # Tworzenie workflow
POST /api/workflows/execute/:id # Wykonywanie workflow
GET  /api/workflows/nodes      # Lista dostępnych węzłów
```

### Agency Tools
```bash
GET  /agency                   # Agency dashboard
POST /api/agency/clients       # Tworzenie klienta
POST /api/agency/projects      # Tworzenie projektu klienta
POST /api/agency/proposals     # Generowanie propozycji
GET  /api/agency/proposals/:id/export # Export propozycji
POST /api/agency/time          # Tracking czasu
GET  /api/agency/time/:projectId # Podsumowanie czasu
POST /api/agency/invoices      # Generowanie faktury
POST /api/agency/team          # Dodawanie członka zespołu
GET  /api/agency/dashboard     # Dashboard zespołu
GET  /api/agency/portal/:clientId # Portal klienta
```

### Analytics & Visualization
```bash
POST /api/analytics/track      # Śledzenie eventów
GET  /api/analytics/dashboard  # Dashboard analityki
POST /api/visualization/chart  # Tworzenie wykresów
POST /api/visualization/dashboard # Tworzenie dashboardów
```

### Web Crawler
```bash
POST /api/crawler/crawl        # Crawlowanie stron
```

### Templates
```bash
GET  /api/templates            # Lista szablonów
GET  /api/templates/:name      # Szczegóły szablonu
```

## 🎨 Funkcje Visual Editor

### Edycja Kompletna
- **Wybór elementu** - Kliknij dowolny element
- **Panel właściwości** - Edytuj wszystkie właściwości:
  - Treść tekstowa
  - Kolor tła
  - Kolor tekstu  
  - Rozmiar czcionki
  - Padding i margines
  - Ramki i zaokrąglenia
  - Pozycja i rozmiar

### Color Management
- **Color Picker** - Pełna paleta kolorów
- **Edytor schematów** - Edycja całej palety
- **Auto-Apply** - Zmiany aplikują się na wszystkie elementy
- **Export** - Zapis schematów kolorów

### Real-time
- **Live Preview** - Natychmiastowa wizualizacja
- **WebSocket** - Synchronizacja w czasie rzeczywistym
- **Undo/Redo** - Pełna historia zmian

## 🔄 Workflow Builder Features

### 30+ Węzłów Workflow

**Triggery (5):**
- Webhook, Schedule, Email, Database, File Watcher

**Akcje (8):**
- HTTP Request, Database Query, Send Email, Send SMS, Transform Data, AI Process, Web Scraper, File Operations

**Logika (5):**
- IF Condition, Switch, Loop, Merge, Split

**Integracje (6):**
- Slack, Discord, Telegram, Stripe, AWS S3, Google Sheets

**Zaawansowane (6):**
- ML Predict, Image Process, PDF Generate, Queue Job, Cache Data, Custom nodes

## 💼 Narzędzia Agencyjne

### Zarządzanie Klientami
```javascript
const client = await app.tryforge.createClient({
  name: 'ABC Company',
  email: 'contact@abc.com',
  company: 'ABC Inc.',
  industry: 'technology',
  size: 'medium'
});
```

### Projekty Klientów
```javascript
const project = await app.tryforge.createClientProject(clientId, {
  name: 'E-commerce Platform',
  template: 'marketplace',
  budget: 65000,
  deadline: '2024-12-31',
  milestones: [...]
});
```

### Generator Propozycji
```javascript
const proposal = await app.tryforge.generateProposal({
  clientId: client.id,
  title: 'E-commerce Platform Development',
  template: 'marketplace',
  projectType: 'marketplace'
});

// Export do HTML/PDF
const exported = await app.tryforge.exportProposal(proposal.id, 'html');
```

### Time Tracking
```javascript
await app.tryforge.trackTime({
  projectId: project.id,
  userId: 'dev-1',
  task: 'Frontend development',
  hours: 8,
  rate: 100,
  billable: true
});

const summary = app.tryforge.getProjectTimeSummary(project.id);
// { totalHours: 120, billableHours: 100, totalAmount: 10000 }
```

### Fakturowanie
```javascript
const invoice = await app.tryforge.generateInvoice({
  projectId: project.id,
  milestoneId: milestone.id,
  includeTimeEntries: true,
  taxRate: 0.23
});
```

## 🎯 Kompletne Użycie - Przykład

```javascript
const TryForgeApp = require('./src/app');

// Uruchom kompletną aplikację
const app = new TryForgeApp({ port: 3000 });
app.start();

// Wszystkie moduły dostępne przez app.tryforge:

// 1. Stwórz klienta
const client = await app.tryforge.createClient({
  name: 'Tech Startup',
  email: 'hello@startup.com'
});

// 2. Stwórz projekt
const project = await app.tryforge.createClientProject(client.id, {
  name: 'SEO Platform',
  template: 'seo-platform',
  budget: 75000
});

// 3. Generuj propozycję
const proposal = await app.tryforge.generateProposal({
  clientId: client.id,
  title: 'SEO Platform Proposal',
  template: 'seo-platform'
});

// 4. Użyj Visual Editor (w przeglądarce)
// http://localhost:3000/editor

// 5. Stwórz workflow automatyzacji
const workflow = await app.tryforge.createWorkflow({
  name: 'Data Processing',
  nodes: [...]
});

// 6. Crawluj konkurencję
const data = await app.tryforge.crawlWebsite('competitor.com');

// 7. Przetwórz dane
await app.tryforge.batchInsert('analytics', data);

// 8. Trackuj czas
await app.tryforge.trackTime({
  projectId: project.id,
  hours: 8,
  rate: 100
});

// 9. Generuj fakturę
const invoice = await app.tryforge.generateInvoice({
  projectId: project.id
});

// WSZYSTKO W JEDNEJ APLIKACJI!
```

## 📊 Status Systemu

Sprawdź status wszystkich modułów:

```javascript
const status = app.tryforge.getSystemStatus();
console.log(status);

/* Output:
{
  modules: {
    tripleAI: 'active',
    generator: 'active',
    aiCodeGen: 'active',
    ide: 'active',
    visualEditor: 'active',
    workflowEngine: 'active',
    workflowBuilder: 'active',
    crawler: 'active',
    jobs: 'active',
    rateLimiter: 'active',
    analytics: 'active',
    bigData: 'active',
    visualization: 'active',
    templates: 'active',
    agency: 'active'
  },
  version: '1.0.0',
  uptime: 3600
}
*/
```

## 🎉 Wszystko w Jednej Aplikacji

### ✅ Co Jest Zintegrowane

1. **15 Modułów Core** - Wszystkie w `src/index.js`
2. **Aplikacja Webowa** - Pełny GUI w `src/app.js`
3. **REST API** - 30+ endpointów
4. **WebSocket Server** - Real-time updates
5. **3 Interfejsy GUI**:
   - Dashboard (wszystko)
   - Visual Editor (edycja wizualna)
   - Workflow Builder (automatyzacja)
   - Agency Dashboard (narzędzia agencyjne)

### ✅ Bez Mocków - Pełna Funkcjonalność

- Każdy moduł ma pełną implementację
- Wszystkie funkcje są operacyjne
- API działa end-to-end
- GUI jest w pełni funkcjonalne
- WebSocket dla real-time

## 🚀 Quick Start Commands

```bash
# Instalacja
npm install

# Uruchomienie pełnej aplikacji
npm start

# Rozwój z auto-reload
npm dev

# CLI (jeśli potrzebne)
npm run cli

# Otwórz w przeglądarce
open http://localhost:3000
```

## 📖 Dodatkowa Dokumentacja

- `ADVANTAGES.md` - Przewagi techniczne
- `VISUAL_EDITOR.md` - Szczegóły Visual Editor
- `WORKFLOW_BUILDER.md` - Szczegóły Workflow Builder
- `IMPLEMENTATION_GUIDE.md` - Pełny przewodnik
- `ROADMAP.md` - Plany rozwoju

---

## 🎊 Gotowe!

**Wszystko w jednej aplikacji. Wszystko zintegrowane. Wszystko działa.**

```bash
npm start
# Otwórz http://localhost:3000
# Enjoy! 🚀
```

---

**TryForge v1.0 - Complete Enterprise Application Platform**
*Powered by Triple AI | Built for Agencies | Production Ready*

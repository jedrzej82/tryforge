# 🔄 TryForge Workflow Builder

## Zaawansowany System Automatyzacji Workflow

Workflow Builder to profesjonalne narzędzie do tworzenia automatyzacji typu no-code/low-code, przewyższające możliwości podobnych platform.

---

## 🚀 Uruchomienie

```bash
# Uruchom Workflow Builder
tryforge workflow

# Lub z custom portem
tryforge workflow --port 8080
```

Interfejs dostępny pod: `http://localhost:5556/workflow-builder`

---

## ✨ Funkcje

### 1. Visual Drag & Drop Builder
- Przeciągnij węzły z biblioteki na canvas
- Połącz węzły aby stworzyć przepływ
- Edytuj właściwości każdego węzła
- Real-time podgląd

### 2. 30+ Built-in Nodes

**Triggers (Wyzwalacze):**
- 🌐 Webhook - HTTP endpoint
- ⏰ Schedule - Cron jobs
- 📧 Email Trigger - Incoming emails
- 🗄️ Database Trigger - DB changes
- 📁 File Watcher - File system events

**Actions (Akcje):**
- 🌐 HTTP Request - API calls
- 🗄️ Database Query - SQL queries
- ✉️ Send Email - SMTP
- 📱 Send SMS - Twilio
- 🔄 Transform Data - JavaScript
- 🤖 AI Process - AI/ML
- 🕷️ Web Scraper - Extract data
- 📄 File Operation - Read/write files

**Logic (Logika):**
- ❓ IF Condition - Branching
- 🔀 Switch - Multi-way branch
- 🔁 Loop - Iterate arrays
- 🔗 Merge - Combine data
- ✂️ Split - Split data

**Integrations (Integracje):**
- 💬 Slack - Messages
- 🎮 Discord - Messages
- ✈️ Telegram - Messages
- 💳 Stripe - Payments
- ☁️ AWS S3 - Storage
- 📊 Google Sheets - Spreadsheets

**Advanced (Zaawansowane):**
- 🧠 ML Predict - Machine learning
- 🖼️ Image Process - Image ops
- 📄 PDF Generate - PDF creation
- 📬 Queue Job - Background jobs
- 💾 Cache Data - Redis cache

### 3. Real-time Execution
- Test workflow na żywo
- Zobacz wyniki natychmiast
- Debug mode z logami
- Performance monitoring

### 4. Workflow Management
- Save/load workflows
- Export/import JSON
- Version control ready
- Clone workflows
- Templates library

---

## 📋 Jak Używać

### 1. Stwórz Nowy Workflow

```bash
# Uruchom builder
tryforge workflow

# Otwórz w przeglądarce
http://localhost:5556/workflow-builder
```

### 2. Dodaj Węzły

1. Przeciągnij węzeł z lewego panelu
2. Upuść na canvas
3. Kliknij na węzeł aby edytować właściwości

### 3. Połącz Węzły

1. Kliknij na output port (prawy)
2. Przeciągnij do input port (lewy) innego węzła
3. Linia połączenia zostanie stworzona

### 4. Konfiguruj Węzły

W prawym panelu edytuj:
- Nazwa węzła
- Parametry
- Warunki
- Dane wejściowe

### 5. Testuj i Aktywuj

```javascript
// 1. Zapisz workflow
Click "💾 Save"

// 2. Testuj
Click "🧪 Test" - wykonaj raz

// 3. Aktywuj
Click "▶️ Activate" - uruchom na stałe
```

---

## 🎯 Przykładowe Workflow

### 1. Webhook → Database → Email

```
┌──────────┐      ┌──────────┐      ┌────────────┐
│ Webhook  │─────→│ Database │─────→│ Send Email │
│ (POST)   │      │ INSERT   │      │ (notify)   │
└──────────┘      └──────────┘      └────────────┘
```

**Cel:** Nowy POST request → zapisz do DB → wyślij email

### 2. Schedule → HTTP → Slack

```
┌──────────┐      ┌──────────┐      ┌───────┐
│ Schedule │─────→│ HTTP GET │─────→│ Slack │
│ (daily)  │      │ (API)    │      │ (post)│
└──────────┘      └──────────┘      └───────┘
```

**Cel:** Codziennie → pobierz dane z API → wyślij na Slack

### 3. Email Trigger → AI → Database

```
┌────────────┐    ┌──────────┐    ┌──────────┐
│ Email      │───→│ AI       │───→│ Database │
│ (incoming) │    │ Process  │    │ INSERT   │
└────────────┘    └──────────┘    └──────────┘
```

**Cel:** Email → przetwórz AI → zapisz wynik

### 4. Database → Transform → Stripe

```
┌──────────┐    ┌───────────┐    ┌────────┐
│ Database │───→│ Transform │───→│ Stripe │
│ Trigger  │    │ Data      │    │ Charge │
└──────────┘    └───────────┘    └────────┘
```

**Cel:** Nowy rekord → przygotuj dane → pobierz płatność

### 5. Webhook → IF → Branch

```
                  ┌───────────────┐
                  │ Send Email    │
                  │ (success)     │
                  └───────────────┘
                        ↑
┌──────────┐    ┌──────┴───┐
│ Webhook  │───→│ IF       │
│ (POST)   │    │ Condition│
└──────────┘    └──────┬───┘
                       ↓
                  ┌───────────────┐
                  │ Log Error     │
                  │ (failure)     │
                  └───────────────┘
```

**Cel:** Request → sprawdź warunek → różne akcje

---

## 🔧 Konfiguracja Węzłów

### Webhook Node

```json
{
  "type": "webhook",
  "settings": {
    "path": "/api/webhook",
    "method": "POST"
  }
}
```

### Schedule Node

```json
{
  "type": "schedule",
  "settings": {
    "cron": "0 9 * * *",
    "timezone": "Europe/Warsaw"
  }
}
```

**Przykłady cron:**
- `* * * * *` - Co minutę
- `0 * * * *` - Co godzinę
- `0 9 * * *` - Codziennie o 9:00
- `0 0 * * 0` - Co niedzielę o północy
- `0 0 1 * *` - 1-go każdego miesiąca

### HTTP Request Node

```json
{
  "type": "http-request",
  "settings": {
    "url": "https://api.example.com/data",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer token"
    }
  }
}
```

### Database Query Node

```json
{
  "type": "database-query",
  "settings": {
    "query": "INSERT INTO users (name, email) VALUES ($1, $2)",
    "parameters": ["{{data.name}}", "{{data.email}}"]
  }
}
```

### Transform Data Node

```json
{
  "type": "transform-data",
  "settings": {
    "code": "return { ...data, timestamp: Date.now() };"
  }
}
```

### AI Process Node

```json
{
  "type": "ai-process",
  "settings": {
    "prompt": "Analyze this text and extract key insights: {{data.text}}",
    "model": "gpt-4"
  }
}
```

### IF Condition Node

```json
{
  "type": "if-condition",
  "settings": {
    "condition": "data.amount > 1000"
  }
}
```

---

## 💡 Use Cases

### 1. Automatyzacja Email Marketing

```
Schedule → Database → Transform → Send Email
```

Codziennie wysyłaj spersonalizowane emaile do użytkowników

### 2. Payment Processing

```
Webhook → Validate → Stripe → Database → Email
```

Przyjmij płatność → przetwórz → zapisz → potwierdź

### 3. Data Sync

```
Schedule → HTTP (API) → Transform → Database → Slack
```

Synchronizuj dane między systemami

### 4. Content Moderation

```
Database Trigger → AI Process → IF → (Approve/Reject)
```

Automatyczna moderacja treści z AI

### 5. Customer Support

```
Email → AI (classify) → Route → (Support/Sales/Tech)
```

Automatyczne kategoryzowanie zapytań

### 6. Reporting

```
Schedule → Database → Transform → PDF → Email
```

Codzienne raporty automatycznie

### 7. Social Media Posting

```
Schedule → Database → Transform → (Slack/Discord/Telegram)
```

Zaplanowane posty na media społecznościowe

### 8. File Processing

```
File Watcher → Transform → Upload S3 → Database
```

Automatyczne przetwarzanie uploadowanych plików

---

## 🚀 Zaawansowane Funkcje

### 1. Error Handling

```javascript
try {
  // Node execution
} catch (error) {
  // Route to error handler
}
```

### 2. Retry Logic

```json
{
  "retry": {
    "max": 3,
    "delay": 1000,
    "backoff": "exponential"
  }
}
```

### 3. Timeout Configuration

```json
{
  "timeout": 30000
}
```

### 4. Parallel Execution

```
        ┌─→ Node 1 ─┐
Input ──┼─→ Node 2 ─┼─→ Merge
        └─→ Node 3 ─┘
```

### 5. Loop with Index

```javascript
// Transform node
return data.items.map((item, index) => ({
  ...item,
  index
}));
```

### 6. Conditional Merging

```
Node 1 ─┐
        ├─→ Merge (IF conditions met)
Node 2 ─┘
```

---

## 📊 Monitoring

### Workflow Statistics

- Total executions
- Success rate
- Failed executions
- Average execution time
- Resource usage

### Execution Logs

```
[2024-01-15 10:30:45] INFO: Workflow started
[2024-01-15 10:30:45] INFO: Executing node: webhook
[2024-01-15 10:30:46] INFO: Executing node: database
[2024-01-15 10:30:47] SUCCESS: Workflow completed (2.1s)
```

### Performance Metrics

- Node execution times
- Bottleneck identification
- Resource consumption
- Error rates

---

## 🔌 API Access

### REST API

```javascript
// Get all workflows
GET /api/workflows

// Create workflow
POST /api/workflows
{
  "name": "My Workflow",
  "nodes": [...],
  "connections": [...]
}

// Execute workflow
POST /api/workflows/:id/execute
{
  "data": { ... }
}

// Activate workflow
POST /api/workflows/:id/activate

// Get executions
GET /api/workflows/:id/executions

// Get statistics
GET /api/workflows/:id/stats
```

### Programmatic Usage

```javascript
const WorkflowEngine = require('tryforge/src/core/workflow-engine');

const engine = new WorkflowEngine();

// Create workflow
const workflow = await engine.createWorkflow({
  name: 'My Workflow',
  nodes: [
    {
      id: 'node1',
      type: 'webhook',
      settings: { path: '/webhook' }
    },
    {
      id: 'node2',
      type: 'database-query',
      settings: { query: 'INSERT...' }
    }
  ],
  connections: [
    { source: 'node1', target: 'node2' }
  ]
});

// Execute
const result = await engine.executeWorkflow(workflow.id, { data: '...' });

// Activate
await engine.activateWorkflow(workflow.id);
```

---

## 🎨 Custom Nodes

### Create Custom Node

```javascript
engine.registerNode('custom-action', {
  type: 'custom-action',
  name: 'My Custom Action',
  description: 'Does something custom',
  settings: {
    param1: { type: 'string', required: true },
    param2: { type: 'number', default: 0 }
  },
  async execute(node, context) {
    // Your custom logic
    return { result: 'done' };
  }
});
```

---

## 💾 Export/Import

### Export Workflow

```json
{
  "id": "wf_123",
  "name": "My Workflow",
  "nodes": [
    {
      "id": "node1",
      "type": "webhook",
      "x": 100,
      "y": 100,
      "settings": {
        "path": "/webhook"
      }
    }
  ],
  "connections": [
    {
      "source": "node1",
      "target": "node2"
    }
  ]
}
```

### Import

```bash
# Click "Import" button
# Select JSON file
# Or paste JSON
```

---

## 🔒 Security

- Secure credential storage
- Environment variables support
- Role-based access control (planned)
- Audit logging
- Input validation

---

## ⚡ Performance

- Async execution
- Parallel node execution where possible
- Connection pooling (database, HTTP)
- Caching support
- Resource limits

---

## 🐛 Debugging

### Test Mode

- Execute workflow once with test data
- View step-by-step execution
- Inspect data at each node
- Error stack traces

### Logs

- Detailed execution logs
- Error messages
- Performance metrics
- Data transformations

---

## 📚 Best Practices

### 1. Naming
- Use descriptive workflow names
- Name nodes clearly
- Document complex logic

### 2. Error Handling
- Always handle errors
- Add retry logic for unreliable services
- Log failures

### 3. Testing
- Test workflows before activating
- Use test data
- Validate outputs

### 4. Performance
- Minimize node count
- Use parallel execution
- Cache when possible
- Set appropriate timeouts

### 5. Maintenance
- Version control workflows
- Document changes
- Monitor execution stats

---

## 🎯 Roadmap

### v1.1
- [ ] Visual debugging
- [ ] Version control integration
- [ ] Workflow templates library
- [ ] Performance profiling

### v1.2
- [ ] Multi-user collaboration
- [ ] Role-based permissions
- [ ] Advanced error handling
- [ ] Workflow marketplace

---

## 🌟 Przewaga nad n8n

### 1. AI Integration
✅ TryForge: Built-in AI nodes (GPT-4, Claude)
❌ n8n: Limited AI support

### 2. Visual Editor Integration
✅ TryForge: Seamless integration z Visual Editor
❌ n8n: Separate tools

### 3. Code Generation
✅ TryForge: Can generate entire workflows
❌ n8n: Manual building only

### 4. Performance
✅ TryForge: Optimized for high throughput
❌ n8n: Standard performance

### 5. Enterprise Features
✅ TryForge: Built-in scaling, monitoring
❌ n8n: Requires additional setup

---

## ✨ Podsumowanie

TryForge Workflow Builder to:
- ✅ Visual drag-and-drop
- ✅ 30+ built-in nodes
- ✅ Real-time execution
- ✅ AI integration
- ✅ Advanced logic
- ✅ Enterprise integrations
- ✅ Monitoring & debugging
- ✅ Export/import
- ✅ API access
- ✅ Custom nodes

**Lepsze niż n8n + własne unikalne funkcje!**

```bash
tryforge workflow
# Open http://localhost:5556/workflow-builder
# Start building amazing automations!
```

---

**🔄 TryForge Workflow Builder - Automatyzacja Następnej Generacji**

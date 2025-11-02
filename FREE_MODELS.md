# 🆓 Darmowe Modele AI w TryForge

## Przegląd

TryForge wspiera **100% darmowe** generowanie aplikacji dzięki integracji z OpenRouter i Pollinations AI.

---

## 🤖 Darmowe Modele LLM (przez OpenRouter)

### 1. Minimax M2 ⭐ (NAJLEPSZY)

**Model ID:** `minimax/abab6-chat`

**Parametry:**
- **Koszt:** $0.00 (całkowicie darmowy!)
- **Context window:** 245,000 tokens (ogromny!)
- **Max output:** 16,000 tokens
- **Szybkość:** ~500 tokens/s (szybki)
- **Jakość:** Excellent (porównywalna z GPT-4)

**Najlepszy do:**
- ✅ Code generation (najlepsza jakość)
- ✅ Complex reasoning
- ✅ Long context tasks
- ✅ Production code (enterprise-grade)
- ✅ Refactoring
- ✅ Documentation

**Przykład użycia:**
```javascript
const openRouter = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY
});

const result = await openRouter.generate({
  prompt: "Create a React component for user authentication",
  model: "minimax-m2"  // Explicit
});

console.log(result.content);  // Generated code
console.log(result.cost);     // 0
console.log(result.free);     // true
```

**CLI użycie:**
```bash
# Automatycznie używa Minimax M2
tryforge create my-app

# Lub explicite:
tryforge create my-app --model minimax-m2
```

---

### 2. Mixtral 8x7B ⚡ (NAJSZYBSZY)

**Model ID:** `mistralai/mixtral-8x7b-instruct`

**Parametry:**
- **Koszt:** $0.00 (darmowy!)
- **Context window:** 32,000 tokens
- **Max output:** 8,000 tokens
- **Szybkość:** ~1000 tokens/s (bardzo szybki)
- **Jakość:** Good (świetny do większości zadań)

**Najlepszy do:**
- ✅ Quick responses (najszybszy)
- ✅ Simple code generation
- ✅ Text processing
- ✅ Conversational AI
- ✅ Simple refactoring
- ✅ Prototyping

**Przykład użycia:**
```javascript
const result = await openRouter.generate({
  prompt: "Explain how React hooks work",
  model: "mixtral",
  taskType: "quick"  // Auto-selects Mixtral
});
```

**CLI użycie:**
```bash
tryforge create simple-app --model mixtral --quick
```

---

### 3. Llama 3 70B 🦙 (OPEN SOURCE)

**Model ID:** `meta-llama/llama-3-70b-instruct`

**Parametry:**
- **Koszt:** $0.00 (darmowy!)
- **Context window:** 8,000 tokens
- **Max output:** 4,000 tokens
- **Szybkość:** ~300 tokens/s (średni)
- **Jakość:** Good (solidny wybór)

**Najlepszy do:**
- ✅ General tasks
- ✅ Open source preference
- ✅ Standard code generation
- ✅ Documentation
- ✅ Explanation
- ✅ Translation

**Przykład użycia:**
```javascript
const result = await openRouter.generate({
  prompt: "Write Python function to sort array",
  model: "llama3-70b"
});
```

---

## 🎨 Pollinations AI (Darmowa Grafika)

**API:** https://pollinations.ai/

**Parametry:**
- **Koszt:** $0.00 (całkowicie darmowy!)
- **API Key:** Nie potrzebny!
- **Rate limit:** 10 images/minute
- **Daily limit:** Unlimited
- **Jakość:** Professional (jak DALL-E 3)

**Supported styles:**
- `realistic` - Fotorealistyczne obrazy
- `digital-art` - Digital art style
- `anime` - Anime/manga
- `sketch` - Szkice/rysunki
- `abstract` - Abstrakcyjne
- `3d-render` - 3D rendering
- `pixel-art` - Pixel art
- `watercolor` - Akwarela
- `oil-painting` - Malarstwo olejne
- `cartoon` - Kreskówki

**Przykład użycia:**
```javascript
const pollinations = require('./src/core/pollinations-client');

// Generate logo
const logo = await pollinations.generate({
  prompt: "modern tech startup logo, minimalist, blue",
  style: "digital-art",
  size: "512x512"
});

// Generate hero image
const hero = await pollinations.generate({
  prompt: "futuristic dashboard, professional, dark theme",
  style: "realistic",
  size: "1920x1080"
});
```

**CLI użycie:**
```bash
tryforge graphics generate \
  --prompt "modern tech logo" \
  --style realistic \
  --size 512x512 \
  --output ./logo.png
```

---

## 🔄 Automatyczny Wybór Modelu

TryForge automatycznie wybiera najlepszy darmowy model na podstawie zadania:

### Code Generation
```javascript
await openRouter.generateCode({
  description: "User authentication system",
  language: "javascript",
  framework: "react"
});
// → Automatycznie używa Minimax M2 (najlepsza jakość)
```

### Quick Tasks
```javascript
await openRouter.generate({
  prompt: "Explain concept briefly",
  taskType: "quick"
});
// → Automatycznie używa Mixtral (najszybszy)
```

### General Tasks
```javascript
await openRouter.generate({
  prompt: "Any general task"
});
// → Automatycznie używa Minimax M2 (default)
```

---

## 💰 Porównanie Kosztów

### Przed TryForge (Płatne modele)

| Model | Input | Output | Typical Project | Cost |
|-------|-------|--------|----------------|------|
| GPT-4 | $0.03/1K | $0.06/1K | 50K tokens | $2.50 |
| Claude 3.5 | $0.003/1K | $0.015/1K | 50K tokens | $0.75 |
| DALL-E 3 | - | $0.04/img | 10 images | $0.40 |
| **TOTAL** | | | | **$3.65** |

### Z TryForge (Darmowe modele)

| Model | Input | Output | Typical Project | Cost |
|-------|-------|--------|----------------|------|
| Minimax M2 | $0.00 | $0.00 | 50K tokens | **$0.00** ✅ |
| Pollinations | - | $0.00 | 10 images | **$0.00** ✅ |
| **TOTAL** | | | | **$0.00** 🎉 |

**Oszczędność: 100%!**

---

## 🚀 Konfiguracja

### Krok 1: Zdobądź OpenRouter API Key (DARMOWE)

1. Wejdź na: https://openrouter.ai/
2. Zarejestruj się (GitHub OAuth)
3. Settings → API Keys → Create Key
4. Skopiuj klucz: `sk-or-v1-...`

### Krok 2: Dodaj do .env

```env
# .env file
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Prefer free models (default)
AI_MODEL_PREFERENCE=free

# Enable free AI
ENABLE_FREE_AI=true
```

### Krok 3: Użyj!

```bash
# Automatycznie używa darmowych modeli
tryforge create my-app

# Koszt: $0.00 ✅
```

---

## 📊 Performance Comparison

| Model | Speed | Quality | Context | Free | Best For |
|-------|-------|---------|---------|------|----------|
| **Minimax M2** | ⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Excellent | 245K | ✅ | Production code |
| **Mixtral** | ⚡⚡⚡⚡ Very Fast | ⭐⭐⭐⭐ Good | 32K | ✅ | Quick tasks |
| **Llama 3 70B** | ⚡⚡ Medium | ⭐⭐⭐ Good | 8K | ✅ | General tasks |
| Claude 3.5 | ⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Excellent | 200K | ❌ | Premium fallback |
| GPT-4 | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ Excellent | 128K | ❌ | Premium fallback |

---

## 🎯 Przykłady Użycia

### 1. Stwórz Pełną Aplikację (FREE)

```bash
tryforge create my-marketplace

# System automatycznie:
# 1. Używa Minimax M2 (FREE) do generowania kodu
# 2. Używa Pollinations (FREE) do logo i obrazów
# 3. Generuje production-ready projekt
# 
# Koszt: $0.00 ✅
# Czas: 2-5 minut
```

### 2. Wygeneruj Komponent z AI (FREE)

```javascript
const openRouter = new OpenRouterClient();

// Generate React component
const result = await openRouter.generateCode({
  description: "Shopping cart with add/remove items",
  language: "javascript",
  framework: "react",
  features: [
    "State management",
    "Local storage",
    "Quantity controls",
    "Price calculation"
  ]
});

console.log(result.content);  // Complete React component
console.log(`Cost: $${result.cost}`);  // Cost: $0
```

### 3. Wygeneruj Logo (FREE)

```javascript
const pollinations = require('./src/core/pollinations-client');

const logo = await pollinations.generateLogo({
  companyName: "TechStartup",
  industry: "technology",
  style: "modern",
  colors: ["blue", "white"]
});

console.log(logo.url);  // Image URL
// Cost: $0.00 ✅
```

### 4. Batch Generation (FREE)

```javascript
// Generate multiple components at once
const components = await openRouter.batchGenerate([
  {
    prompt: "Create LoginForm component",
    model: "minimax-m2"
  },
  {
    prompt: "Create SignupForm component",
    model: "minimax-m2"
  },
  {
    prompt: "Create DashboardLayout component",
    model: "minimax-m2"
  }
]);

// All FREE! Total cost: $0.00
```

---

## ⚡ Best Practices

### 1. Use Free Models by Default

```javascript
const openRouter = new OpenRouterClient({
  preferFree: true  // Default behavior
});
```

### 2. Cache Results

```javascript
const openRouter = new OpenRouterClient({
  preferFree: true,
  cacheEnabled: true  // Avoid duplicate requests
});
```

### 3. Batch Requests

```javascript
// More efficient than individual requests
const results = await openRouter.batchGenerate([...]);
```

### 4. Specific Prompts

```javascript
// More specific = better results (even with free models)
const result = await openRouter.generate({
  prompt: `Create a React component for user authentication with:
  - Email/password login
  - Social login (Google, GitHub)
  - 2FA support
  - Form validation
  - Error handling
  - Loading states`,
  model: "minimax-m2"
});
```

---

## 🔥 Summary

✅ **Minimax M2** - Najlepszy darmowy model (245K context)
✅ **Mixtral** - Najszybszy darmowy model
✅ **Llama 3 70B** - Solidny open source
✅ **Pollinations** - Darmowa grafika (unlimited)
✅ **$0.00** - Całkowity koszt per projekt
✅ **No limits** - Unlimited projects
✅ **Professional quality** - Porównywalne z płatnymi
✅ **Easy setup** - Tylko 1 API key

---

## 📚 Więcej Informacji

- **REQUIREMENTS.md** - Pełna instrukcja setupu
- **IMPLEMENTATION_GUIDE.md** - Szczegóły implementacji
- **src/core/openrouter-client.js** - Kod źródłowy
- **src/core/pollinations-client.js** - Pollinations integration
- **.env.example** - Przykładowa konfiguracja

---

**🔥 TryForge - 100% Darmowe Generowanie Aplikacji!**

*Minimax M2 (FREE) + Pollinations (FREE) = $0 Cost* ✅

```bash
# Start now - completely FREE!
npm install
tryforge create my-app
```

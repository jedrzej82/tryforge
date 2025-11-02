# 🎨 TryForge Visual Editor

## Profesjonalny Interfejs Graficzny

Visual Editor to zaawansowany GUI do edycji wygenerowanych aplikacji webowych z pełną kontrolą nad każdym elementem.

---

## 🚀 Uruchomienie

```bash
# Uruchom Visual Editor dla projektu
tryforge editor ./my-project

# Lub z custom portem
tryforge editor ./my-project --port 8080
```

Editor automatycznie otwiera się pod adresem: `http://localhost:5555/editor`

---

## ✨ Funkcje

### 1. Edycja Indywidualna Każdego Elementu

**Dostępne właściwości:**
- ✅ Tekst content
- ✅ Kolor tła (background)
- ✅ Kolor tekstu
- ✅ Rozmiar czcionki
- ✅ Padding (odstępy wewnętrzne)
- ✅ Margin (odstępy zewnętrzne)
- ✅ Border (obramowanie)
- ✅ Pozycja
- ✅ Rozmiar

### 2. Zarządzanie Kolorami

**Pełna kontrola nad schematem kolorów:**
- Primary color (główny kolor)
- Secondary color (drugorzędny)
- Accent color (akcent)
- Background (tło)
- Text color (tekst)
- Border color (obramowanie)
- Custom colors (własne kolory)

**Funkcje:**
- Color picker dla każdego koloru
- Automatyczne zastosowanie w całej aplikacji
- Export schematu kolorów
- Import z innych projektów

### 3. Edycja Tekstów

**Możliwości:**
- Edycja każdego tekstu w projekcie
- Wyszukiwanie tekstów
- Masowa zamiana
- Wielojęzyczność (przygotowanie)

### 4. Live Preview

**Real-time podgląd:**
- Natychmiastowa aktualizacja zmian
- Responsywny podgląd (desktop/tablet/mobile)
- Hot reload
- WebSocket dla szybkiej aktualizacji

### 5. Export Kodu

**Eksport:**
- Kompletny kod React
- CSS/SCSS
- Tailwind config
- Wszystkie zmiany

---

## 🎯 Interfejs

### Panel Boczny (Lewy)
```
┌─────────────────────┐
│  🔥 TryForge        │
│                     │
│  Elements           │
│  ├─ Header          │
│  ├─ Navigation      │
│  ├─ Hero Section    │
│  ├─ Features        │
│  ├─ Footer          │
│  └─ ...             │
└─────────────────────┘
```

### Toolbar (Górny)
```
┌──────────────────────────────────────┐
│ 💾 Save │ 📤 Export │ 👁️ Preview    │
│ ↶ Undo  │ ↷ Redo    │                │
└──────────────────────────────────────┘
```

### Canvas (Środek)
```
┌──────────────────────────────────────┐
│                                      │
│       Live Preview Area              │
│       (iframe with real-time         │
│        rendering)                    │
│                                      │
└──────────────────────────────────────┘
```

### Panel Właściwości (Prawy)
```
┌─────────────────────┐
│  Properties         │
│                     │
│  Element Type       │
│  [ div ]            │
│                     │
│  Text Content       │
│  [Hello World    ]  │
│                     │
│  Background Color   │
│  [🎨 #3b82f6     ]  │
│                     │
│  Text Color         │
│  [🎨 #1f2937     ]  │
│                     │
│  Font Size          │
│  [16px           ]  │
│                     │
│  Padding            │
│  [10px           ]  │
│                     │
│  Margin             │
│  [10px           ]  │
│                     │
│  Border             │
│  [1px solid #ccc ]  │
└─────────────────────┘
```

---

## 📋 Jak Używać

### 1. Uruchom Editor

```bash
# Stwórz projekt
tryforge create my-website --type webapp

# Uruchom editor
cd my-website
tryforge editor .
```

### 2. Wybierz Element

- Kliknij na element w lewym panelu
- Lub kliknij bezpośrednio w preview

### 3. Edytuj Właściwości

- Zmień tekst
- Wybierz kolory z color pickera
- Dostosuj rozmiary i odstępy
- Zmiany są natychmiast widoczne

### 4. Zapisz i Eksportuj

```bash
# W edytorze:
1. Kliknij "💾 Save" - zapisz zmiany
2. Kliknij "📤 Export" - eksportuj kod
3. Kod jest gotowy do użycia
```

---

## 🎨 Przykłady Edycji

### Zmiana Koloru Tła

```javascript
// Przed:
<div style="background: #ffffff">
  Content
</div>

// Po edycji w Visual Editor:
<div style="background: #3b82f6">
  Content
</div>
```

### Zmiana Tekstu

```javascript
// Przed:
<h1>Welcome</h1>

// Po edycji:
<h1>Witamy w Naszej Aplikacji</h1>
```

### Zmiana Stylów

```javascript
// Przed:
<button style="padding: 8px 16px">
  Click
</button>

// Po edycji:
<button style="padding: 12px 24px; background: #10b981; border-radius: 8px">
  Kliknij Tutaj
</button>
```

---

## 🔧 Zaawansowane Funkcje

### 1. Undo/Redo

```bash
Ctrl+Z  # Cofnij
Ctrl+Y  # Ponów
```

### 2. Keyboard Shortcuts

```bash
Ctrl+S       # Zapisz
Ctrl+E       # Export
Ctrl+P       # Preview
Ctrl+Click   # Multi-select
Delete       # Usuń element
```

### 3. Responsive Editing

```bash
# Podgląd różnych rozdzielczości
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
```

### 4. Component Library

```bash
# Dodaj gotowe komponenty
- Button variants
- Card layouts
- Form elements
- Navigation menus
- Footers
- Headers
```

---

## 📊 Edytowalne Właściwości

### Typography
- font-family
- font-size
- font-weight
- line-height
- letter-spacing
- text-align
- text-transform

### Colors
- color (text)
- background-color
- border-color
- gradient (linear/radial)

### Spacing
- padding (top, right, bottom, left)
- margin (top, right, bottom, left)
- gap (dla flex/grid)

### Borders
- border-width
- border-style
- border-color
- border-radius

### Layout
- display
- position
- width/height
- flex properties
- grid properties

### Effects
- box-shadow
- opacity
- transform
- transition
- animation

---

## 🚀 Real-time Features

### WebSocket Connection
```javascript
// Automatyczne połączenie
ws://localhost:5555

// Live updates dla:
- Element changes
- Color updates
- Text modifications
- Style changes
```

### Collaborative Editing
- Wiele osób może edytować jednocześnie
- Real-time synchronizacja
- Conflict resolution
- Change history

---

## 💡 Best Practices

### 1. Organizacja
- Grupuj podobne elementy
- Używaj opisowych nazw
- Twórz komponenty wielokrotnego użytku

### 2. Kolory
- Używaj spójnej palety
- Zachowaj kontrast (WCAG)
- Testuj w różnych trybach (light/dark)

### 3. Typography
- Hierarchia nagłówków
- Czytelność (wielkość, kontrast)
- Spójność fontów

### 4. Spacing
- Używaj systemu (8px grid)
- Konsystentne odstępy
- Breathable layouts

---

## 🔌 API

### Programmatic Access

```javascript
const VisualEditor = require('tryforge/src/core/visual-editor');

const editor = new VisualEditor({ port: 5555 });

// Load project
const projectId = await editor.loadProject('./my-project');

// Update element
editor.updateElement(projectId, 'element-id', {
  content: 'New text',
  backgroundColor: '#3b82f6'
});

// Update colors
editor.updateColors(projectId, {
  primary: '#3b82f6',
  secondary: '#10b981'
});

// Generate preview
const preview = editor.generatePreview(projectId);

// Export code
const code = editor.exportCode(projectId);
```

---

## 📚 Integration z TryForge

### Create → Edit → Deploy Workflow

```bash
# 1. Create
tryforge create my-app --type ecommerce

# 2. Edit
cd my-app
tryforge editor .
# Edytuj w przeglądarce

# 3. Test
npm run dev

# 4. Deploy
tryforge deploy . --docker
```

---

## 🎯 Roadmap

### v1.1 (Planned)
- [ ] Drag & drop elements
- [ ] Visual component builder
- [ ] Animation editor
- [ ] Theme generator
- [ ] AI-powered suggestions

### v1.2 (Future)
- [ ] Multi-language support
- [ ] Version control integration
- [ ] Design tokens
- [ ] Accessibility checker
- [ ] Performance optimizer

---

## 🐛 Troubleshooting

### Port już używany
```bash
# Użyj innego portu
tryforge editor . --port 8080
```

### Zmiany nie są widoczne
```bash
# Hard refresh
Ctrl+Shift+R

# Sprawdź WebSocket connection
# Developer Tools → Network → WS
```

### Błąd ładowania projektu
```bash
# Sprawdź ścieżkę
tryforge editor /absolute/path/to/project

# Sprawdź uprawnienia
chmod -R 755 ./project
```

---

## 💬 Support

- **Documentation:** [README.md](../README.md)
- **Examples:** `/examples` directory
- **Issues:** GitHub Issues

---

## ✨ Podsumowanie

Visual Editor to:
- ✅ Profesjonalny GUI
- ✅ Pełna edycja każdego elementu
- ✅ Real-time preview
- ✅ Color scheme editor
- ✅ Text content manager
- ✅ Export do kodu
- ✅ WebSocket dla live updates
- ✅ Łatwy w użyciu
- ✅ Production-ready

**Start editing now!**

```bash
tryforge editor ./my-project
# Open http://localhost:5555/editor
```

---

**🎨 TryForge Visual Editor - Profesjonalna Edycja Web Applications**

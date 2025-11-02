/**
 * Conversational AI System - Interactive Project Builder
 * 
 * Natural language conversation system that:
 * - Understands user intent from simple prompts
 * - Asks intelligent follow-up questions
 * - Automatically selects or creates templates
 * - Guides users through project creation
 */

const axios = require('axios');

class ConversationalAI {
  constructor() {
    this.conversationHistory = [];
    this.projectContext = {};
    this.userPreferences = {};
  }

  /**
   * Start a new conversation
   */
  async startConversation(initialPrompt) {
    this.conversationHistory = [];
    this.projectContext = {};

    const greeting = "Cześć! Jestem TryForge AI Assistant. Pomogę Ci stworzyć aplikację.\n" +
                    "Powiedz mi co chcesz zbudować, a ja zajmę się resztą!";

    if (initialPrompt) {
      // User provided initial description
      const analysis = await this.analyzePrompt(initialPrompt);
      return {
        message: `${greeting}\n\nRozumiem! Chcesz stworzyć: ${analysis.projectType}\n\n` +
                `Mam kilka pytań, żeby doprecyzować szczegóły...`,
        questions: this.generateQuestions(analysis),
        analysis
      };
    }

    return {
      message: greeting,
      questions: [{
        id: 'initial_description',
        text: 'Co chcesz stworzyć? Opisz swoją aplikację w kilku słowach:',
        type: 'text',
        required: true
      }]
    };
  }

  /**
   * Analyze user prompt to understand project intent
   */
  async analyzePrompt(prompt) {
    const keywords = {
      // Project types
      mobile: ['mobile', 'app', 'ios', 'android', 'aplikacja mobilna', 'telefon'],
      web: ['website', 'strona', 'webapp', 'portal', 'web', 'aplikacja webowa'],
      desktop: ['desktop', 'windows', 'mac', 'linux', 'aplikacja desktopowa'],
      game: ['game', 'gra', 'grę', 'gaming'],
      blockchain: ['nft', 'crypto', 'blockchain', 'web3', 'defi', 'token'],
      iot: ['iot', 'sensor', 'arduino', 'esp32', 'embedded', 'urządzenie'],
      ml: ['ai', 'ml', 'machine learning', 'neural', 'tensorflow'],
      
      // Domain types
      ecommerce: ['shop', 'sklep', 'store', 'marketplace', 'e-commerce', 'sprzedaż'],
      social: ['social', 'społecznościowa', 'network', 'chat', 'messaging', 'forum'],
      fitness: ['fitness', 'health', 'workout', 'trening', 'zdrowie'],
      education: ['education', 'learning', 'course', 'edukacja', 'kursy', 'nauka'],
      finance: ['finance', 'banking', 'payment', 'finanse', 'płatności'],
      food: ['food', 'restaurant', 'delivery', 'restauracja', 'jedzenie', 'dostawa'],
      travel: ['travel', 'booking', 'hotel', 'podróże', 'rezerwacje'],
      realestate: ['real estate', 'property', 'nieruchomości', 'mieszkania']
    };

    const detected = {
      projectType: 'web application',
      platform: [],
      domain: null,
      features: [],
      complexity: 'medium',
      keywords: []
    };

    const lowerPrompt = prompt.toLowerCase();

    // Detect project type
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => lowerPrompt.includes(word))) {
        detected.keywords.push(type);
        
        if (['mobile', 'web', 'desktop', 'game', 'blockchain', 'iot', 'ml'].includes(type)) {
          detected.platform.push(type);
        } else {
          detected.domain = type;
        }
      }
    }

    // Set primary project type
    if (detected.platform.includes('mobile')) {
      detected.projectType = 'mobile application';
    } else if (detected.platform.includes('desktop')) {
      detected.projectType = 'desktop application';
    } else if (detected.platform.includes('game')) {
      detected.projectType = 'game';
    } else if (detected.platform.includes('blockchain')) {
      detected.projectType = 'blockchain application';
    } else if (detected.platform.includes('iot')) {
      detected.projectType = 'IoT platform';
    } else if (detected.platform.includes('ml')) {
      detected.projectType = 'ML application';
    }

    // Add domain context
    if (detected.domain) {
      detected.projectType = `${detected.domain} ${detected.projectType}`;
    }

    // Detect features
    const featureKeywords = {
      auth: ['login', 'register', 'auth', 'logowanie', 'rejestracja'],
      payment: ['payment', 'stripe', 'paypal', 'płatności', 'koszyk'],
      realtime: ['realtime', 'live', 'chat', 'messaging', 'na żywo'],
      maps: ['map', 'location', 'gps', 'mapa', 'lokalizacja'],
      social: ['share', 'like', 'comment', 'follow', 'udostępnij', 'polub'],
      admin: ['admin', 'dashboard', 'panel', 'zarządzanie'],
      api: ['api', 'integration', 'integracja'],
      analytics: ['analytics', 'stats', 'metrics', 'analityka', 'statystyki']
    };

    for (const [feature, words] of Object.entries(featureKeywords)) {
      if (words.some(word => lowerPrompt.includes(word))) {
        detected.features.push(feature);
      }
    }

    // Estimate complexity
    const complexityIndicators = {
      simple: ['simple', 'basic', 'prosty', 'podstawowy', 'mvp'],
      medium: ['medium', 'standard', 'średni', 'normalny'],
      complex: ['complex', 'advanced', 'enterprise', 'złożony', 'zaawansowany']
    };

    for (const [level, words] of Object.entries(complexityIndicators)) {
      if (words.some(word => lowerPrompt.includes(word))) {
        detected.complexity = level;
        break;
      }
    }

    this.projectContext = detected;
    return detected;
  }

  /**
   * Generate intelligent follow-up questions
   */
  generateQuestions(analysis) {
    const questions = [];

    // Platform-specific questions
    if (analysis.platform.includes('mobile')) {
      questions.push({
        id: 'mobile_platform',
        text: 'Dla jakiej platformy?',
        type: 'choice',
        options: [
          { value: 'ios', label: 'Tylko iOS' },
          { value: 'android', label: 'Tylko Android' },
          { value: 'both', label: 'iOS i Android (React Native)' }
        ],
        default: 'both'
      });
    }

    if (analysis.platform.includes('web')) {
      questions.push({
        id: 'web_framework',
        text: 'Preferowany framework?',
        type: 'choice',
        options: [
          { value: 'react', label: 'React (polecane)' },
          { value: 'vue', label: 'Vue.js' },
          { value: 'nextjs', label: 'Next.js (React + SSR)' },
          { value: 'auto', label: 'Automatyczny wybór' }
        ],
        default: 'auto'
      });
    }

    // Backend questions
    questions.push({
      id: 'backend',
      text: 'Backend?',
      type: 'choice',
      options: [
        { value: 'nodejs', label: 'Node.js + Express (szybki)' },
        { value: 'python', label: 'Python + FastAPI (ML ready)' },
        { value: 'go', label: 'Go (bardzo wydajny)' },
        { value: 'firebase', label: 'Firebase (gotowe rozwiązanie)' },
        { value: 'auto', label: 'Automatyczny wybór' }
      ],
      default: 'auto'
    });

    // Database questions
    questions.push({
      id: 'database',
      text: 'Baza danych?',
      type: 'choice',
      options: [
        { value: 'postgres', label: 'PostgreSQL (relacyjna, polecana)' },
        { value: 'mongodb', label: 'MongoDB (dokumentowa)' },
        { value: 'both', label: 'PostgreSQL + MongoDB' },
        { value: 'auto', label: 'Automatyczny wybór' }
      ],
      default: 'auto'
    });

    // Features questions
    const availableFeatures = [];
    
    if (!analysis.features.includes('auth')) {
      availableFeatures.push({ value: 'auth', label: 'Logowanie i rejestracja' });
    }
    
    if (!analysis.features.includes('payment')) {
      availableFeatures.push({ value: 'payment', label: 'Płatności (Stripe/PayPal)' });
    }
    
    if (!analysis.features.includes('admin')) {
      availableFeatures.push({ value: 'admin', label: 'Panel admina' });
    }
    
    if (!analysis.features.includes('realtime')) {
      availableFeatures.push({ value: 'realtime', label: 'Real-time updates (WebSocket)' });
    }
    
    if (!analysis.features.includes('analytics')) {
      availableFeatures.push({ value: 'analytics', label: 'Analityka i statystyki' });
    }

    if (availableFeatures.length > 0) {
      questions.push({
        id: 'additional_features',
        text: 'Dodatkowe funkcje? (zaznacz wszystkie potrzebne)',
        type: 'multichoice',
        options: availableFeatures
      });
    }

    // Deployment question
    questions.push({
      id: 'deployment',
      text: 'Plan wdrożenia?',
      type: 'choice',
      options: [
        { value: 'local', label: 'Tylko lokalne środowisko (rozwój)' },
        { value: 'docker', label: 'Docker (łatwe deploy)' },
        { value: 'cloud', label: 'Cloud (AWS/GCP/Azure)' },
        { value: 'later', label: 'Później się zdecyduję' }
      ],
      default: 'docker'
    });

    return questions;
  }

  /**
   * Process user answers and decide on next steps
   */
  async processAnswers(answers) {
    // Merge answers into project context
    Object.assign(this.projectContext, answers);

    // Auto-select tech stack if needed
    if (answers.backend === 'auto') {
      this.projectContext.backend = this.autoSelectBackend();
    }

    if (answers.database === 'auto') {
      this.projectContext.database = this.autoSelectDatabase();
    }

    if (answers.web_framework === 'auto') {
      this.projectContext.web_framework = 'react';
    }

    // Select or create template
    const template = await this.selectTemplate();

    return {
      message: this.generateSummary(),
      projectContext: this.projectContext,
      template,
      readyToGenerate: true
    };
  }

  /**
   * Auto-select best backend based on project context
   */
  autoSelectBackend() {
    const { platform, domain, features } = this.projectContext;

    // ML projects -> Python
    if (platform.includes('ml') || features.includes('ml')) {
      return 'python';
    }

    // High performance needs -> Go
    if (platform.includes('iot') || domain === 'finance') {
      return 'go';
    }

    // Default -> Node.js (most versatile)
    return 'nodejs';
  }

  /**
   * Auto-select best database based on project context
   */
  autoSelectDatabase() {
    const { domain, features } = this.projectContext;

    // E-commerce, analytics -> PostgreSQL (relational)
    if (domain === 'ecommerce' || features.includes('analytics')) {
      return 'postgres';
    }

    // Social, CMS -> MongoDB (flexible schema)
    if (domain === 'social' || features.includes('realtime')) {
      return 'mongodb';
    }

    // Default -> PostgreSQL (most common)
    return 'postgres';
  }

  /**
   * Select best template or create new one
   */
  async selectTemplate() {
    const { projectType, platform, domain } = this.projectContext;

    // Map to existing templates
    const templateMap = {
      'ecommerce': 'marketplace',
      'mobile': 'mobile-app',
      'desktop': 'desktop-app',
      'game': 'game-2d',
      'blockchain': 'nft-marketplace',
      'iot': 'iot-platform',
      'ml': 'ml-browser',
      'education': 'lms',
      'social': 'blog' // closest match
    };

    // Try to find existing template
    if (domain && templateMap[domain]) {
      return {
        type: 'existing',
        name: templateMap[domain]
      };
    }

    if (platform.length > 0 && templateMap[platform[0]]) {
      return {
        type: 'existing',
        name: templateMap[platform[0]]
      };
    }

    // Create custom template
    return {
      type: 'custom',
      name: 'custom-project',
      config: this.projectContext
    };
  }

  /**
   * Generate project summary
   */
  generateSummary() {
    const { projectType, backend, database, features } = this.projectContext;

    let summary = `\n🎯 Gotowe! Oto co stworzymy:\n\n`;
    summary += `📦 Typ: ${projectType}\n`;
    summary += `⚙️  Backend: ${this.getBackendName(backend)}\n`;
    summary += `💾 Database: ${this.getDatabaseName(database)}\n`;
    
    if (features.length > 0) {
      summary += `✨ Funkcje:\n`;
      features.forEach(f => {
        summary += `   • ${this.getFeatureName(f)}\n`;
      });
    }

    summary += `\n⏱️  Szacowany czas generowania: 30-60 sekund\n`;
    summary += `\nCzy to wygląda dobrze? (tak/nie)\n`;

    return summary;
  }

  getBackendName(backend) {
    const names = {
      'nodejs': 'Node.js + Express',
      'python': 'Python + FastAPI',
      'go': 'Go + Gin',
      'firebase': 'Firebase'
    };
    return names[backend] || backend;
  }

  getDatabaseName(database) {
    const names = {
      'postgres': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'both': 'PostgreSQL + MongoDB'
    };
    return names[database] || database;
  }

  getFeatureName(feature) {
    const names = {
      'auth': 'Authentication (login/register)',
      'payment': 'Payments (Stripe/PayPal)',
      'admin': 'Admin panel',
      'realtime': 'Real-time updates',
      'analytics': 'Analytics & statistics',
      'maps': 'Maps & geolocation',
      'social': 'Social features',
      'api': 'API integration'
    };
    return names[feature] || feature;
  }

  /**
   * Handle conversation iteration
   */
  async continueConversation(userInput) {
    this.conversationHistory.push({ role: 'user', content: userInput });

    // Check if user wants to modify something
    if (this.isModificationRequest(userInput)) {
      return this.handleModification(userInput);
    }

    // Check if user confirms
    if (this.isConfirmation(userInput)) {
      return {
        confirmed: true,
        message: '✅ Świetnie! Zaczynam generowanie projektu...'
      };
    }

    // Ask for clarification
    return {
      confirmed: false,
      message: 'Nie jestem pewien co masz na myśli. Możesz to wyjaśnić lub powiedzieć "tak" jeśli wszystko jest OK?'
    };
  }

  isConfirmation(input) {
    const confirmWords = ['tak', 'yes', 'ok', 'dobrze', 'zgoda', 'generuj', 'start'];
    return confirmWords.some(word => input.toLowerCase().includes(word));
  }

  isModificationRequest(input) {
    const modifyWords = ['nie', 'no', 'zmień', 'change', 'modify', 'inaczej', 'zamiast'];
    return modifyWords.some(word => input.toLowerCase().includes(word));
  }

  async handleModification(input) {
    // Extract what user wants to change
    // This is simplified - in production would use NLP
    
    return {
      confirmed: false,
      message: 'Co chcesz zmienić? Opisz dokładnie:',
      requiresInput: true
    };
  }
}

module.exports = ConversationalAI;

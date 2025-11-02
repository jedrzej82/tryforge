# TryForge - Code Implementation

This directory contains the implementation of TryForge Triple AI Framework.

## Structure

```
src/
├── cli/                    # CLI interface
│   ├── index.js            # Main CLI entry point
│   └── commands/           # Command implementations
│       ├── create.js       # CREATE command
│       ├── refactor.js     # REFACTOR command
│       ├── analyze.js      # ANALYZE command
│       └── status.js       # STATUS command
│
├── orchestrator/           # Main orchestrator (Claude)
│   ├── index.js            # Main orchestrator
│   ├── requirements-analyzer.js   # Analyzes user requirements
│   ├── architecture-planner.js    # Plans app architecture
│   └── integration-manager.js     # Integrates AI outputs
│
├── ai-services/            # AI service integrations
│   ├── pollinations/       # Pollinations AI (graphics)
│   │   └── index.js        # Graphics generation based on Claude's prompts
│   ├── spark/              # GitHub Spark (UI components)
│   │   └── index.js        # UI generation based on Claude's descriptions
│   └── claude-backend/     # Claude backend generator
│       └── index.js        # Backend code generation
│
├── memory/                 # Memory system (MD files)
│   └── index.js            # Records all operations in markdown
│
├── automation/             # Automation scripts
│   └── (deployment, build automation)
│
├── templates/              # Project templates
│   ├── react/              # React template
│   ├── vue/                # Vue template
│   └── express/            # Express backend template
│
└── utils/                  # Utilities
    ├── validators.js       # Input validators
    └── system-check.js     # System checks

```

## Key Concepts

### Triple AI Architecture

The system uses three AI services working in parallel:

1. **Claude (Orchestrator)**
   - Analyzes user requirements
   - Plans architecture
   - **Creates detailed descriptions/prompts for Pollinations and Spark**
   - Generates backend code directly
   - Integrates everything

2. **Pollinations AI (Graphics)**
   - **Receives detailed prompts from Claude**
   - Generates custom graphics based on Claude's descriptions
   - Examples: logos, hero images, icons, illustrations

3. **GitHub Spark (UI Components)**
   - **Receives detailed component descriptions from Claude**
   - Generates React/Vue components based on Claude's specifications
   - Creates modern, responsive UI

### How It Works (CREATE Mode)

1. User provides description: `"Blog platform with comments"`

2. **Claude Orchestrator analyzes and plans:**
   - Identifies type: Blog Platform
   - Plans database: posts, users, comments tables
   - Plans API: GET /api/posts, POST /api/comments, etc.
   - Plans components: HomePage, PostList, PostDetail, etc.
   - **Creates detailed visual descriptions for Pollinations**
   - **Creates detailed component descriptions for Spark**

3. **Triple AI executes in parallel:**

   **Track 1: Pollinations** (based on Claude's visual prompts)
   - Claude prompt: "Blog platform logo, modern pen icon, purple gradient, minimalist"
   - Pollinations generates logo
   - Claude prompt: "Blog hero image, content creation, writer at desk, inspiring"
   - Pollinations generates hero image

   **Track 2: GitHub Spark** (based on Claude's component descriptions)
   - Claude description: "HomePage component with hero section using hero.png, posts grid, search bar, responsive, dark mode"
   - Spark generates HomePage.jsx
   - Claude description: "PostDetail component, markdown rendering, comments section, responsive"
   - Spark generates PostDetail.jsx

   **Track 3: Claude Backend** (Claude generates directly)
   - Database schema SQL
   - Express.js routes
   - Authentication middleware
   - Tests

4. **Integration:**
   - Claude connects frontend to backend API
   - Claude integrates Pollinations graphics into Spark components
   - Environment setup
   - Tests

5. **Result:** Full working application!

### Memory System

All operations are recorded in markdown files (`.bolt-memory/`):
- Each creation → change record MD file
- Each refactor → improvement record MD file
- Before every file change → backup + metadata MD
- Memory index updated → provides context for future sessions

This solves the LLM context window limitation!

## Running

```bash
# Install dependencies
npm install

# Run CLI
npm start

# Or use directly
node src/cli/index.js create "Blog platform"
```

## Development

```bash
# Watch mode
npm run dev

# Lint
npm run lint

# Format
npm run format

# Test
npm test
```

## Architecture Flow

```
User Input → CLI → Orchestrator (Claude)
                        ↓
                   Analyze & Plan
                        ↓
                   Create Descriptions
                   (for other AIs)
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   Pollinations     GitHub Spark     Claude Backend
   (Graphics)       (UI Components)  (API & DB)
   ↓                ↓               ↓
   Images           Components       Backend Code
        ↓               ↓               ↓
        └───────────────┼───────────────┘
                        ↓
                Integration (Claude)
                        ↓
                  Working App!
```

## Important Notes

- **Claude creates all prompts/descriptions** for Pollinations and Spark
- This is the KEY innovation: One AI (Claude) coordinates others
- Pollinations and Spark don't "think" - they execute Claude's detailed instructions
- All three work in parallel = 3x speed improvement
- Memory system = unlimited context via MD files

## Next Steps

See main documentation files (ARCHITECTURE.md, CREATE_MODE.md, etc.) for detailed information about the system.

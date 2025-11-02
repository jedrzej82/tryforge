/**
 * Model Discovery System
 * Automatically discovers and generates missing models based on application requirements
 */

const chalk = require('chalk');
const ora = require('ora');

class ModelDiscovery {
  constructor(ai) {
    this.ai = ai;
    this.knownModels = new Map();
    this.modelRelationships = new Map();
  }

  /**
   * Analyze application requirements and discover needed models
   * @param {Object} requirements - Application requirements
   * @returns {Array} List of required models
   */
  async discoverModels(requirements) {
    const spinner = ora('Analyzing application requirements...').start();

    try {
      const prompt = `Analyze this application requirement and list ALL database models needed:

Application Type: ${requirements.type}
Description: ${requirements.description}
Features: ${requirements.features?.join(', ')}

For each model, provide:
1. Model name (PascalCase, singular)
2. Purpose/description
3. Required fields with types
4. Relationships to other models
5. Indexes needed
6. Validation rules

Return as JSON array with this structure:
[
  {
    "name": "User",
    "purpose": "User accounts and authentication",
    "fields": [
      { "name": "id", "type": "uuid", "primary": true },
      { "name": "email", "type": "string", "unique": true, "required": true },
      { "name": "password", "type": "string", "required": true, "hidden": true },
      { "name": "firstName", "type": "string" },
      { "name": "lastName", "type": "string" },
      { "name": "role", "type": "enum", "values": ["user", "admin"], "default": "user" },
      { "name": "createdAt", "type": "timestamp", "default": "now" }
    ],
    "relationships": [
      { "model": "Order", "type": "hasMany", "foreignKey": "userId" }
    ],
    "indexes": ["email", "role"],
    "validations": {
      "email": "email format",
      "password": "min 8 characters"
    }
  }
]

Be comprehensive. Include ALL models needed for this application to work properly.`;

      const response = await this.ai.generateCode(prompt, {
        type: 'analysis',
        maxTokens: 8000
      });

      // Parse response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse model discovery response');
      }

      const models = JSON.parse(jsonMatch[0]);

      spinner.succeed(`Discovered ${models.length} models needed`);

      // Store discovered models
      models.forEach(model => {
        this.knownModels.set(model.name, model);
      });

      // Build relationship map
      this.buildRelationshipMap(models);

      return models;
    } catch (error) {
      spinner.fail('Model discovery failed');
      console.error(chalk.red(`Error: ${error.message}`));

      // Fallback to basic models
      return this.getBasicModels(requirements);
    }
  }

  /**
   * Build map of model relationships
   */
  buildRelationshipMap(models) {
    models.forEach(model => {
      if (model.relationships) {
        model.relationships.forEach(rel => {
          const key = `${model.name}->${rel.model}`;
          this.modelRelationships.set(key, {
            from: model.name,
            to: rel.model,
            type: rel.type,
            foreignKey: rel.foreignKey
          });
        });
      }
    });
  }

  /**
   * Check if model exists in the project
   */
  async modelExists(modelName, projectPath) {
    const fs = require('fs-extra');
    const path = require('path');

    const possiblePaths = [
      path.join(projectPath, 'backend', 'src', 'models', `${modelName}.js`),
      path.join(projectPath, 'backend', 'src', 'models', `${modelName}.ts`),
      path.join(projectPath, 'backend', 'models', `${modelName}.js`),
      path.join(projectPath, 'src', 'models', `${modelName}.js`),
      path.join(projectPath, 'prisma', 'schema.prisma'), // Check in Prisma schema
    ];

    for (const filePath of possiblePaths) {
      if (await fs.pathExists(filePath)) {
        // For Prisma, check if model is defined in schema
        if (filePath.includes('prisma')) {
          const content = await fs.readFile(filePath, 'utf8');
          if (content.includes(`model ${modelName}`)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get missing models that need to be generated
   */
  async getMissingModels(requiredModels, projectPath) {
    const missing = [];

    for (const model of requiredModels) {
      const exists = await this.modelExists(model.name, projectPath);
      if (!exists) {
        missing.push(model);
      } else {
        console.log(chalk.gray(`  ✓ ${model.name} already exists`));
      }
    }

    return missing;
  }

  /**
   * Resolve model dependencies (order models by dependencies)
   */
  resolveDependencies(models) {
    const resolved = [];
    const unresolved = [...models];

    while (unresolved.length > 0) {
      let progress = false;

      for (let i = 0; i < unresolved.length; i++) {
        const model = unresolved[i];
        const dependencies = this.getModelDependencies(model);

        // Check if all dependencies are resolved
        const allDepsResolved = dependencies.every(dep =>
          resolved.some(r => r.name === dep)
        );

        if (dependencies.length === 0 || allDepsResolved) {
          resolved.push(model);
          unresolved.splice(i, 1);
          progress = true;
          break;
        }
      }

      // Prevent infinite loop
      if (!progress) {
        // Add remaining models (circular dependencies or independent)
        resolved.push(...unresolved);
        break;
      }
    }

    return resolved;
  }

  /**
   * Get model dependencies (other models it references)
   */
  getModelDependencies(model) {
    if (!model.relationships) return [];

    return model.relationships
      .filter(rel => rel.type === 'belongsTo' || rel.type === 'manyToOne')
      .map(rel => rel.model);
  }

  /**
   * Enrich model with AI-generated additional details
   */
  async enrichModel(model, context = {}) {
    const spinner = ora(`Enriching ${model.name} model...`).start();

    try {
      const prompt = `Enhance this database model with best practices:

Model: ${model.name}
Purpose: ${model.purpose}
Context: ${JSON.stringify(context, null, 2)}

Current fields: ${JSON.stringify(model.fields, null, 2)}

Add/suggest:
1. Additional useful fields that might be needed
2. Proper indexes for performance
3. Validation rules
4. Default values
5. Field descriptions
6. Timestamps (createdAt, updatedAt)
7. Soft delete field if applicable

Return enhanced model as JSON with same structure but improved.`;

      const response = await this.ai.generateCode(prompt, {
        type: 'analysis',
        maxTokens: 2000
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enriched = JSON.parse(jsonMatch[0]);
        spinner.succeed(`Enriched ${model.name} model`);
        return enriched;
      }

      spinner.warn(`Could not enrich ${model.name}, using original`);
      return model;
    } catch (error) {
      spinner.warn(`Could not enrich ${model.name}: ${error.message}`);
      return model;
    }
  }

  /**
   * Analyze existing project and discover missing models
   */
  async analyzeProject(projectPath) {
    const fs = require('fs-extra');
    const path = require('path');

    console.log(chalk.cyan('🔍 Analyzing existing project...'));

    const analysis = {
      existingModels: [],
      missingRelationships: [],
      suggestedModels: []
    };

    // Find existing models
    const modelDirs = [
      path.join(projectPath, 'backend', 'src', 'models'),
      path.join(projectPath, 'backend', 'models'),
      path.join(projectPath, 'src', 'models'),
    ];

    for (const dir of modelDirs) {
      if (await fs.pathExists(dir)) {
        const files = await fs.readdir(dir);
        analysis.existingModels = files
          .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
          .map(f => path.basename(f, path.extname(f)));
      }
    }

    // Check Prisma schema
    const prismaPath = path.join(projectPath, 'prisma', 'schema.prisma');
    if (await fs.pathExists(prismaPath)) {
      const schema = await fs.readFile(prismaPath, 'utf8');
      const modelMatches = schema.matchAll(/model\s+(\w+)\s*\{/g);
      for (const match of modelMatches) {
        analysis.existingModels.push(match[1]);
      }
    }

    console.log(chalk.green(`  Found ${analysis.existingModels.length} existing models`));

    return analysis;
  }

  /**
   * Get basic models as fallback
   */
  getBasicModels(requirements) {
    const basic = [
      {
        name: 'User',
        purpose: 'User accounts and authentication',
        fields: [
          { name: 'id', type: 'uuid', primary: true },
          { name: 'email', type: 'string', unique: true, required: true },
          { name: 'password', type: 'string', required: true, hidden: true },
          { name: 'name', type: 'string' },
          { name: 'role', type: 'enum', values: ['user', 'admin'], default: 'user' },
          { name: 'createdAt', type: 'timestamp', default: 'now' },
          { name: 'updatedAt', type: 'timestamp', default: 'now' }
        ],
        indexes: ['email', 'role'],
        validations: {
          email: 'email format',
          password: 'min 8 characters'
        }
      }
    ];

    // Add common models based on app type
    if (requirements.type === 'ecommerce' || requirements.type === 'marketplace') {
      basic.push(
        {
          name: 'Product',
          purpose: 'Product catalog',
          fields: [
            { name: 'id', type: 'uuid', primary: true },
            { name: 'name', type: 'string', required: true },
            { name: 'description', type: 'text' },
            { name: 'price', type: 'decimal', required: true },
            { name: 'stock', type: 'integer', default: 0 },
            { name: 'createdAt', type: 'timestamp', default: 'now' }
          ]
        },
        {
          name: 'Order',
          purpose: 'Customer orders',
          fields: [
            { name: 'id', type: 'uuid', primary: true },
            { name: 'userId', type: 'uuid', required: true },
            { name: 'status', type: 'enum', values: ['pending', 'paid', 'shipped', 'delivered'] },
            { name: 'total', type: 'decimal', required: true },
            { name: 'createdAt', type: 'timestamp', default: 'now' }
          ],
          relationships: [
            { model: 'User', type: 'belongsTo', foreignKey: 'userId' }
          ]
        }
      );
    }

    return basic;
  }

  /**
   * Generate model summary report
   */
  generateReport(models) {
    console.log(chalk.cyan('\n📊 Model Discovery Report\n'));

    models.forEach((model, index) => {
      console.log(chalk.white(`${index + 1}. ${chalk.bold(model.name)}`));
      console.log(chalk.gray(`   Purpose: ${model.purpose}`));
      console.log(chalk.gray(`   Fields: ${model.fields.length}`));

      if (model.relationships && model.relationships.length > 0) {
        console.log(chalk.gray(`   Relationships: ${model.relationships.map(r => `${r.type} ${r.model}`).join(', ')}`));
      }

      console.log('');
    });

    console.log(chalk.cyan(`Total models: ${models.length}\n`));
  }
}

module.exports = ModelDiscovery;

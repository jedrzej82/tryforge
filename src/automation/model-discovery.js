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
      suggestedModels: [],
      prismaModels: [],
      prismaEnums: [],
      prismaRelations: []
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

    // Check Prisma schema (Enhanced)
    const prismaPath = path.join(projectPath, 'prisma', 'schema.prisma');
    if (await fs.pathExists(prismaPath)) {
      const prismaAnalysis = await this.analyzePrismaSchema(prismaPath);
      analysis.prismaModels = prismaAnalysis.models;
      analysis.prismaEnums = prismaAnalysis.enums;
      analysis.prismaRelations = prismaAnalysis.relations;

      // Add Prisma models to existing models
      analysis.existingModels.push(...prismaAnalysis.models.map(m => m.name));
    }

    console.log(chalk.green(`  Found ${analysis.existingModels.length} existing models`));

    if (analysis.prismaModels.length > 0) {
      console.log(chalk.cyan(`  Prisma models: ${analysis.prismaModels.length}`));
    }

    return analysis;
  }

  /**
   * Analyze Prisma schema and extract models, enums, and relations
   */
  async analyzePrismaSchema(schemaPath) {
    const fs = require('fs-extra');
    const schema = await fs.readFile(schemaPath, 'utf8');

    const analysis = {
      models: [],
      enums: [],
      relations: []
    };

    // Extract models
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let modelMatch;

    while ((modelMatch = modelRegex.exec(schema)) !== null) {
      const modelName = modelMatch[1];
      const modelBody = modelMatch[2];

      const model = {
        name: modelName,
        fields: [],
        relations: []
      };

      // Extract fields
      const fieldLines = modelBody.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'));

      for (const line of fieldLines) {
        // Skip relation fields (they contain model names)
        if (line.includes('@relation')) {
          const relationMatch = line.match(/(\w+)\s+(\w+)(\[\])?\??/);
          if (relationMatch) {
            model.relations.push({
              field: relationMatch[1],
              model: relationMatch[2],
              isArray: !!relationMatch[3]
            });
          }
          continue;
        }

        // Parse regular fields
        const fieldMatch = line.match(/(\w+)\s+(\w+)(\[\])?\??/);
        if (fieldMatch) {
          const field = {
            name: fieldMatch[1],
            type: fieldMatch[2],
            isArray: !!fieldMatch[3],
            isOptional: line.includes('?'),
            isId: line.includes('@id'),
            isUnique: line.includes('@unique'),
            hasDefault: line.includes('@default'),
            isUpdatedAt: line.includes('@updatedAt')
          };

          // Extract default value
          if (field.hasDefault) {
            const defaultMatch = line.match(/@default\(([^)]+)\)/);
            if (defaultMatch) {
              field.default = defaultMatch[1];
            }
          }

          model.fields.push(field);
        }
      }

      analysis.models.push(model);
    }

    // Extract enums
    const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
    let enumMatch;

    while ((enumMatch = enumRegex.exec(schema)) !== null) {
      const enumName = enumMatch[1];
      const enumBody = enumMatch[2];

      const values = enumBody
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));

      analysis.enums.push({
        name: enumName,
        values
      });
    }

    // Build relation map
    for (const model of analysis.models) {
      for (const relation of model.relations) {
        analysis.relations.push({
          from: model.name,
          to: relation.model,
          field: relation.field,
          type: relation.isArray ? 'oneToMany' : 'oneToOne'
        });
      }
    }

    return analysis;
  }

  /**
   * Parse Prisma schema and extract model definitions
   */
  async parsePrismaSchema(schemaPath) {
    const analysis = await this.analyzePrismaSchema(schemaPath);

    // Convert to model definitions format
    return analysis.models.map(model => ({
      name: model.name,
      purpose: `${model.name} model`,
      fields: model.fields.map(field => ({
        name: field.name,
        type: this.convertPrismaTypeToGeneric(field.type),
        required: !field.isOptional,
        unique: field.isUnique,
        primary: field.isId,
        default: field.default,
        updatedAt: field.isUpdatedAt
      })),
      relationships: model.relations.map(rel => ({
        model: rel.model,
        type: rel.isArray ? 'hasMany' : 'hasOne',
        foreignKey: `${rel.model.toLowerCase()}Id`
      }))
    }));
  }

  /**
   * Convert Prisma type to generic type
   */
  convertPrismaTypeToGeneric(prismaType) {
    const typeMap = {
      'String': 'string',
      'Int': 'integer',
      'BigInt': 'bigint',
      'Float': 'float',
      'Decimal': 'decimal',
      'Boolean': 'boolean',
      'DateTime': 'timestamp',
      'Json': 'json',
      'Bytes': 'bytes'
    };

    return typeMap[prismaType] || 'string';
  }

  /**
   * Detect Prisma models from TypeScript Prisma Client usage
   */
  async detectPrismaUsage(projectPath) {
    const fs = require('fs-extra');
    const path = require('path');

    const detectedModels = new Set();

    // Search for prisma client usage in TypeScript/JavaScript files
    const searchDirs = [
      path.join(projectPath, 'src'),
      path.join(projectPath, 'backend', 'src')
    ];

    for (const dir of searchDirs) {
      if (await fs.pathExists(dir)) {
        await this.searchForPrismaUsage(dir, detectedModels);
      }
    }

    return Array.from(detectedModels);
  }

  /**
   * Recursively search for Prisma usage
   */
  async searchForPrismaUsage(dir, detectedModels) {
    const fs = require('fs-extra');
    const path = require('path');

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules
        if (entry.name !== 'node_modules') {
          await this.searchForPrismaUsage(fullPath, detectedModels);
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        const content = await fs.readFile(fullPath, 'utf8');

        // Look for prisma.modelName patterns
        const usageRegex = /prisma\.(\w+)\./g;
        let match;

        while ((match = usageRegex.exec(content)) !== null) {
          // Capitalize first letter to match model naming convention
          const modelName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          detectedModels.add(modelName);
        }
      }
    }
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

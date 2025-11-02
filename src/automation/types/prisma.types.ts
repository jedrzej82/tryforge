/**
 * TypeScript Type Definitions for Prisma Integration
 * Provides type safety for model definitions and schema generation
 */

/**
 * Prisma field types
 */
export type PrismaFieldType =
  | 'String'
  | 'Int'
  | 'BigInt'
  | 'Float'
  | 'Decimal'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Bytes';

/**
 * Database providers supported by Prisma
 */
export type PrismaDatabaseProvider =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'sqlserver'
  | 'mongodb'
  | 'cockroachdb';

/**
 * Referential actions for relations
 */
export type ReferentialAction =
  | 'Cascade'
  | 'Restrict'
  | 'NoAction'
  | 'SetNull'
  | 'SetDefault';

/**
 * Relation types
 */
export type RelationType =
  | 'hasOne'
  | 'hasMany'
  | 'belongsTo'
  | 'manyToOne'
  | 'oneToOne'
  | 'manyToMany';

/**
 * Default value functions
 */
export type DefaultValueFunction =
  | 'uuid'
  | 'cuid'
  | 'autoincrement'
  | 'now'
  | 'dbgenerated';

/**
 * Default value definition
 */
export interface DefaultValue {
  function?: DefaultValueFunction;
  value?: string | number | boolean;
}

/**
 * Field definition for Prisma models
 */
export interface PrismaFieldDefinition {
  name: string;
  type: PrismaFieldType | string; // string allows for enum types
  isRequired?: boolean;
  required?: boolean; // Alias for isRequired
  optional?: boolean; // Opposite of required
  isUnique?: boolean;
  unique?: boolean; // Alias for isUnique
  isId?: boolean;
  primary?: boolean; // Alias for isId
  default?: DefaultValue | string | number | boolean;
  isUpdatedAt?: boolean;
  updatedAt?: boolean; // Alias for isUpdatedAt
  isList?: boolean;
  isArray?: boolean; // Alias for isList
  map?: string; // Column name mapping
  dbType?: string; // Database-specific type (e.g., VarChar(255))
  documentation?: string; // JSDoc comment
  relation?: PrismaRelationDefinition;

  // For enum fields
  enum?: string[];
  values?: string[];
  enumName?: string;
}

/**
 * Relation definition
 */
export interface PrismaRelationDefinition {
  model: string; // Related model name
  type: RelationType;
  name?: string; // Relation field name (optional)
  relationName?: string; // Relation name for disambiguation
  fields?: string[]; // Foreign key field(s)
  references?: string[]; // Referenced field(s) in related model
  foreignKey?: string; // Alias for single field
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

/**
 * Index definition
 */
export interface PrismaIndexDefinition {
  fields: string[];
  name?: string;
  type?: 'BTree' | 'Hash'; // Database-specific
}

/**
 * Unique constraint definition
 */
export interface PrismaUniqueConstraintDefinition {
  fields: string[];
  name?: string;
}

/**
 * Model definition
 */
export interface PrismaModelDefinition {
  name: string;
  fields: PrismaFieldDefinition[];
  relations?: PrismaRelationDefinition[];
  indexes?: (string[] | string | PrismaIndexDefinition)[];
  uniqueConstraints?: (string[] | PrismaUniqueConstraintDefinition)[];
  compositeId?: string[]; // Composite primary key
  tableName?: string; // Custom table name via @@map
  documentation?: string; // Model-level documentation
  purpose?: string; // Model purpose (for code generation)
  validations?: Record<string, string>; // Validation rules
}

/**
 * Enum definition
 */
export interface PrismaEnumDefinition {
  name: string;
  values: string[];
  documentation?: string;
}

/**
 * Schema configuration
 */
export interface PrismaSchemaConfig {
  provider: PrismaDatabaseProvider;
  databaseUrl?: string;
  clientProvider?: string;
  previewFeatures?: string[];
  binaryTargets?: string[];
  shadowDatabaseUrl?: string;
  relationMode?: 'foreignKeys' | 'prisma';
}

/**
 * Complete schema definition
 */
export interface PrismaSchemaDefinition {
  config: PrismaSchemaConfig;
  models: PrismaModelDefinition[];
  enums: PrismaEnumDefinition[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Migration options
 */
export interface MigrationOptions {
  name?: string;
  createOnly?: boolean;
  skipGenerate?: boolean;
  acceptDataLoss?: boolean;
  force?: boolean;
}

/**
 * Push options for db push
 */
export interface PushOptions {
  acceptDataLoss?: boolean;
  forceReset?: boolean;
  skipGenerate?: boolean;
}

/**
 * Reset options for migrate reset
 */
export interface ResetOptions {
  force?: boolean;
  skipGenerate?: boolean;
  skipSeed?: boolean;
}

/**
 * Schema generation result
 */
export interface SchemaGenerationResult {
  success: boolean;
  schema?: string;
  error?: string;
  path?: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  output?: string;
  error?: string;
  step?: string;
}

/**
 * Model generation options
 */
export interface ModelGenerationOptions {
  orm?: 'prisma' | 'sequelize' | 'typeorm' | 'mongoose';
  language?: 'javascript' | 'typescript';
  generateMigrations?: boolean;
  autoMigrate?: boolean;
  formatSchema?: boolean;
  validateSchema?: boolean;
}

/**
 * Database field type mapping
 */
export interface DatabaseTypeMapping {
  prisma: PrismaFieldType;
  database: string;
  typescript: string;
}

/**
 * Schema builder interface
 */
export interface IPrismaSchemaBuilder {
  addModel(model: PrismaModelDefinition): IPrismaSchemaBuilder;
  addEnum(name: string, values: string[]): IPrismaSchemaBuilder;
  generateSchema(): string;
  validateSchema(): boolean;
  getValidationErrors(): string[];
  clear(): IPrismaSchemaBuilder;
  getModels(): PrismaModelDefinition[];
  getEnums(): PrismaEnumDefinition[];
}

/**
 * Migration helper interface
 */
export interface IPrismaMigrationHelper {
  isPrismaInstalled(): Promise<boolean>;
  initializePrisma(provider?: PrismaDatabaseProvider): Promise<MigrationResult>;
  formatSchema(): Promise<MigrationResult>;
  validateSchema(): Promise<MigrationResult>;
  generateClient(): Promise<MigrationResult>;
  createMigration(name: string): Promise<MigrationResult>;
  applyMigrationsDev(name?: string): Promise<MigrationResult>;
  deployMigrations(): Promise<MigrationResult>;
  getMigrationStatus(): Promise<MigrationResult>;
  pushSchema(options?: PushOptions): Promise<MigrationResult>;
  pullSchema(): Promise<MigrationResult>;
  resetDatabase(options?: ResetOptions): Promise<MigrationResult>;
  seedDatabase(): Promise<MigrationResult>;
  autoMigrate(migrationName: string): Promise<MigrationResult>;
  quickSetup(provider?: PrismaDatabaseProvider): Promise<MigrationResult>;
}

/**
 * Model discovery result
 */
export interface ModelDiscoveryResult {
  models: PrismaModelDefinition[];
  existingModels: string[];
  missingModels: PrismaModelDefinition[];
  relationships: Map<string, PrismaRelationDefinition>;
}

/**
 * Example schema templates
 */
export type SchemaTemplate =
  | 'ecommerce'
  | 'blog'
  | 'saas'
  | 'social'
  | 'crm'
  | 'basic';

/**
 * Template definition
 */
export interface SchemaTemplateDefinition {
  name: string;
  description: string;
  models: PrismaModelDefinition[];
  enums: PrismaEnumDefinition[];
}

/**
 * Prisma best practices configuration
 */
export interface PrismaBestPractices {
  addTimestamps?: boolean; // Add createdAt/updatedAt
  addSoftDelete?: boolean; // Add deletedAt
  addIndexesForForeignKeys?: boolean; // Auto-create indexes for FKs
  enforceNamingConventions?: boolean; // PascalCase for models, camelCase for fields
  addDefaultOnDelete?: ReferentialAction; // Default onDelete action
  addDefaultOnUpdate?: ReferentialAction; // Default onUpdate action
}

/**
 * Export all types
 */
export type {
  PrismaFieldType,
  PrismaDatabaseProvider,
  ReferentialAction,
  RelationType,
  DefaultValueFunction,
  DefaultValue,
  PrismaFieldDefinition,
  PrismaRelationDefinition,
  PrismaIndexDefinition,
  PrismaUniqueConstraintDefinition,
  PrismaModelDefinition,
  PrismaEnumDefinition,
  PrismaSchemaConfig,
  PrismaSchemaDefinition,
  ValidationResult,
  MigrationOptions,
  PushOptions,
  ResetOptions,
  SchemaGenerationResult,
  MigrationResult,
  ModelGenerationOptions,
  DatabaseTypeMapping,
  IPrismaSchemaBuilder,
  IPrismaMigrationHelper,
  ModelDiscoveryResult,
  SchemaTemplate,
  SchemaTemplateDefinition,
  PrismaBestPractices,
};

/**
 * Type guards
 */
export function isPrismaFieldType(type: string): type is PrismaFieldType {
  const validTypes: PrismaFieldType[] = [
    'String',
    'Int',
    'BigInt',
    'Float',
    'Decimal',
    'Boolean',
    'DateTime',
    'Json',
    'Bytes',
  ];
  return validTypes.includes(type as PrismaFieldType);
}

export function isReferentialAction(action: string): action is ReferentialAction {
  const validActions: ReferentialAction[] = [
    'Cascade',
    'Restrict',
    'NoAction',
    'SetNull',
    'SetDefault',
  ];
  return validActions.includes(action as ReferentialAction);
}

export function isRelationType(type: string): type is RelationType {
  const validTypes: RelationType[] = [
    'hasOne',
    'hasMany',
    'belongsTo',
    'manyToOne',
    'oneToOne',
    'manyToMany',
  ];
  return validTypes.includes(type as RelationType);
}

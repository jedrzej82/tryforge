/**
 * Dependency Analyzer
 * Analyzes project dependencies and imports
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const ASTUtils = require('../utils/ast-utils');

class DependencyAnalyzer {
  /**
   * Analyze dependencies in project
   * @param {string} rootPath - Project root path
   * @returns {object} Dependency analysis
   */
  static async analyzeProject(rootPath) {
    try {
      const files = await this.findJavaScriptFiles(rootPath);
      const dependencies = await this.analyzeDependencies(files);

      return {
        success: true,
        dependencies,
        graph: this.buildDependencyGraph(dependencies),
        circular: this.findCircularDependencies(dependencies),
        unused: await this.findUnusedDependencies(rootPath, dependencies),
        external: this.categorizeExternalDependencies(dependencies),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find JavaScript files in project
   * @param {string} rootPath - Root path
   * @returns {array} File paths
   */
  static async findJavaScriptFiles(rootPath) {
    return new Promise((resolve, reject) => {
      glob(
        '**/*.{js,jsx,ts,tsx}',
        {
          cwd: rootPath,
          ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
          absolute: true,
        },
        (err, files) => {
          if (err) reject(err);
          else resolve(files);
        }
      );
    });
  }

  /**
   * Analyze dependencies in files
   * @param {array} files - File paths
   * @returns {object} Dependencies
   */
  static async analyzeDependencies(files) {
    const dependencies = {};

    for (const file of files) {
      try {
        const code = await fs.readFile(file, 'utf8');
        const ast = ASTUtils.parse(code);

        dependencies[file] = {
          imports: this.extractImports(ast),
          exports: this.extractExports(ast),
          requires: this.extractRequires(ast),
        };
      } catch (error) {
        dependencies[file] = {
          error: error.message,
        };
      }
    }

    return dependencies;
  }

  /**
   * Extract imports from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Imports
   */
  static extractImports(ast) {
    const imports = [];

    ASTUtils.traverse(ast, {
      ImportDeclaration(path) {
        imports.push({
          type: 'import',
          source: path.node.source.value,
          specifiers: path.node.specifiers.map((spec) => ({
            type: spec.type,
            local: spec.local.name,
            imported: spec.imported ? spec.imported.name : null,
          })),
          location: ASTUtils.getLocation(path.node),
        });
      },
    });

    return imports;
  }

  /**
   * Extract exports from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Exports
   */
  static extractExports(ast) {
    const exports = [];

    ASTUtils.traverse(ast, {
      ExportNamedDeclaration(path) {
        exports.push({
          type: 'named',
          declaration: path.node.declaration,
          specifiers: path.node.specifiers,
          location: ASTUtils.getLocation(path.node),
        });
      },

      ExportDefaultDeclaration(path) {
        exports.push({
          type: 'default',
          declaration: path.node.declaration,
          location: ASTUtils.getLocation(path.node),
        });
      },

      ExportAllDeclaration(path) {
        exports.push({
          type: 'all',
          source: path.node.source.value,
          location: ASTUtils.getLocation(path.node),
        });
      },
    });

    return exports;
  }

  /**
   * Extract require statements from AST
   * @param {object} ast - Abstract Syntax Tree
   * @returns {array} Requires
   */
  static extractRequires(ast) {
    const requires = [];

    ASTUtils.traverse(ast, {
      CallExpression(path) {
        if (
          path.node.callee.name === 'require' &&
          path.node.arguments.length > 0 &&
          path.node.arguments[0].type === 'StringLiteral'
        ) {
          requires.push({
            type: 'require',
            source: path.node.arguments[0].value,
            location: ASTUtils.getLocation(path.node),
          });
        }
      },
    });

    return requires;
  }

  /**
   * Build dependency graph
   * @param {object} dependencies - Dependencies
   * @returns {object} Dependency graph
   */
  static buildDependencyGraph(dependencies) {
    const graph = {};

    for (const [file, deps] of Object.entries(dependencies)) {
      if (deps.error) continue;

      graph[file] = {
        dependencies: [],
        dependents: [],
      };

      // Add imports and requires as dependencies
      const allDeps = [...deps.imports, ...deps.requires];
      for (const dep of allDeps) {
        if (this.isRelativeImport(dep.source)) {
          const resolvedPath = this.resolveRelativePath(file, dep.source);
          graph[file].dependencies.push(resolvedPath);
        }
      }
    }

    // Build dependents
    for (const [file, data] of Object.entries(graph)) {
      for (const dep of data.dependencies) {
        if (graph[dep]) {
          graph[dep].dependents.push(file);
        }
      }
    }

    return graph;
  }

  /**
   * Check if import is relative
   * @param {string} source - Import source
   * @returns {boolean} Is relative
   */
  static isRelativeImport(source) {
    return source.startsWith('./') || source.startsWith('../');
  }

  /**
   * Resolve relative path
   * @param {string} fromFile - From file
   * @param {string} toFile - To file
   * @returns {string} Resolved path
   */
  static resolveRelativePath(fromFile, toFile) {
    const dir = path.dirname(fromFile);
    let resolved = path.resolve(dir, toFile);

    // Try common extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }

    return resolved;
  }

  /**
   * Find circular dependencies
   * @param {object} dependencies - Dependencies
   * @returns {array} Circular dependencies
   */
  static findCircularDependencies(dependencies) {
    const graph = this.buildDependencyGraph(dependencies);
    const circular = [];
    const visited = new Set();
    const recursionStack = new Set();

    const detectCycle = (file, path = []) => {
      if (!graph[file]) return false;

      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      for (const dep of graph[file].dependencies) {
        if (!visited.has(dep)) {
          if (detectCycle(dep, [...path])) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          // Circular dependency found
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart);
          cycle.push(dep);

          circular.push({
            cycle,
            length: cycle.length - 1,
          });
          return true;
        }
      }

      recursionStack.delete(file);
      return false;
    };

    for (const file of Object.keys(graph)) {
      if (!visited.has(file)) {
        detectCycle(file);
      }
    }

    return circular;
  }

  /**
   * Find unused dependencies
   * @param {string} rootPath - Root path
   * @param {object} fileDependencies - File dependencies
   * @returns {array} Unused dependencies
   */
  static async findUnusedDependencies(rootPath, fileDependencies) {
    try {
      const packageJsonPath = path.join(rootPath, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        return [];
      }

      const packageJson = await fs.readJson(packageJsonPath);
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const usedDependencies = new Set();

      for (const deps of Object.values(fileDependencies)) {
        if (deps.error) continue;

        const allDeps = [...deps.imports, ...deps.requires];
        for (const dep of allDeps) {
          if (!this.isRelativeImport(dep.source)) {
            const packageName = this.getPackageName(dep.source);
            usedDependencies.add(packageName);
          }
        }
      }

      const unused = [];
      for (const dep of Object.keys(allDependencies)) {
        if (!usedDependencies.has(dep)) {
          unused.push({
            name: dep,
            version: allDependencies[dep],
          });
        }
      }

      return unused;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get package name from import
   * @param {string} importPath - Import path
   * @returns {string} Package name
   */
  static getPackageName(importPath) {
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return `${parts[0]}/${parts[1]}`;
    }
    return importPath.split('/')[0];
  }

  /**
   * Categorize external dependencies
   * @param {object} dependencies - Dependencies
   * @returns {object} Categorized dependencies
   */
  static categorizeExternalDependencies(dependencies) {
    const external = {
      packages: new Set(),
      builtin: new Set(),
      relative: new Set(),
    };

    const builtinModules = [
      'fs',
      'path',
      'http',
      'https',
      'crypto',
      'util',
      'os',
      'events',
      'stream',
      'buffer',
      'child_process',
    ];

    for (const deps of Object.values(dependencies)) {
      if (deps.error) continue;

      const allDeps = [...deps.imports, ...deps.requires];
      for (const dep of allDeps) {
        if (this.isRelativeImport(dep.source)) {
          external.relative.add(dep.source);
        } else if (builtinModules.includes(dep.source)) {
          external.builtin.add(dep.source);
        } else {
          external.packages.add(this.getPackageName(dep.source));
        }
      }
    }

    return {
      packages: Array.from(external.packages),
      builtin: Array.from(external.builtin),
      relative: Array.from(external.relative),
    };
  }

  /**
   * Get dependency statistics
   * @param {object} graph - Dependency graph
   * @returns {object} Statistics
   */
  static getDependencyStats(graph) {
    const stats = {
      totalFiles: Object.keys(graph).length,
      avgDependencies: 0,
      maxDependencies: 0,
      avgDependents: 0,
      maxDependents: 0,
      isolatedFiles: 0,
    };

    let totalDeps = 0;
    let totalDependents = 0;

    for (const data of Object.values(graph)) {
      const deps = data.dependencies.length;
      const dependents = data.dependents.length;

      totalDeps += deps;
      totalDependents += dependents;

      stats.maxDependencies = Math.max(stats.maxDependencies, deps);
      stats.maxDependents = Math.max(stats.maxDependents, dependents);

      if (deps === 0 && dependents === 0) {
        stats.isolatedFiles++;
      }
    }

    if (stats.totalFiles > 0) {
      stats.avgDependencies = (totalDeps / stats.totalFiles).toFixed(2);
      stats.avgDependents = (totalDependents / stats.totalFiles).toFixed(2);
    }

    return stats;
  }
}

module.exports = DependencyAnalyzer;

/**
 * Migration Dependencies Resolver
 * Manages dependencies between migrations and determines execution order
 */

const logger = require('../utils/logger');
const {
  MigrationDependencyError,
  CircularDependencyError
} = require('./migration-errors');

class MigrationDependencies {
  constructor() {
    this.dependencies = new Map(); // migration -> dependencies
    this.reverseDependencies = new Map(); // migration -> dependents
  }

  /**
   * Add a dependency
   */
  addDependency(migration, dependsOn) {
    if (!this.dependencies.has(migration)) {
      this.dependencies.set(migration, new Set());
    }

    if (Array.isArray(dependsOn)) {
      dependsOn.forEach(dep => this.dependencies.get(migration).add(dep));
    } else {
      this.dependencies.get(migration).add(dependsOn);
    }

    // Update reverse dependencies
    const deps = Array.isArray(dependsOn) ? dependsOn : [dependsOn];

    deps.forEach(dep => {
      if (!this.reverseDependencies.has(dep)) {
        this.reverseDependencies.set(dep, new Set());
      }
      this.reverseDependencies.get(dep).add(migration);
    });

    logger.debug('Migration dependency added', {
      migration,
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [dependsOn]
    });
  }

  /**
   * Remove a dependency
   */
  removeDependency(migration, dependsOn) {
    if (this.dependencies.has(migration)) {
      if (dependsOn) {
        this.dependencies.get(migration).delete(dependsOn);

        // Update reverse dependencies
        if (this.reverseDependencies.has(dependsOn)) {
          this.reverseDependencies.get(dependsOn).delete(migration);
        }
      } else {
        // Remove all dependencies for this migration
        const deps = this.dependencies.get(migration);
        deps.forEach(dep => {
          if (this.reverseDependencies.has(dep)) {
            this.reverseDependencies.get(dep).delete(migration);
          }
        });
        this.dependencies.delete(migration);
      }
    }

    logger.debug('Migration dependency removed', { migration, dependsOn });
  }

  /**
   * Get dependencies for a migration
   */
  getDependencies(migration) {
    return Array.from(this.dependencies.get(migration) || []);
  }

  /**
   * Get dependents (reverse dependencies) for a migration
   */
  getDependents(migration) {
    return Array.from(this.reverseDependencies.get(migration) || []);
  }

  /**
   * Check if migration has dependencies
   */
  hasDependencies(migration) {
    return this.dependencies.has(migration) && this.dependencies.get(migration).size > 0;
  }

  /**
   * Check if migration has dependents
   */
  hasDependents(migration) {
    return this.reverseDependencies.has(migration) && this.reverseDependencies.get(migration).size > 0;
  }

  /**
   * Resolve execution order using topological sort
   */
  resolveOrder(migrations) {
    logger.debug('Resolving migration order', {
      count: migrations.length
    });

    // Detect circular dependencies first
    this.detectCircular();

    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (migration) => {
      if (visited.has(migration)) {
        return;
      }

      if (visiting.has(migration)) {
        throw new CircularDependencyError(
          `Circular dependency detected involving: ${migration}`,
          Array.from(visiting)
        );
      }

      visiting.add(migration);

      // Visit dependencies first
      const deps = this.getDependencies(migration);
      deps.forEach(dep => {
        if (migrations.includes(dep)) {
          visit(dep);
        }
      });

      visiting.delete(migration);
      visited.add(migration);
      sorted.push(migration);
    };

    // Visit all migrations
    migrations.forEach(migration => {
      if (!visited.has(migration)) {
        visit(migration);
      }
    });

    logger.debug('Migration order resolved', {
      count: sorted.length,
      order: sorted
    });

    return sorted;
  }

  /**
   * Detect circular dependencies
   */
  detectCircular() {
    const visited = new Set();
    const visiting = new Set();
    const path = [];

    const visit = (migration) => {
      if (visited.has(migration)) {
        return false;
      }

      if (visiting.has(migration)) {
        // Found a cycle
        const cycleStart = path.indexOf(migration);
        const cycle = path.slice(cycleStart).concat(migration);

        throw new CircularDependencyError(
          `Circular dependency detected: ${cycle.join(' -> ')}`,
          cycle
        );
      }

      visiting.add(migration);
      path.push(migration);

      const deps = this.getDependencies(migration);

      for (const dep of deps) {
        visit(dep);
      }

      path.pop();
      visiting.delete(migration);
      visited.add(migration);

      return false;
    };

    // Check all migrations
    for (const migration of this.dependencies.keys()) {
      if (!visited.has(migration)) {
        visit(migration);
      }
    }

    logger.debug('No circular dependencies detected');

    return false;
  }

  /**
   * Validate that all dependencies exist
   */
  validate(availableMigrations) {
    const available = new Set(availableMigrations);
    const missing = new Map();

    for (const [migration, deps] of this.dependencies.entries()) {
      const missingDeps = Array.from(deps).filter(dep => !available.has(dep));

      if (missingDeps.length > 0) {
        missing.set(migration, missingDeps);
      }
    }

    if (missing.size > 0) {
      const details = Array.from(missing.entries()).map(([migration, deps]) => ({
        migration,
        missingDependencies: deps
      }));

      throw new MigrationDependencyError(
        'Missing migration dependencies',
        null,
        Array.from(missing.keys()),
        { details }
      );
    }

    logger.debug('All migration dependencies validated');

    return true;
  }

  /**
   * Get dependency tree
   */
  getDependencyTree(migration) {
    const tree = {
      name: migration,
      dependencies: []
    };

    const deps = this.getDependencies(migration);

    deps.forEach(dep => {
      tree.dependencies.push(this.getDependencyTree(dep));
    });

    return tree;
  }

  /**
   * Get all migrations that need to run before a given migration
   */
  getAllDependencies(migration) {
    const allDeps = new Set();

    const collect = (m) => {
      const deps = this.getDependencies(m);

      deps.forEach(dep => {
        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          collect(dep);
        }
      });
    };

    collect(migration);

    return Array.from(allDeps);
  }

  /**
   * Get all migrations that depend on a given migration
   */
  getAllDependents(migration) {
    const allDependents = new Set();

    const collect = (m) => {
      const dependents = this.getDependents(m);

      dependents.forEach(dependent => {
        if (!allDependents.has(dependent)) {
          allDependents.add(dependent);
          collect(dependent);
        }
      });
    };

    collect(migration);

    return Array.from(allDependents);
  }

  /**
   * Check if one migration depends on another
   */
  dependsOn(migration, dependency) {
    const allDeps = this.getAllDependencies(migration);
    return allDeps.includes(dependency);
  }

  /**
   * Clear all dependencies
   */
  clear() {
    this.dependencies.clear();
    this.reverseDependencies.clear();

    logger.debug('All migration dependencies cleared');
  }

  /**
   * Get dependency statistics
   */
  getStatistics() {
    const stats = {
      totalMigrations: this.dependencies.size,
      totalDependencies: 0,
      migrationsWithDependencies: 0,
      migrationsWithDependents: 0,
      maxDependencies: 0,
      maxDependents: 0
    };

    for (const [migration, deps] of this.dependencies.entries()) {
      const depCount = deps.size;

      if (depCount > 0) {
        stats.migrationsWithDependencies++;
        stats.totalDependencies += depCount;
        stats.maxDependencies = Math.max(stats.maxDependencies, depCount);
      }
    }

    for (const [migration, dependents] of this.reverseDependencies.entries()) {
      const depCount = dependents.size;

      if (depCount > 0) {
        stats.migrationsWithDependents++;
        stats.maxDependents = Math.max(stats.maxDependents, depCount);
      }
    }

    return stats;
  }

  /**
   * Export dependencies as JSON
   */
  toJSON() {
    const deps = {};

    for (const [migration, dependencies] of this.dependencies.entries()) {
      deps[migration] = Array.from(dependencies);
    }

    return deps;
  }

  /**
   * Import dependencies from JSON
   */
  fromJSON(json) {
    this.clear();

    for (const [migration, dependencies] of Object.entries(json)) {
      dependencies.forEach(dep => {
        this.addDependency(migration, dep);
      });
    }

    logger.debug('Migration dependencies imported from JSON', {
      count: this.dependencies.size
    });
  }

  /**
   * Print dependency graph
   */
  printGraph() {
    const lines = [];

    lines.push('\n=== Migration Dependency Graph ===\n');

    for (const [migration, deps] of this.dependencies.entries()) {
      if (deps.size > 0) {
        lines.push(`${migration}:`);
        deps.forEach(dep => {
          lines.push(`  └─ ${dep}`);
        });
      } else {
        lines.push(`${migration}: (no dependencies)`);
      }
    }

    lines.push('\n=== End of Graph ===\n');

    return lines.join('\n');
  }
}

module.exports = MigrationDependencies;

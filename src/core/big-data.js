/**
 * Big Data Processor
 * Handle large datasets with batch and stream processing
 */

const { Transform, pipeline } = require('stream');
const { Pool } = require('pg');
const Logger = require('../utils/logger');

class BigDataProcessor {
  constructor(config = {}) {
    this.batchSize = config.batchSize || 1000;
    this.maxConnections = config.maxConnections || 10;
    this.logger = new Logger();
    
    // Database pool for efficient connections
    this.pool = new Pool({
      host: config.dbHost || process.env.DB_HOST || 'localhost',
      port: config.dbPort || process.env.DB_PORT || 5432,
      database: config.dbName || process.env.DB_NAME,
      user: config.dbUser || process.env.DB_USER,
      password: config.dbPassword || process.env.DB_PASSWORD,
      max: this.maxConnections
    });
  }

  /**
   * Batch insert large datasets
   */
  async batchInsert(tableName, records, options = {}) {
    const batchSize = options.batchSize || this.batchSize;
    const batches = this.chunk(records, batchSize);
    
    this.logger.info(`Inserting ${records.length} records in ${batches.length} batches`);
    
    let inserted = 0;
    const errors = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        await this.insertBatch(tableName, batch);
        inserted += batch.length;
        
        if ((i + 1) % 10 === 0) {
          this.logger.info(`Progress: ${inserted}/${records.length} records inserted`);
        }
      } catch (error) {
        this.logger.error(`Batch ${i} failed:`, error);
        errors.push({ batch: i, error: error.message });
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    }
    
    return {
      total: records.length,
      inserted,
      failed: records.length - inserted,
      errors
    };
  }

  /**
   * Insert single batch
   */
  async insertBatch(tableName, records) {
    if (records.length === 0) return;
    
    const columns = Object.keys(records[0]);
    const placeholders = records.map((_, i) => {
      const start = i * columns.length;
      return `(${columns.map((_, j) => `$${start + j + 1}`).join(', ')})`;
    }).join(', ');
    
    const values = records.flatMap(record => columns.map(col => record[col]));
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;
    
    await this.pool.query(query, values);
  }

  /**
   * Stream processing for very large datasets
   */
  createProcessingStream(processor, options = {}) {
    let processedCount = 0;
    const batchSize = options.batchSize || 100;
    let batch = [];
    
    return new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        try {
          batch.push(chunk);
          
          if (batch.length >= batchSize) {
            const results = await processor(batch);
            batch = [];
            
            for (const result of results) {
              this.push(result);
            }
            
            processedCount += results.length;
          }
          
          callback();
        } catch (error) {
          callback(error);
        }
      },
      async flush(callback) {
        try {
          if (batch.length > 0) {
            const results = await processor(batch);
            for (const result of results) {
              this.push(result);
            }
          }
          callback();
        } catch (error) {
          callback(error);
        }
      }
    });
  }

  /**
   * Parallel processing with workers
   */
  async processParallel(data, processor, options = {}) {
    const workerCount = options.workers || 4;
    const chunks = this.chunk(data, Math.ceil(data.length / workerCount));
    
    this.logger.info(`Processing ${data.length} items with ${workerCount} workers`);
    
    const results = await Promise.all(
      chunks.map((chunk, index) => 
        this.processChunk(chunk, processor, index)
      )
    );
    
    return results.flat();
  }

  async processChunk(chunk, processor, chunkIndex) {
    this.logger.debug(`Worker ${chunkIndex}: processing ${chunk.length} items`);
    
    const results = [];
    for (const item of chunk) {
      try {
        const result = await processor(item);
        results.push(result);
      } catch (error) {
        this.logger.error(`Item processing failed:`, error);
        results.push({ error: error.message, item });
      }
    }
    
    return results;
  }

  /**
   * Paginated database query for large result sets
   */
  async *queryPaginated(query, params = [], pageSize = 1000) {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const paginatedQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`;
      const result = await this.pool.query(paginatedQuery, params);
      
      if (result.rows.length === 0) {
        hasMore = false;
      } else {
        yield result.rows;
        offset += pageSize;
      }
    }
  }

  /**
   * Aggregate large datasets
   */
  async aggregate(tableName, aggregations = {}, options = {}) {
    const groupBy = options.groupBy || [];
    const having = options.having || '';
    const orderBy = options.orderBy || '';
    
    // Build aggregation query
    const selectFields = [];
    
    // Add group by fields
    if (groupBy.length > 0) {
      selectFields.push(...groupBy);
    }
    
    // Add aggregations
    for (const [alias, expr] of Object.entries(aggregations)) {
      selectFields.push(`${expr} AS ${alias}`);
    }
    
    let query = `SELECT ${selectFields.join(', ')} FROM ${tableName}`;
    
    if (groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`;
    }
    
    if (having) {
      query += ` HAVING ${having}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Bulk update with optimized queries
   */
  async bulkUpdate(tableName, updates, idColumn = 'id') {
    const batches = this.chunk(updates, this.batchSize);
    let updated = 0;
    
    for (const batch of batches) {
      const caseStatements = {};
      const ids = batch.map(u => u[idColumn]);
      
      // Build CASE statements for each column
      for (const update of batch) {
        for (const [column, value] of Object.entries(update)) {
          if (column === idColumn) continue;
          
          if (!caseStatements[column]) {
            caseStatements[column] = [];
          }
          caseStatements[column].push(`WHEN ${idColumn} = ${update[idColumn]} THEN ${this.escapeValue(value)}`);
        }
      }
      
      // Build UPDATE query
      const setClauses = Object.entries(caseStatements).map(([column, cases]) => {
        return `${column} = CASE ${cases.join(' ')} ELSE ${column} END`;
      });
      
      const query = `
        UPDATE ${tableName}
        SET ${setClauses.join(', ')}
        WHERE ${idColumn} IN (${ids.join(', ')})
      `;
      
      const result = await this.pool.query(query);
      updated += result.rowCount;
    }
    
    return { updated };
  }

  /**
   * Data partitioning for parallel processing
   */
  partition(data, partitionCount) {
    const partitions = Array.from({ length: partitionCount }, () => []);
    
    data.forEach((item, index) => {
      const partition = index % partitionCount;
      partitions[partition].push(item);
    });
    
    return partitions;
  }

  /**
   * Memory-efficient CSV export for large datasets
   */
  async exportToCSV(query, filename, options = {}) {
    const fs = require('fs');
    const writeStream = fs.createWriteStream(filename);
    
    let isFirst = true;
    
    for await (const rows of this.queryPaginated(query, options.params)) {
      if (isFirst && rows.length > 0) {
        // Write header
        writeStream.write(Object.keys(rows[0]).join(',') + '\n');
        isFirst = false;
      }
      
      // Write rows
      for (const row of rows) {
        const line = Object.values(row).map(v => this.escapeCSV(v)).join(',');
        writeStream.write(line + '\n');
      }
    }
    
    writeStream.end();
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ filename }));
      writeStream.on('error', reject);
    });
  }

  /**
   * Data deduplication
   */
  async deduplicate(tableName, uniqueColumns, options = {}) {
    const keepStrategy = options.keep || 'first'; // first or last
    const orderBy = keepStrategy === 'first' ? 'ASC' : 'DESC';
    
    const query = `
      DELETE FROM ${tableName}
      WHERE ctid NOT IN (
        SELECT MIN(ctid)
        FROM ${tableName}
        GROUP BY ${uniqueColumns.join(', ')}
      )
    `;
    
    const result = await this.pool.query(query);
    return { deleted: result.rowCount };
  }

  // Helper methods
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  escapeValue(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return value;
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  escapeCSV(value) {
    if (value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Close database connections
   */
  async close() {
    await this.pool.end();
    this.logger.info('Big data processor closed');
  }
}

module.exports = BigDataProcessor;

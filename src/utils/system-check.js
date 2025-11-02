/**
 * System checks utilities
 */

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function checkService(serviceName) {
  try {
    switch (serviceName) {
      case 'postgresql':
        await execPromise('pg_isready');
        return true;
      case 'redis':
        await execPromise('redis-cli ping');
        return true;
      case 'node':
        await execPromise('node --version');
        return true;
      case 'playwright':
        await execPromise('npx playwright --version');
        return true;
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkService,
};

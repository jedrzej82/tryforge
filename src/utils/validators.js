/**
 * Utility validators
 */

function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name can only contain lowercase letters, numbers, and hyphens';
  }

  if (name.length < 3) {
    return 'Project name must be at least 3 characters';
  }

  return true;
}

module.exports = {
  validateProjectName,
};

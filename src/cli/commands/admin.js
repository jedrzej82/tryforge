const AdminServer = require('../../admin/admin-server');

class AdminCommand {
  static async execute(options = {}) {
    try {
      const port = options.port || 3333;

      console.log('🎛️  Starting TryForge Admin Panel...\n');

      const server = new AdminServer(port);
      await server.start();

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n\n👋 Shutting down admin panel...');
        await server.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n\n👋 Shutting down admin panel...');
        await server.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Failed to start admin panel:', error.message);
      process.exit(1);
    }
  }
}

module.exports = AdminCommand;

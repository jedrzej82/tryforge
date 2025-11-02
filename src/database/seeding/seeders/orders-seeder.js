/**
 * Orders Seeder
 *
 * Seeds the orders table with realistic order data.
 * Depends on UsersSeeder and ProductsSeeder.
 */

const BaseSeeder = require('../base-seeder');
const DataGenerator = require('../generators/data-generator');

class OrdersSeeder extends BaseSeeder {
  constructor() {
    super();
    this.name = 'OrdersSeeder';
    this.dependencies = ['UsersSeeder', 'ProductsSeeder'];
    this.environments = ['development', 'staging'];
    this.priority = 4;
  }

  /**
   * Run the seeder
   * @param {Object} db - Database connection
   */
  async run(db) {
    this.log('Seeding orders...');

    try {
      // Get user IDs
      let userIds = [];
      if (db.query) {
        const result = await db.query("SELECT id FROM users WHERE role != 'admin'");
        userIds = result.rows.map(r => r.id);
      } else if (db.users && db.users.findAll) {
        const users = await db.users.findAll({ where: { role: 'user' } });
        userIds = users.map(u => u.id);
      } else if (db.collection) {
        const users = await db.collection('users').find({ role: 'user' }).toArray();
        userIds = users.map(u => u._id);
      }

      // Get products
      let products = [];
      if (db.query) {
        const result = await db.query('SELECT id, name, price FROM products');
        products = result.rows;
      } else if (db.products && db.products.findAll) {
        products = await db.products.findAll();
      } else if (db.collection) {
        products = await db.collection('products').find({}).toArray();
      }

      this.log(`Found ${userIds.length} users and ${products.length} products`);

      // Generate orders
      const ordersData = DataGenerator.generateOrders(200, userIds, products);

      let inserted = 0;

      for (const order of ordersData) {
        if (db.query) {
          // Insert order
          const orderResult = await db.query(
            `INSERT INTO orders (
              order_number, user_id, status, payment_method, payment_status,
              subtotal, tax, shipping, discount, total, shipping_address,
              billing_address, notes, tracking_number,
              created_at, updated_at, shipped_at, delivered_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING id`,
            [
              order.orderNumber,
              order.userId,
              order.status,
              order.paymentMethod,
              order.paymentStatus,
              order.subtotal,
              order.tax,
              order.shipping,
              order.discount,
              order.total,
              JSON.stringify(order.shippingAddress),
              JSON.stringify(order.billingAddress),
              order.notes,
              order.trackingNumber,
              order.createdAt,
              order.updatedAt,
              order.shippedAt,
              order.deliveredAt
            ]
          );

          const orderId = orderResult.rows[0].id;

          // Insert order items
          for (const item of order.items) {
            await db.query(
              `INSERT INTO order_items (
                order_id, product_id, product_name, quantity, price, total
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [orderId, item.productId, item.productName, item.quantity, item.price, item.total]
            );
          }
        } else if (db.orders && db.orders.create) {
          await db.orders.create(order);
        } else if (db.collection) {
          await db.collection('orders').insertOne(order);
        }

        inserted++;
        this.logProgress(inserted, ordersData.length, 'orders');
      }

      this.log(`Created ${inserted} orders`, 'success');

    } catch (error) {
      this.log(`Error seeding orders: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Rollback the seeder
   * @param {Object} db - Database connection
   */
  async rollback(db) {
    this.log('Rolling back orders...');

    try {
      if (db.query) {
        await db.query('DELETE FROM order_items');
        await db.query('DELETE FROM orders');
      } else if (db.orders && db.orders.deleteMany) {
        await db.orders.deleteMany({});
      } else if (db.collection) {
        await db.collection('order_items').deleteMany({});
        await db.collection('orders').deleteMany({});
      }

      this.log('Orders rolled back', 'success');

    } catch (error) {
      this.log(`Error rolling back orders: ${error.message}`, 'error');
      throw error;
    }
  }
}

module.exports = OrdersSeeder;

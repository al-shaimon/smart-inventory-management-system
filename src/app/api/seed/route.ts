import dbConnect from '@/lib/db';
import User from '@/models/User';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Order from '@/models/Order';
import ActivityLog from '@/models/ActivityLog';
import bcrypt from 'bcryptjs';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Seed not available in production' }, { status: 403 });
  }

  try {
    await dbConnect();

    // Wipe previous seeded data safely
    await User.deleteMany({ email: { $in: ['admin@inventory.com', 'manager@inventory.com', 'demo@inventory.com'] } });
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await ActivityLog.deleteMany({});
    const { default: RestockQueue } = await import('@/models/RestockQueue');
    await RestockQueue.deleteMany({});

    const hashedPassword = await bcrypt.hash('Demo@1234', 10);
    
    // Create Admin User
    const adminUser = await User.create({
      name: 'Demo Admin',
      email: 'admin@inventory.com',
      password: hashedPassword,
      role: 'admin',
    });

    // Create Manager User
    const managerUser = await User.create({
      name: 'Demo Manager',
      email: 'manager@inventory.com',
      password: hashedPassword,
      role: 'manager',
    });

    // Create categories
    const categories = await Category.create([
      { name: 'Electronics', userId: adminUser._id },
      { name: 'Grocery', userId: adminUser._id },
      { name: 'Clothing', userId: adminUser._id },
    ]);

    // Create products
    const products = await Product.create([
      {
        name: 'iPhone 15',
        category: categories[0]._id,
        price: 999,
        stockQuantity: 3,
        minStockThreshold: 5,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'MacBook Pro',
        category: categories[0]._id,
        price: 2499,
        stockQuantity: 8,
        minStockThreshold: 3,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'AirPods Pro',
        category: categories[0]._id,
        price: 249,
        stockQuantity: 0,
        minStockThreshold: 10,
        status: 'Out of Stock',
        userId: adminUser._id,
      },
      {
        name: 'Organic Rice (5kg)',
        category: categories[1]._id,
        price: 12.99,
        stockQuantity: 50,
        minStockThreshold: 20,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'Fresh Milk (1L)',
        category: categories[1]._id,
        price: 3.49,
        stockQuantity: 15,
        minStockThreshold: 25,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'T-Shirt (Cotton)',
        category: categories[2]._id,
        price: 24.99,
        stockQuantity: 45,
        minStockThreshold: 10,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'Jeans (Slim Fit)',
        category: categories[2]._id,
        price: 59.99,
        stockQuantity: 20,
        minStockThreshold: 5,
        status: 'Active',
        userId: adminUser._id,
      },
      {
        name: 'Wireless Mouse',
        category: categories[0]._id,
        price: 29.99,
        stockQuantity: 2,
        minStockThreshold: 10,
        status: 'Active',
        userId: adminUser._id,
      },
    ]);

    // Create sample orders sequentially to avoid orderNumber race condition
    const orderData = [
      {
        customerName: 'John Smith',
        items: [
          { product: products[0]._id, quantity: 1, price: 999 },
          { product: products[5]._id, quantity: 2, price: 24.99 },
        ],
        totalPrice: 1048.98,
        status: 'Delivered',
        userId: adminUser._id,
      },
      {
        customerName: 'Sarah Johnson',
        items: [
          { product: products[1]._id, quantity: 1, price: 2499 },
        ],
        totalPrice: 2499,
        status: 'Shipped',
        userId: adminUser._id,
      },
      {
        customerName: 'Mike Wilson',
        items: [
          { product: products[3]._id, quantity: 3, price: 12.99 },
          { product: products[4]._id, quantity: 5, price: 3.49 },
        ],
        totalPrice: 56.42,
        status: 'Pending',
        userId: adminUser._id,
      },
    ];

    for (const data of orderData) {
      await Order.create(data);
    }

    // Add low stock items to restock queue
    await RestockQueue.create([
      {
        product: products[0]._id,
        currentStock: 3,
        threshold: 5,
        priority: 'High',
        userId: adminUser._id,
      },
      {
        product: products[2]._id,
        currentStock: 0,
        threshold: 10,
        priority: 'High',
        userId: adminUser._id,
      },
      {
        product: products[4]._id,
        currentStock: 15,
        threshold: 25,
        priority: 'Medium',
        userId: adminUser._id,
      },
      {
        product: products[7]._id,
        currentStock: 2,
        threshold: 10,
        priority: 'High',
        userId: adminUser._id,
      },
    ]);

    // Create activity log entries
    await ActivityLog.create([
      { action: 'New user "Demo Admin" signed up', entityType: 'Auth', userId: adminUser._id },
      { action: 'Order #1001 created by user', entityType: 'Order', entityId: 'order1', userId: adminUser._id },
      { action: 'Stock updated for "iPhone 15"', entityType: 'Restock', userId: adminUser._id },
      { action: 'Product "AirPods Pro" added to Restock Queue', entityType: 'Restock', userId: adminUser._id },
      { action: 'Order #1002 marked as Shipped', entityType: 'Order', entityId: 'order2', userId: adminUser._id },
    ]);

    return Response.json({
      message: 'Seed data created successfully',
      data: {
        admin: adminUser.email,
        manager: managerUser.email,
        categories: categories.length,
        products: products.length,
        orders: 3,
      },
    });
  } catch (error: unknown) {
    console.error('Seed error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'Failed to seed data', details: errorMessage }, { status: 500 });
  }
}

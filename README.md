# Smart Inventory & Order Management System

A full-stack web application to manage products, stock levels, customer orders, and fulfillment workflows with real-time validation, conflict handling, and automated low-stock tracking.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB (via Mongoose)
- **Styling**: Tailwind CSS v4
- **State & Data Fetching**: React Server Components & Server Actions
- **Authentication**: JWT (JSON Web Tokens) with `jose` and `bcryptjs`, managed via HTTP-only edge cookies.
- **Form Validation**: Zod
- **Charts**: Recharts

## ✨ Features Implemented

### Core Requirements

1. **Authentication**: Secure email/password login and signup with a pre-filled **Demo Login** button. Edge middleware protects dashboard routes.
2. **Product & Category Setup**: Full CRUD capabilities for Categories and Products. Tracks stock, prices, minimum stock thresholds, and Active/Out-of-Stock statuses.
3. **Order Management**: Create new orders, manage quantities, calculate totals automatically, and track statuses (Pending, Confirmed, Shipped, Delivered, Cancelled).
4. **Stock Handling**: Automatically deducts stock upon order creation, prevents submission if stock is insufficient, and sets products to "Out of Stock" when inventory hits 0.
5. **Restock Queue**: Automatically adds items dropping below their threshold to a priority-sorted (High/Medium/Low) queue, supporting manual restock fulfillment.
6. **Conflict Detection**: Prevents adding duplicate products to a single order and blocks the ordering of inactive/unavailable products.
7. **Dashboard Analytics**: Overview cards showing Total Orders Today, Pending Orders, Low Stock Items, Revenue Today, and a Product Status Summary table.
8. **Activity Log**: Centralized timeline tracking all major system actions (Order placements, Stock updates, Authentication events, etc.).

### Bonus Features

- **Search & Filter**: Real-time searching and status/category filtering on the Products and Orders pages.
- **Pagination**: Navigate cleanly through large datasets of Products and Orders.
- **Analytics Chart**: Visual Recharts bar-chart representing orders placed over the last 7 days.
- **Modern UI/UX**: Fully responsive, dark-mode focused interface with glassmorphism UI elements and smooth micro-interactions.

---

## 🛠️ Local Setup Instructions

Follow these steps to run the application locally.

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A running local instance of [MongoDB](https://www.mongodb.com/try/download/community) (or a MongoDB Atlas URI)

### 2. Installation

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/al-shaimon/smart-inventory-management-system.git
cd smart-inventory-management-system
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following keys. Generate a truly random secure string for your session secret.

```env
MONGODB_URI=mongodb://localhost:27017/smart-inventory
SESSION_SECRET=your_super_secret_32_character_jwt_string_here
```

### 4. Database Seeding

To quickly populate the database with categories, products, orders, and a demo user account:

1. Start the development server first: `npm run dev`
2. Open your browser and navigate to the seed route:
   **[http://localhost:3000/api/seed](http://localhost:3000/api/seed)**
3. Wait for the `Seed data created successfully` JSON response.

### 5. Running the Application

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 6. Test Credentials

If you ran the seed script, you can immediately log in using the demo account or click the "Fill Demo Credentials" button on the login page.

- **Email**: `demo@inventory.com`
- **Password**: `Demo@1234`

## 📁 Project Structure

- `src/app/`: Next.js App Router containing all pages, loading states, and API endpoints.
- `src/components/`: Reusable React components (Sidebar, DashboardShell, Toast notifications).
- `src/lib/`: Core utilities including Database connection singleton, JWT Session logic, Zod validation schemas, and Activity Logging.
- `src/models/`: Mongoose schemas for User, Product, Category, Order, RestockQueue, and ActivityLog.

## 🚢 Deployment

The application is built to be easily deployed on **Vercel**.

1. Push your code to a GitHub repository.
2. Link the repository to Vercel.
3. Add your `MONGODB_URI` (using MongoDB Atlas for production) and `SESSION_SECRET` to the Vercel Environment Variables.
4. Deploy.

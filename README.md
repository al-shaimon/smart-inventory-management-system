# Smart Inventory & Order Management System

A professional, multi-tenant inventory and order management platform built with human-centric design, strict type safety, and robust data isolation. This system empowers Store Admins to manage products, categories, and orders while collaborating with a distributed team of Managers.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Middleware)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Styling**: [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) (Modern Custom Properties, Glassmorphism)
- **State & Logic**: Strict [TypeScript](https://www.typescriptlang.org/) (Zero `any` implementation)
- **Authentication**: JWT-based session management with `jose` and `bcryptjs`
- **Validation**: [Zod](https://zod.dev/) for high-integrity schema validation
- **Visualization**: [Recharts](https://recharts.org/) for predictive analytics

---

## ✨ Features Implemented

### 🏢 Store Multitenancy & RBAC
- **Strict Data Isolation**: Every piece of data (Products, Orders, Categories, Logs) is scoped to a unique `adminId` (Store ID).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin` and `manager` roles.
- **Team Management**: Admins can invite Managers via email. The system automatically binds new Manager signups to the inviter's store.

### 📦 Product & Inventory Lifecycle
- **Dynamic Catalog**: Full CRUD for Products and Categories with real-time stock tracking.
- **Stock Automation**: Intelligent status transitions (Active/Out-of-Stock) and automatic inventory deductions.
- **Restock Intelligence**: A priority-sorted queue (High/Medium/Low) for products hitting critical stock thresholds.

### 🛒 Order Fulfillment Workflow
- **Sophisticated Checkout**: Conflict detection prevents duplicate product additions and blocks unavailable items.
- **Status Tracking**: Full lifecycle management: `Pending` → `Confirmed` → `Shipped` → `Delivered` (with `Cancelled` restoration).
- **Automatic Restoration**: Cancelling an order automatically restores stock levels and updates the restock queue.

### 📊 Real-time Monitoring
- **Store Analytics**: Instant metrics for Orders Today, Pending Orders, Low Stock Items, and Daily Revenue.
- **7-Day Trend Analytics**: Visual representation of order volume and revenue growth.
- **Audit Trails**: Detailed `Activity Log` tracking every administrative and operational action.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **NPM**: Package manager

### 2. Installation
```bash
git clone https://github.com/al-shaimon/smart-inventory-management-system.git
cd smart-inventory-management-system
npm install
```

### 3. Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/smart-inventory
SESSION_SECRET=a_secure_random_32_character_string
```

### 4. Database Seeding & Demo
1. Start the dev server: `npm run dev`
2. **Initialize Store Data**: Visit [http://localhost:3000/api/seed](http://localhost:3000/api/seed)
3. **Admin Demo**: `admin@inventory.com` / `Demo@1234` (Full access, Team management)
4. **Manager Demo**: `manager@inventory.com` / `Demo@1234` (Shared store data, Restricted access)

---

## 📁 Project Architecture

- **`src/app/`**: Next.js App Router (API, Server Actions, Protected Layouts).
- **`src/models/`**: High-integrity Mongoose schemas with Store scoping.
- **`src/lib/`**: Core utilities (Strict definitions, Session handling, Activity logging).
- **`src/components/`**: Modular, premium UI components (Glassmorphic cards, Dynamic sidebars).

## 🛡️ Integrity & Safety
The project implements **Strict Type Safety** across all API boundaries:
- **Lean Population**: Optimized database queries with populated nested objects.
- **Zero `any`**: 100% TypeScript coverage in API routes to prevent production failures.
- **Middleware Guard**: Edge-level protection ensuring no unauthorized access to store data.

---

## 🚢 Deployment
Compatible with **Vercel** and direct **Node.js** environments.
1. Configure `MONGODB_URI` and `SESSION_SECRET` in environment variables.
2. Run `npm run build`.
3. Run `npm run start`.


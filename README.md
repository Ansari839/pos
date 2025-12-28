# ✨ Antigravity POS & Inventory Management System

A premium, end-to-end solution for modern businesses, built with high-performance technologies and a pixel-perfect aesthetic.

---

## 🌟 Project Highlights

- **Dynamic Terminal:** A lightning-fast Point of Sale interface with barcode scanning and multi-method payments.
- **Intelligent Inventory:** Real-time stock tracking with FIFO batch deduction and manual adjustment controls.
- **Automated Accounting:** Seamless double-entry bookkeeping integrated directly with sales and returns.
- **Premium UI/UX:** Dark/Light mode support with 25+ dynamic color palettes and smooth micro-animations.
- **Enterprise Security:** Role-Based Access Control (RBAC) and Security Key authorization for sensitive operations.
- **Insightful Analytics:** Beautifully rendered charts for sales trends, top items, and financial health.

---

## 🛠 Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **State Management:** React Context API & TanStack Query
- **Styling:** Vanilla CSS & TailwindCSS (Modern Tokens)
- **Icons:** Lucide React
- **Calculations:** Decimal.js (High-precision financial logic)

---

## 📖 Quick Links

- 📘 **[End-to-End User Manual](USER_MANUAL.md)** - Detailed guide for all operations.
- ⚙️ **[Installation Guide](#setup--installation)** - How to get started locally.

---

## 🚀 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd pos
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file and set your `DATABASE_URL` and `AUTH_SECRET`.

4. **Database Setup:**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🖼️ User Interface Preview

### Dashboard Overview
*Real-time analytics and business health indicators.*

### Global Terminal
*High-speed checkout with professional payment processing.*

### Inventory Management
*Crystal-clear stock visibility across multiple warehouses.*

---

© 2025 Antigravity Systems. All rights reserved.

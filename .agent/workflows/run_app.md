---
description: How to setup, seed, and run the POS application locally
---

# Development Setup & Login Guide

Follow these steps to get the application running with the pre-configured test environment.

## 1. Install Dependencies
Ensure all project dependencies are installed.
```bash
npm install
```

## 2. Initialize Database & Seed Data
This step applies database migrations and populates the database with:
- **Foundational Data**: Industries, Roles, Features.
- **Test Business**: "Test Coffee Shop" (Restaurant template).
- **Admin User**: Pre-configured admin account.
- **Sample Catalog**: Products, pricing, and tax settings.

```bash
// turbo
npx prisma db seed
```

## 3. Run Development Server
Start the local development server.
```bash
// turbo
npm run dev
```

## 4. Login Access
1. Open your browser to [http://localhost:3000](http://localhost:3000).
2. Click on **"Have an account? Login"** on the landing page.
3. Use the following seeded credentials:

| Field | Value |
|-------|-------|
| **Email** | `admin@poscore.com` |
| **Password** | `admin123` |

> **Note:** The "Deploy POS" option creates a *new* separate business. To access the seeded "Test Coffee Shop" data, you **must** use the Login option.

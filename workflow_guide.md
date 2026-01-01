# 🚀 POS System - Workflow Guide

Welcome to the official Workflow Guide for the POS/ERP system. This document provides a technical and operational overview of how the system functions.

---

## 🏗️ 1. System Architecture

The application is built using a modern full-stack TypeScript architecture:
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [React Query](https://tanstack.com/query/latest) (for server state) + `useState`/`useEffect` (for local state)

### Data Model Overview
The core of the system is the `Business` model, which acts as a tenant. Almost all other models (`User`, `Item`, `Sale`, `Account`) are linked to a `BusinessId`.

---

## 📅 2. Daily Operational Workflow

### Phase 1: Opening the Day
Before any sales can be recorded, the business day must be opened.
1.  **Authorization**: Click "OPEN THE DAY" on the dashboard.
2.  **Security Key**: Requires a valid `OperationKey` assigned to the user for the `DAY_OPEN` operation.
3.  **System Action**: Creates a `DayControl` record marked as `OPEN`.

### Phase 2: Inventory & Catalog Management
1.  **Add Items**: Navigate to **Master Data** -> **Add Item**.
2.  **Adjust Stock**: Use the **Inventory** tab to perform "Stock IN" (deliveries) or "Stock OUT" (wastage). Adjustments require approval keys for high-value items.
3.  **Supplier Purchases**: Use the **Purchases** module to record bulk arrivals. This automatically updates `Stock` and creates `JournalEntry` records.

### Phase 3: Terminal Operations (Sales)
1.  **The Cart**: Select items in the **Terminal** tab.
2.  **Checkout**: Process payments (Cash, Card, Web).
3.  **Post-Sale**: 
    - A `Sale` record is created.
    - `Stock` levels are decremented via `StockMovement`.
    - `JournalEntry` is generated for the sale (Debit Cash/Bank, Credit Revenue).

### Phase 4: Closing the Day
1.  **Finalize**: Use the "Close Day" button.
2.  **Reporting**: Review the daily summary. The system locks terminal operations until the next day is opened.

---

## 📊 3. Advanced Workflows

### Accounting & Journal Entries
Every financial transaction (Sale, Refund, Purchase) triggers the `AccountingService`.
- **Chart of Accounts**: Managed via the `Account` model.
- **Double Entry**: Each `JournalEntry` has multiple `JournalLine` records where `Sum(Debit) == Sum(Credit)`.

### User & Permissions
- **RBAC**: Roles (Admin, Manager, Cashier) are linked to `Permission` models.
- **Warehouses**: Users can be restricted to specific `Warehouse` instances via `UserWarehouse`.

---

## 🛠️ 4. Developer Workflows

### Adding a New Module
1.  **Schema**: Update `prisma/schema.prisma`.
2.  **Migration**: Run `npx prisma migrate dev`.
3.  **API**: Create a route in `src/app/api/[module]/route.ts`.
4.  **UI**: Update `src/app/page.tsx` or create a new page component in `src/app`.
5.  **Menu**: Add the new route to the `getMenuItems` function in `src/contexts/ui-context.tsx`.

### Running with Seeded Data
To start with a fully populated environment:
1.  Run `npx prisma db seed`.
2.  Login with `admin@poscore.com` / `admin123`.

---

## 🆘 Troubleshooting
- **Database Connection**: Check `.env` for `DATABASE_URL`.
- **Missing Features**: Ensure the `BusinessFeature` records are enabled for your business.
- **Auth Issues**: Verify that `AUTH_SECRET` is set in the environment.

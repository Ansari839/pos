# POSCORE: Enterprise SaaS Platform Guide

Welcome to the future of retail and service management. POSCORE is a multi-tenant, industry-aware ERP and Point of Sale system designed for rapid scaling and ease of operation.

## 🚀 Getting Started

### 1. New Business Onboarding
To onboard a new tenant (business):
1. **Industry Selection**: Choose the industry template (Restaurant, Retail, Pharmacy, etc.). This automatically configures:
    - Default icon sets (Kitchen, Cart, etc.).
    - Default business rules (tax inclusive/exclusive, discount limits).
    - Default feature set (e.g. Pharmacy gets Batch/Expiry tracking by default).
2. **Admin Setup**: Create the root administrator for the store.
3. **Warehouse Configuration**: Deploy the default warehouse to begin inventory tracking.

### 2. Custom Theming
Businesses can instantly align the POS with their brand:
- Navigate to **System Settings**.
- Select one of the **12 curated color palettes**.
- Toggle between **Light and Dark modes** to suit the lighting of the physical store.

## ⚙️ SaaS Configuration

### Multi-Tenancy
Data isolation is enforced at the database level using a strict `businessId` filtering strategy. Every transaction, item, and audit log is tied to a specific business identity.

### Feature Management
The platform uses dynamic feature flags. Administrators can enable/disable modules per business:
- **Inventory Engine**: Tracking, Movements, Adjustments.
- **POS Basic**: Billing, Station management.
- **Advanced Returns**: Refund logic and credit management.
- **Accounting**: Automated General Ledger and P&L.

## 🛡️ Operational Security

### Business Day Lifecycle
To maintain financial integrity, the system enforces a **Day Open/Close** workflow:
- The day must be **Opened** before any sales are processed.
- The day should be **Closed** at the end of shifts to reconcile journals and lock terminals.

### Approval Keys
Critical operations require multi-user approvals via **One-Time Keys**:
- Large refunds.
- Manual stock adjustments.
- Day status changes.

## 📊 Monitoring & Health
POSCORE includes a built-in health API:
`GET /api/health`
This endpoint monitors database connectivity and system uptime for your production environment.

## 🛠️ Deployment Workflow
The platform is production-ready via CI/CD:
- **Automatic Testing**: Every push runs lints, builds, and verification scripts.
- **Database Safety**: Prisma migrations are managed and tracked.

---
*POSCORE — The Intelligent Pulse for Your Business.*

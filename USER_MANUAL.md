# 📋 POS System - End-to-End User Manual

Welcome to the comprehensive guide for our Point of Sale (POS) and Inventory Management System. This manual covers every operation from initial login to final reporting.

---

## 🚀 1. Getting Started: Login
The system is protected by a secure login gate.
1.  Navigate to the home URL (`http://localhost:3000`).
2.  Enter your **Email** and **Password**.
3.  Click **Login**.
    - *Default Admin:* `admin@example.com` / `admin123`
    - *Note:* If you are a new business, you will be directed to the **Onboarding** page first to set up your business identity and accounts.

---

## 🏦 2. Business Day Control
Before performing any sales or inventory operations, you must manage the **Business Day**.
1.  **Opening the Day:** Click the "OPEN THE DAY" button in the center of the dashboard. This requires authorization (Security Key).
2.  **Closing the Day:** At the end of your shift, use the "Close Day" option to lock terminal operations and finalize the day-end reporting.

---

## 📦 3. Master Data: Creating Products
Add your items to the system before selling.
1.  Navigate to the **Master Data** tab.
2.  Click the **Add Item** button.
3.  In the modal:
    - **Item Name:** e.g., "Vanilla Latte"
    - **Item Type:** Select **PRODUCT** (tracked inventory) or **SERVICE** (no stock).
    - **Base Price:** Set the selling price.
4.  Click **Save Item**.

---

## 📊 4. Inventory: Adjusting Stock
Ensure your stock levels are accurate.
1.  Navigate to the **Inventory** or **Warehouses** tab.
2.  Locate your item in the list.
3.  Click the **Adjust** button.
4.  In the modal:
    - **Quantity:** Enter the amount.
    - **Adjustment Type:** 
        - **Stock IN:** For arrivals/purchases.
        - **Stock OUT:** For breakage/wastage.
    - **Reason:** Provide a brief note (e.g., "New Shipment").
5.  Click **Submit**.

---

## 🛒 5. Terminal: Sales & Payments
The heartbeat of the business—making a sale.
1.  Navigate to the **Terminal** tab.
2.  **Search/Scan:** Use the search bar or scan a barcode to find items.
3.  **Cart Management:** Click an item to add it to the cart. Use `+` or `-` to adjust quantities.
4.  **Checkout:** Click the large **CHECKOUT** button.
5.  **Payment Method:** Select **Cash**, **Card**, or **Digital Wallet**.
6.  **Success:** Once processed, a success message with an Invoice Number will appear.

---

## 💰 6. Accounting & Journal Entries
Every sale automatically generates accounting entries.
1.  Navigate to the **Accounting** tab.
2.  Review the **Journal Entries** to see the double-entry bookkeeping (Debits and Credits) for every transaction.
3.  View the **Chart of Accounts** to see the current balances of Sales, Cash, and Tax Payable.

---

## 👥 7. Team & Security
Manage who can access the system.
1.  Navigate to the **Team** tab.
2.  **Add Member:** Create new users with specific roles (Admin/Cashier).
3.  **Security Keys:** Generate and assign keys for critical operations like opening/closing the day or approving adjustments.

---

## 📈 8. Reporting & Analytics
Monitor your business health.
1.  Go to the **Overview** (Dashboard).
2.  View **Sales Trends**, **Best Selling Items**, and **Financial Distribution** charts.
3.  See real-time stats for Total Revenue, Active Orders, and Today's Growth.

---

## ⚙️ 9. System Settings
Customize the experience.
1.  Navigate to the **Settings** tab.
2.  **Theme:** Switch between Light/Dark mode and choose from 25+ curated color palettes.
3.  **Business Industry:** Update your business category to match your operational needs.

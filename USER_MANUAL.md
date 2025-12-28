# POS Core - User Manual & Workflow Guide

## 1. Getting Started

### Accessing the Application
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Login**: Click **"Have an account? Login"** on the landing page.
- **Credentials**:
  - **Email**: `admin@poscore.com`
  - **Password**: `admin123`

---

## 2. Managing Business Days (System Controls)
**Security Note**: Opening and Closing business days requires secure authorization keys. In this demo environment, you must generate a key first using the API, as the UI for key generation is typically restricted to HQ.

### How to Open/Close a Day
1. **Check Status**: Look at the "Day Status" indicator in the sidebar.
2. **Click the Lightning Icon**: This opens the Day Control Modal.
3. **Enter Key**: You need a valid 8-character key.

### 🛠️ Generating a Key (For Testing)
Since there is no UI button to generate a key in this version, run this command in your terminal to create one:

```bash
# Generate a DAY_OPEN key
curl -X POST http://localhost:3000/api/system/keys \
  -H "Content-Type: application/json" \
  -d '{"businessId": "YOUR_BUSINESS_ID", "userId": "YOUR_USER_ID", "operation": "DAY_OPEN"}'
```

*Tip: You can find your Business ID and User ID in the URL or console logs during development, or simply check the database.*

---

## 3. Inventory Management

### Adding a New Product
1. Navigate to the **Inventory** tab.
2. Click **"+ New Item"** (Top Right).
3. **Pop-ups will appear** (Browser Alerts):
   - **Name**: Enter product name (e.g., "Croissant").
   - **Type**: OK for Service, Cancel for Product.
   - **Price**: Enter base price (e.g., "5.00").
4. The item will appear in the list instantly.

### Adjusting Stock
1. Go to **Inventory** or **Warehouses**.
2. Click **"Quick Adjust"** on an item row OR **"Adjust"** button in the header.
3. Select the Item, Quantity (positive for IN, negative for OUT), and Reason.
4. Click **Apply Adjustment**.

---

## 4. Point of Sale (POS) Workflow

### Processing a Sale
1. Navigate to the **Terminal** tab.
2. **Add Items**: Click items from the grid or use the Search bar to find them.
3. **Cart**: Items appear in the right-side cart. Adjust quantities with `+` / `-`.
4. **Checkout**: Click **CHECKOUT** at the bottom.
5. **Payment**: Select a payment method (Cash, Card, etc.).
6. **Success**: A confirmation message will appear with the Invoice Number.

---

## 5. Returns & Refunds
1. Navigate to the **Returns** tab.
2. **Search**: Enter the Invoice Number (found on the receipt or Dashboard).
   - *Tip: If you don't know one, check the "Recent Sales" on the Dashboard.*
3. **Select Items**: Choose which items are being returned.
4. **Process Refund**: Click **Process Refund**. The system will verify tax calculations and update stock automatically.

---

## 6. Dashboard & Reporting
- **Overview**: Real-time sales, profit, and stock value.
- **Charts**: Sales trends and top-performing items.
- **Financials**: Net profit margins and average ticket size.

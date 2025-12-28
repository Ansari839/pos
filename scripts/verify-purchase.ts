
import { prisma } from "../src/lib/prisma";
import { PurchaseService } from "../src/services/purchase-service";
import { Decimal } from "decimal.js";

async function verify() {
    console.log("🚀 Starting Purchase Module Verification...");

    // 1. Get a business
    const business = await prisma.business.findFirst({ include: { warehouses: true } });
    if (!business) {
        console.error("❌ No business found. Please run seed first.");
        return;
    }
    const warehouse = business.warehouses[0];
    if (!warehouse) {
        console.error("❌ No warehouse found.");
        return;
    }

    // 2. Ensure essential accounts exist
    const essentialAccounts = [
        { name: 'Sales', type: 'INCOME' },
        { name: 'Tax Payable', type: 'LIABILITY' },
        { name: 'Cash', type: 'ASSET' },
        { name: 'Bank', type: 'ASSET' },
        { name: 'Accounts Receivable', type: 'ASSET' },
        { name: 'Accounts Payable', type: 'LIABILITY' },
        { name: 'Cost of Goods Sold', type: 'EXPENSE' },
        { name: 'Inventory', type: 'ASSET' },
    ];

    for (const acc of essentialAccounts) {
        const exists = await prisma.account.findFirst({
            where: { businessId: business.id, name: acc.name }
        });
        if (!exists) {
            console.log(`📝 Creating missing account: ${acc.name}`);
            await prisma.account.create({
                data: {
                    businessId: business.id,
                    name: acc.name,
                    type: acc.type as any
                }
            });
        }
    }

    // 3. Ensure we have a supplier
    let supplier = await prisma.party.findFirst({ where: { businessId: business.id, type: "SUPPLIER" } });
    if (!supplier) {
        console.log("📝 Creating sample supplier...");
        supplier = await prisma.party.create({
            data: {
                businessId: business.id,
                name: "Global Supplies Inc.",
                type: "SUPPLIER",
                email: "info@globalsupplies.com"
            }
        });
    }
    console.log(`✅ Using Supplier: ${supplier.name}`);

    // 3. Ensure we have a product
    const product = await prisma.item.findFirst({ where: { businessId: business.id, type: "PRODUCT" } });
    if (!product) {
        console.error("❌ No product found.");
        return;
    }
    console.log(`✅ Using Product: ${product.name}`);

    // 4. Create a purchase
    console.log("📦 Recording a new purchase...");
    const purchaseInput = {
        businessId: business.id,
        userId: (await prisma.user.findFirst({ where: { businessId: business.id } }))?.id || "unknown",
        warehouseId: warehouse.id,
        supplierId: supplier.id,
        invoiceNo: "INV-TEST-001",
        items: [
            {
                itemId: product.id,
                quantity: 50,
                unitPrice: 10,
                unitId: product.unitId || "default",
                batchNo: "BATCH-TEST-A1",
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            }
        ],
        payments: [
            {
                method: "CASH",
                amount: 500
            }
        ]
    };

    const purchase = await PurchaseService.createPurchase(purchaseInput);
    console.log(`✅ Purchase created: ${purchase.referenceNo}`);

    // 5. Verify Stock
    const stock = await prisma.stock.findFirst({
        where: { itemId: product.id, warehouseId: warehouse.id }
    });
    console.log(`📊 Current Stock for ${product.name}: ${stock?.quantityBaseUnit}`);

    // 6. Verify Accounting
    const journal = await prisma.journalEntry.findFirst({
        where: { referenceId: purchase.id, referenceType: "PURCHASE" },
        include: { lines: true }
    });
    if (journal) {
        console.log(`📒 Journal Entry found: ${journal.description}`);
        journal.lines.forEach(l => {
            console.log(`   - Account ID: ${l.accountId}, Debit: ${l.debit}, Credit: ${l.credit}`);
        });
    } else {
        console.error("❌ Journal entry NOT found for purchase.");
    }

    console.log("✨ Verification Complete!");
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

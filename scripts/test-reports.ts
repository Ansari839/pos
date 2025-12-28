import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { ReportService } from '../src/services/report-service';
import dayjs from 'dayjs';

async function main() {
    console.log('--- Phase 9: Reports & Dashboard Verification ---');

    const business = await prisma.business.findFirst();
    if (!business) {
        console.error('No business found.');
        return;
    }

    const startDate = dayjs().startOf('month').toDate();
    const endDate = dayjs().endOf('day').toDate();

    console.log(`Verifying reports for Business: ${business.name} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`);

    // 1. Sales Summary
    console.log('\n1. Sales Summary:');
    const sales = await ReportService.getSalesSummary(business.id, startDate, endDate);
    console.log(`   Total Sales: $${sales.totalSales}`);
    console.log(`   Transactions: ${sales.transactionCount}`);
    console.log(`   Avg Ticket: $${sales.averageTicket}`);
    console.log(`   Chart Data Points: ${sales.chartData.length}`);

    // 2. Inventory Valuation
    console.log('\n2. Inventory Valuation:');
    const inventory = await ReportService.getInventoryValuation(business.id);
    console.log(`   Total Value: $${inventory.totalValue}`);
    console.log(`   Item Count: ${inventory.itemCount}`);
    console.log(`   Low Stock Items: ${inventory.lowStockCount}`);

    // 3. Top Selling Items
    console.log('\n3. Top Selling Items:');
    const topItems = await ReportService.getTopSellingItems(business.id);
    topItems.forEach((i, idx) => console.log(`   #${idx + 1} ${i.name.padEnd(20)} | Qty: ${i.quantity} | Rev: $${i.revenue}`));

    // 4. Financial Pulse
    console.log('\n4. Financial Pulse:');
    const finance = await ReportService.getFinancialPulse(business.id);
    console.log(`   Revenue: $${finance.revenue}`);
    console.log(`   Expenses: $${finance.expenses}`);
    console.log(`   Net Profit: $${finance.netProfit}`);

    console.log('\n--- Verification Complete ---');
}

main().catch(console.error);

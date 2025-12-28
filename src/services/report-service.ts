import { prisma } from '../lib/prisma';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';

export class ReportService {
    /**
     * Gets sales summary for a given period.
     */
    static async getSalesSummary(businessId: string, startDate: Date, endDate: Date) {
        const sales = await prisma.sale.findMany({
            where: {
                businessId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            },
            include: { items: true }
        });

        const totalSales = sales.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(s.total as any)), new Decimal(0));
        const totalItems = sales.reduce((acc: number, s: any) => acc + s.items.length, 0);
        const avgTicket = sales.length > 0 ? totalSales.div(sales.length) : new Decimal(0);

        // Daily aggregation for charts
        const dailyData: Record<string, Decimal> = {};
        sales.forEach((s: any) => {
            const date = dayjs(s.createdAt).format('YYYY-MM-DD');
            dailyData[date] = (dailyData[date] || new Decimal(0)).plus(new Decimal(s.total as any));
        });

        const chartData = Object.entries(dailyData).map(([date, total]) => ({
            date,
            total: total.toNumber()
        })).sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalSales: totalSales.toNumber(),
            transactionCount: sales.length,
            itemCount: totalItems,
            averageTicket: avgTicket.toNumber(),
            chartData
        };
    }

    /**
     * Gets inventory valuation and health.
     */
    static async getInventoryValuation(businessId: string) {
        const stocks = await prisma.stock.findMany({
            where: { businessId },
            include: { item: true }
        });

        const totalValue = stocks.reduce((acc: Decimal, s: any) => {
            const cost = new Decimal(s.item.costPrice || 0);
            const qty = new Decimal(s.quantityBaseUnit || 0);
            return acc.plus(cost.mul(qty));
        }, new Decimal(0));

        const lowStockItems = stocks.filter((s: any) => new Decimal(s.quantityBaseUnit as any).lt(10)); // Fixed threshold for now

        return {
            totalValue: totalValue.toNumber(),
            itemCount: stocks.length,
            lowStockCount: lowStockItems.length,
            lowStockItems: lowStockItems.map((s: any) => ({
                id: s.item.id,
                name: s.item.name,
                currentStock: s.quantityBaseUnit
            }))
        };
    }

    /**
     * Gets top selling items by volume.
     */
    static async getTopSellingItems(businessId: string, limit = 5) {
        const items = await prisma.saleItem.groupBy({
            by: ['itemId'],
            where: { sale: { businessId, status: 'COMPLETED' } },
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit
        });

        const itemDetails = await prisma.item.findMany({
            where: { id: { in: items.map(i => i.itemId) } }
        });

        return items.map((i: any) => {
            const detail = itemDetails.find((d: any) => d.id === i.itemId);
            return {
                name: detail?.name || 'Unknown',
                quantity: i._sum.quantity,
                revenue: i._sum.total
            };
        });
    }

    /**
     * Gets a quick P&L snapshot for the dashboard.
     */
    static async getFinancialPulse(businessId: string) {
        // Fetch Income (Sales) vs Expenses (COGS + others)
        // For now, based on JournalEntries
        const journals = await prisma.journalEntry.findMany({
            where: { businessId },
            include: { lines: { include: { account: true } } }
        });

        let revenue = new Decimal(0);
        let expenses = new Decimal(0);

        journals.forEach((j: any) => {
            j.lines.forEach((l: any) => {
                if (l.account.type === 'INCOME') {
                    // Credit increases income
                    revenue = revenue.plus(new Decimal(l.credit as any)).minus(new Decimal(l.debit as any));
                }
                if (l.account.type === 'EXPENSE') {
                    // Debit increases expense
                    expenses = expenses.plus(new Decimal(l.debit as any)).minus(new Decimal(l.credit as any));
                }
            });
        });

        return {
            revenue: revenue.toNumber(),
            expenses: expenses.toNumber(),
            netProfit: revenue.minus(expenses).toNumber()
        };
    }
}

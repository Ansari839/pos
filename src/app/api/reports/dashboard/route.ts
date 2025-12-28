import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report-service';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
        return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    try {
        const startDate = dayjs().startOf('month').toDate();
        const endDate = dayjs().endOf('day').toDate();

        const [sales, inventory, financial, topItems] = await Promise.all([
            ReportService.getSalesSummary(businessId, startDate, endDate),
            ReportService.getInventoryValuation(businessId),
            ReportService.getFinancialPulse(businessId),
            ReportService.getTopSellingItems(businessId)
        ]);

        return NextResponse.json({
            sales,
            inventory,
            financial,
            topItems
        });
    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

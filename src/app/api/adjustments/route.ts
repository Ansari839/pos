import { NextResponse } from 'next/server';
import { AdjustmentService } from '@/services/adjustment-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const adjustment = await AdjustmentService.adjustStock(body);
        return NextResponse.json(adjustment);
    } catch (error: any) {
        console.error('ADJUSTMENT_ERROR', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

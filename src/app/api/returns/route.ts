import { NextResponse } from 'next/server';
import { ReturnService } from '@/services/return-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const saleReturn = await ReturnService.processReturn(body);
        return NextResponse.json(saleReturn);
    } catch (error: any) {
        console.error('RETURN_ERROR', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

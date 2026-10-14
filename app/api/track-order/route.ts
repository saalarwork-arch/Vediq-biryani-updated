import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Tracking code is required' },
        { status: 400 }
      );
    }

    // Attempt matching order_number (case-insensitive or exact)
    let query = supabaseServer
      .from('orders')
      .select('*')
      .ilike('order_number', code)
      .maybeSingle();

    const { data: orderData, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!orderData) {
      // Also try matching by ID if code looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
      if (isUuid) {
        const { data: idMatch } = await supabaseServer
          .from('orders')
          .select('*')
          .eq('id', code)
          .maybeSingle();

        if (idMatch) {
          return NextResponse.json({ success: true, order: idMatch });
        }
      }

      return NextResponse.json(
        { success: false, error: `No order found matching "${code}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: orderData });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

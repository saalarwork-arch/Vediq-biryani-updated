import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  validateDeliveryAddress,
  DELHI_NCR_UNSUPPORTED_MESSAGE,
} from '@/lib/delhiNcrValidation';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      const { data, error } = await supabaseServer
        .from('orders')
        .select('*')
        .eq('order_number', orderId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ order: data });
    }

    const { data, error } = await supabaseServer
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ orders: [] });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (_err: any) {
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Strict Server-Side Delivery Area Validation for Delhi NCR
    const validation = await validateDeliveryAddress({
      address: body.full_address || '',
      lat: body.latitude,
      lng: body.longitude,
      pincode: body.pincode,
      city: body.city,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: DELHI_NCR_UNSUPPORTED_MESSAGE },
        { status: 400 }
      );
    }

    // Enforce COD payment method and save Delhi NCR metadata
    const orderPayload = {
      ...body,
      is_delhi_ncr: true,
      payment_method: 'Cash on Delivery (COD)',
    };

    try {
      const { data, error } = await supabaseServer
        .from('orders')
        .insert([orderPayload])
        .select('*');

      if (!error && data?.[0]) {
        return NextResponse.json({ order: data[0] }, { status: 201 });
      } else if (error) {
        console.warn('[Vediq] Supabase insert warning:', error.message);
      }
    } catch (dbErr) {
      console.warn('[Vediq] Supabase server error:', dbErr);
    }

    // Return the validated Delhi NCR order payload
    return NextResponse.json({ order: orderPayload }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}


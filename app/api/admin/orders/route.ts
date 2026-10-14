import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    if (action === 'trash') {
      // Soft-delete: Move to Trash (recoverable)
      const { data, error } = await supabaseServer
        .from('orders')
        .update({
          is_trashed: true,
          trashed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', orderId)
        .select('*')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, order: data, action: 'trash' });
    } else if (action === 'restore') {
      // Restore from Trash
      const { data, error } = await supabaseServer
        .from('orders')
        .update({
          is_trashed: false,
          trashed_at: null,
          updated_at: nowIso,
        })
        .eq('id', orderId)
        .select('*')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, order: data, action: 'restore' });
    }

    return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update order trash state' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required for deletion' }, { status: 400 });
    }

    // 1. Delete associated order_items (if any exist in relational table)
    try {
      await supabaseServer
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
    } catch {
      // ignore if table does not exist or has cascade
    }

    // 2. Permanently delete the order record itself
    // Customer records, products, and site settings are strictly preserved
    const { error } = await supabaseServer
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} permanently deleted safely.`,
      deletedId: orderId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to permanently delete order' },
      { status: 500 }
    );
  }
}

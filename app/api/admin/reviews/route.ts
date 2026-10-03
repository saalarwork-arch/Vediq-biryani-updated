import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const { data: revData, error: revError } = await supabaseServer
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (revError) {
        return NextResponse.json({ reviews: [] });
      }
      return NextResponse.json({ reviews: revData || [] });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (_err: any) {
    return NextResponse.json({ reviews: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('customer_reviews')
      .update({ is_approved, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*');

    if (error) {
      const { data: revData, error: revError } = await supabaseServer
        .from('reviews')
        .update({ is_approved, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*');

      if (revError) {
        return NextResponse.json({ error: revError.message }, { status: 500 });
      }
      return NextResponse.json({ review: revData?.[0] });
    }

    return NextResponse.json({ review: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('customer_reviews').delete().eq('id', id);

    if (error) {
      const { error: revError } = await supabaseServer.from('reviews').delete().eq('id', id);

      if (revError) {
        return NextResponse.json({ error: revError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Review deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('customer_reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Try fallback table 'reviews'
      const { data: revData, error: revError } = await supabaseServer
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { author_name, rating, comment, is_approved } = body;

    if (!author_name || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('customer_reviews')
      .insert([
        {
          author_name,
          rating: Number(rating),
          comment,
          is_approved: Boolean(is_approved ?? false),
          created_at: new Date().toISOString(),
        },
      ])
      .select('*');

    if (error) {
      // Fallback insert to 'reviews'
      const { data: revData, error: revError } = await supabaseServer
        .from('reviews')
        .insert([
          {
            author_name,
            rating: Number(rating),
            comment,
            is_approved: Boolean(is_approved ?? false),
            created_at: new Date().toISOString(),
          },
        ])
        .select('*');

      if (revError) {
        return NextResponse.json({ error: revError.message }, { status: 500 });
      }
      return NextResponse.json({ review: revData?.[0] }, { status: 201 });
    }

    return NextResponse.json({ review: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

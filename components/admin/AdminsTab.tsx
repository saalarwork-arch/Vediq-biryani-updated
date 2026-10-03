'use client';

import React from 'react';
import { Users, ShieldCheck, Lock, UserCheck, AlertTriangle, Key } from 'lucide-react';
import { AdminUser } from '@/types/supabase';

interface AdminsTabProps {
  currentAdmin: AdminUser | null;
  currentUser: any;
}

export default function AdminsTab({ currentAdmin, currentUser }: AdminsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1814]">
            Authorized Admin Users
          </h1>
          <p className="text-xs sm:text-sm text-[#6B665E] mt-1">
            Supabase Auth credentials and active admin role authorization status.
          </p>
        </div>
      </div>

      {/* Current Active Admin Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4">
        <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Currently Authenticated Admin Session</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1">
            <span className="text-[10px] font-bold text-[#6B665E] uppercase tracking-wider block">Admin Email</span>
            <p className="font-bold text-sm text-[#1A1814]">{currentUser?.email || 'Active Session'}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1">
            <span className="text-[10px] font-bold text-[#6B665E] uppercase tracking-wider block">Role Authorization</span>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF5E8] text-[#8C6418] border border-[#E9DCBF]">
              {currentAdmin?.role || 'Super Admin'} (active)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] space-y-1">
            <span className="text-[10px] font-bold text-[#6B665E] uppercase tracking-wider block">Supabase User ID</span>
            <p className="font-mono text-[11px] text-[#5A564F] truncate">{currentUser?.id || 'auth-user-session'}</p>
          </div>
        </div>
      </div>

      {/* Authorization Protocol Guide */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-[#1A1814] text-sm flex items-center gap-2 border-b border-[#F2EFE8] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#9E7422]" />
          <span>Admin Authorization Architecture</span>
        </h3>

        <div className="p-4 rounded-xl bg-[#FAF5E8] border border-[#E9DCBF] text-[#8C6418] space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4" />
            <span>Strict Row Level Security (RLS) Enforced</span>
          </div>
          <p className="text-xs leading-relaxed text-[#5A564F]">
            Admin access is governed strictly by Supabase Auth and the <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#1A1814]">public.admins</code> table with <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-[#1A1814]">active = true</code>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-[#1A1814]">To grant admin access & storage permissions in Supabase SQL Editor:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-[#5A564F] leading-relaxed">
            <li>Have the user create an account via Supabase Auth (or use the primary admin <code className="font-mono text-[#9E7422]">vediqbiryani@gmail.com</code>).</li>
            <li>
              Execute the following SQL query in your <strong>Supabase SQL Editor</strong>:
              <pre className="mt-1.5 p-3 rounded-xl bg-[#141715] text-[#86EFAC] font-mono text-[11px] overflow-x-auto select-all">
{`-- 1. Ensure public.admins record exists
INSERT INTO public.admins (user_id, email, active, role)
VALUES ('bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c', 'vediqbiryani@gmail.com', true, 'admin')
ON CONFLICT (user_id) DO UPDATE SET active = true, role = 'admin', email = 'vediqbiryani@gmail.com';

-- 2. Ensure Storage bucket 'restaurant_assets' exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('restaurant_assets', 'restaurant_assets', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Policies for restaurant_assets
DROP POLICY IF EXISTS "Public Read restaurant_assets" ON storage.objects;
CREATE POLICY "Public Read restaurant_assets"
ON storage.objects FOR SELECT TO public, anon, authenticated
USING (bucket_id = 'restaurant_assets');

DROP POLICY IF EXISTS "Admin Upload restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Upload restaurant_assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND active = true)
  )
);

DROP POLICY IF EXISTS "Admin Update restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Update restaurant_assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND active = true)
  )
);

DROP POLICY IF EXISTS "Admin Delete restaurant_assets" ON storage.objects;
CREATE POLICY "Admin Delete restaurant_assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'restaurant_assets'
  AND (
    auth.uid() = 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c'::uuid
    OR (auth.jwt() ->> 'email') = 'vediqbiryani@gmail.com'
    OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND active = true)
  )
);`}
              </pre>
            </li>
            <li>Once executed, admin image uploads to <code className="font-mono text-[#9E7422]">restaurant_assets</code> and CMS database updates will work seamlessly.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

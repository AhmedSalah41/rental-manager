'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Property = {
  id: string;
  code: string;
  type: string;
  location?: string;
  location_text?: string;
  area?: number;
  status?: string;
};

export default function PropertiesPage() {
  const [rows, setRows] = useState<Property[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell title="العقارات">
      {/* ===== Header ===== */}
      <div className="page-header">
        <div>
          <h1>العقارات</h1>
          <p>عرض جميع العقارات</p>
        </div>

        <Link href="/properties/add" className="primary-btn">
          + إضافة عقار
        </Link>
      </div>

      {/* ===== Table ===== */}
      <div className="card">
        <h3 className="card-title">قائمة العقارات</h3>

        <table className="table">
          <thead>
            <tr>
              <th>كود العقار</th>
              <th>النوع</th>
              <th>الموقع</th>
              <th>المساحة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }} className="muted">
                  لا توجد بيانات بعد
                </td>
              </tr>
            )}

            {rows.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.code}</strong></td>
                <td>{p.type || '-'}</td>
                <td>{p.location_text || p.location || '-'}</td>
                <td>{p.area ?? '-'}</td>
                <td>
                  {p.status === 'rented' && (
                    <span className="badge success">مؤجر</span>
                  )}
                  {p.status === 'vacant' && (
                    <span className="badge warning">فاضي</span>
                  )}
                  {p.status === 'maintenance' && (
                    <span className="badge danger">صيانة</span>
                  )}
                  {!['rented', 'vacant', 'maintenance'].includes(
                    p.status || ''
                  ) && <span className="badge">{p.status || '-'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
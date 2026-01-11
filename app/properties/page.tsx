'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function PropertiesPage() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>العقارات</h1>
          <p>عرض جميع العقارات</p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-primary" href="/properties/add">
            <i className="fas fa-plus" /> إضافة عقار
          </Link>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          <table className="data-table">
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
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.code}</strong></td>
                  <td>{p.type}</td>
                  <td>{p.location_text || p.location || '-'}</td>
                  <td>{p.area ? `${p.area}` : '-'}</td>
                  <td>
                    {p.status === 'rented' && <span className="badge badge-success">مؤجر</span>}
                    {p.status === 'vacant' && <span className="badge badge-warning">فاضي</span>}
                    {p.status === 'maintenance' && <span className="badge badge-danger">صيانة</span>}
                    {!['rented','vacant','maintenance'].includes(p.status) && <span className="badge">{p.status}</span>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-color)' }}>
                    لا توجد بيانات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
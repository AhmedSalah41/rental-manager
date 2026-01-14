'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */
type Property = {
  id: string;
  code: string;
  type: string;
  location?: string;
  location_text?: string;
  area?: number;
  status?: string;
};

/* =======================
   Helpers
======================= */
const PROPERTY_TYPE_LABEL: Record<string, string> = {
  villa: 'فيلا',
  land: 'أرض',
  workshop: 'ورشة',
  other: 'أخرى',
};

export default function PropertiesPage() {
  const [rows, setRows] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  /* =======================
     Load Data
  ======================= */
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

  /* =======================
     Delete Property (SAFE)
  ======================= */
  const deleteProperty = async (propertyId: string) => {
    // 1️⃣ تأكيد المستخدم
    const ok = confirm(
      'هل أنت متأكد من حذف العقار؟\n\n⚠️ سيتم المنع إذا كان هناك عقود مرتبطة به.'
    );
    if (!ok) return;

    setLoading(true);

    // 2️⃣ التأكد إن مفيش عقود مربوطة
    const { data: contracts, error: checkError } = await supabase
      .from('contracts')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1);

    if (checkError) {
      setLoading(false);
      alert('حدث خطأ أثناء التحقق من العقود');
      return;
    }

    if (contracts && contracts.length > 0) {
      setLoading(false);
      alert('❌ لا يمكن حذف العقار لأنه مرتبط بعقد واحد أو أكثر');
      return;
    }

    // 3️⃣ الحذف
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    setLoading(false);

    if (deleteError) {
      alert('حدث خطأ أثناء حذف العقار');
      return;
    }

    alert('✅ تم حذف العقار بنجاح');
    load();
  };

  /* =======================
     UI
  ======================= */
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
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }} className="muted">
                  لا توجد بيانات بعد
                </td>
              </tr>
            )}

            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.code}</strong>
                </td>

                <td>{PROPERTY_TYPE_LABEL[p.type] || '-'}</td>

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

                <td>
                  <button
                    className="btn btn-outline"
                    style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                    disabled={loading}
                    onClick={() => deleteProperty(p.id)}
                  >
                    🗑 حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
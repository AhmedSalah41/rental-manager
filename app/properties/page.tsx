'use client';

import AppShell from '@/components/AppShell';
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
   Constants
======================= */
const PROPERTY_TYPE_LABEL: Record<string, string> = {
  villa: 'فيلا',
  land: 'أرض',
  workshop: 'ورشة',
  other: 'أخرى',
};

/* =======================
   Page
======================= */
export default function AddPropertyPage() {
  /* ===== Form State ===== */
  const [code, setCode] = useState('');
  const [type, setType] = useState('villa');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [status, setStatus] = useState('vacant');
  const [saving, setSaving] = useState(false);

  /* ===== List State ===== */
  const [rows, setRows] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  /* =======================
     Load Properties
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
     Add Property (SAFE)
  ======================= */
  const addProperty = async () => {
    if (!code.trim()) {
      alert('اكتب كود العقار');
      return;
    }

    setSaving(true);

    /* ✅ 1) تحقق إن الكود مش مستخدم قبل كده */
    const { data: exists, error: checkError } = await supabase
      .from('properties')
      .select('id')
      .eq('code', code.trim())
      .limit(1);

    if (checkError) {
      setSaving(false);
      alert('حدث خطأ أثناء التحقق من كود العقار');
      return;
    }

    if (exists && exists.length > 0) {
      setSaving(false);
      alert('❌ كود العقار مستخدم بالفعل، اختر كود مختلف');
      return;
    }

    /* ✅ 2) الإضافة */
    const { error } = await supabase.from('properties').insert({
      code: code.trim(),
      type,
      location_text: location || null,
      area: area === '' ? null : area,
      status,
    });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    /* reset form */
    setCode('');
    setType('villa');
    setLocation('');
    setArea('');
    setStatus('vacant');

    load();
  };

  /* =======================
     Delete Property (SAFE)
  ======================= */
  const deleteProperty = async (id: string) => {
    const ok = confirm(
      'هل أنت متأكد من حذف العقار؟\n\n⚠️ لا يمكن الحذف إذا كان هناك عقد مرتبط به.'
    );
    if (!ok) return;

    setLoading(true);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('property_id', id)
      .limit(1);

    if (contracts && contracts.length > 0) {
      setLoading(false);
      alert('❌ لا يمكن حذف العقار لأنه مرتبط بعقد');
      return;
    }

    const { error } = await supabase.from('properties').delete().eq('id', id);
    setLoading(false);

    if (error) {
      alert('حدث خطأ أثناء الحذف');
      return;
    }

    load();
  };

  /* =======================
     UI
  ======================= */
  return (
    <AppShell title="إضافة عقار">
      {/* ===== Add Form ===== */}
      <div className="card dark">
        <h3 className="card-title">إضافة عقار جديد</h3>

        <div className="form-grid">
          <input
            placeholder="كود العقار"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="villa">فيلا</option>
            <option value="land">أرض</option>
            <option value="workshop">ورشة</option>
            <option value="other">أخرى</option>
          </select>

          <input
            placeholder="الموقع"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            type="number"
            placeholder="المساحة"
            value={area}
            onChange={(e) =>
              setArea(e.target.value === '' ? '' : Number(e.target.value))
            }
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="vacant">فاضي</option>
            <option value="rented">مؤجر</option>
            <option value="maintenance">صيانة</option>
          </select>
        </div>

        <button className="primary-btn" onClick={addProperty} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ العقار'}
        </button>
      </div>

      {/* ===== List (موجودة زي ما كانت) ===== */}
      <div className="card">
        <h3 className="card-title">العقارات المضافة</h3>

        <table className="table">
          <thead>
            <tr>
              <th>الكود</th>
              <th>النوع</th>
              <th>الموقع</th>
              <th>المساحة</th>
              <th>الحالة</th>
              <th>إجراء</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: 'center' }}>
                  لا توجد بيانات
                </td>
              </tr>
            )}

            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.code}</strong>
                </td>
                <td>{PROPERTY_TYPE_LABEL[p.type] || '-'}</td>
                <td>{p.location_text || '-'}</td>
                <td>{p.area ?? '-'}</td>
                <td>
                  {p.status === 'vacant' && (
                    <span className="badge warning">فاضي</span>
                  )}
                  {p.status === 'rented' && (
                    <span className="badge success">مؤجر</span>
                  )}
                  {p.status === 'maintenance' && (
                    <span className="badge danger">صيانة</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-outline"
                    style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                    disabled={loading}
                    onClick={() => deleteProperty(p.id)}
                  >
                    حذف
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
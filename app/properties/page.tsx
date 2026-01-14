'use client';

import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Constants
======================= */
const PROPERTY_TYPES = [
  { value: 'villa', label: 'فيلا' },
  { value: 'land', label: 'أرض' },
  { value: 'workshop', label: 'ورشة' },
  { value: 'other', label: 'أخرى' },
];

const PROPERTY_STATUS = [
  { value: 'vacant', label: 'فاضي' },
  { value: 'rented', label: 'مؤجر' },
  { value: 'maintenance', label: 'صيانة' },
];

/* =======================
   Page
======================= */
export default function AddPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // ===== Form State =====
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [locationText, setLocationText] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [status, setStatus] = useState('vacant');
  const [notes, setNotes] = useState('');

  /* =======================
     Save
  ======================= */
  const save = async () => {
    // ===== Validation =====
    if (!code.trim()) return alert('اكتب كود العقار');
    if (!type) return alert('اختار نوع العقار');

    if (!PROPERTY_TYPES.map(t => t.value).includes(type)) {
      return alert('نوع العقار غير صالح');
    }

    setSaving(true);

    const { error } = await supabase.from('properties').insert([
      {
        code: code.trim(),
        type, // 👈 دايمًا ENGLISH (villa / land / ...)
        location_text: locationText || null,
        area: area ? Number(area) : null,
        status,
        notes: notes || null,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('✅ تم إضافة العقار بنجاح');
    router.push('/properties');
  };

  /* =======================
     UI
  ======================= */
  return (
    <AppShell title="إضافة عقار جديد">
      <div className="card">
        <h3 className="card-title">إضافة عقار جديد</h3>

        <div className="form-grid">
          {/* كود العقار */}
          <div className="form-group">
            <label>كود العقار *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: V-101"
            />
          </div>

          {/* نوع العقار */}
          <div className="form-group">
            <label>نوع العقار *</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">اختر النوع</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* الموقع */}
          <div className="form-group">
            <label>الموقع</label>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="مثال: جدة – حي السلامة"
            />
          </div>

          {/* المساحة */}
          <div className="form-group">
            <label>المساحة (م²)</label>
            <input
              type="number"
              min={0}
              value={area}
              onChange={(e) => setArea(e.target.value ? Number(e.target.value) : '')}
              placeholder="150"
            />
          </div>

          {/* الحالة */}
          <div className="form-group">
            <label>الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROPERTY_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* ملاحظات */}
          <div className="form-group">
            <label>ملاحظات</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اختياري"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="primary-btn" onClick={save} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>

          <button
            className="btn btn-outline"
            type="button"
            onClick={() => router.back()}
          >
            رجوع
          </button>
        </div>
      </div>
    </AppShell>
  );
}
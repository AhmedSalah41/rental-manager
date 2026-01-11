'use client';

import AppShell from '@/components/AppShell';
import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'فيلا',
    location_text: '',
    area: '',
    status: 'vacant',
    notes: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('properties').insert({
      code: form.code,
      type: form.type,
      location_text: form.location_text,
      area: form.area ? Number(form.area) : null,
      status: form.status,
      notes: form.notes,
    });

    setLoading(false);
    if (error) return alert(error.message);
    router.push('/properties');
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>إضافة عقار جديد</h1>
          <p>أضف عقاراً جديداً إلى النظام</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          <form onSubmit={submit} style={{ display: 'grid', gap: 14, maxWidth: 700 }}>
            <div>
              <label className="form-label"><span style={{ color: 'var(--danger-color)' }}>*</span> كود العقار</label>
              <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>

            <div>
              <label className="form-label"><span style={{ color: 'var(--danger-color)' }}>*</span> نوع العقار</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="villa">فيلا</option>
                <option value="land">أرض</option>
                <option value="workshop">ورشة</option>
                <option value="other">اخرى</option>
               
              </select>
            </div>

            <div>
              <label className="form-label">الموقع</label>
              <input className="form-control" value={form.location_text} onChange={(e) => setForm({ ...form, location_text: e.target.value })} />
            </div>

            <div>
              <label className="form-label">المساحة</label>
              <input className="form-control" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>

            <div>
              <label className="form-label">الحالة</label>
              <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">فاضي</option>
                <option value="rented">مؤجر</option>
                <option value="maintenance">صيانة</option>
              </select>
            </div>

            <div>
              <label className="form-label">ملاحظات</label>
              <textarea className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => router.push('/properties')}>
                رجوع
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
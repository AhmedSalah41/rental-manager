'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */
type Tenant = {
  id: string;
  name: string;
  nationality: string | null;
  id_type: string | null;
  national_id: string;
  phone: string;
  email: string | null;
  address: string | null;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  /* ===== Form State ===== */
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);

  /* =======================
     Load Tenants
  ======================= */
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTenants(data);
  };

  /* =======================
     Check Contracts
  ======================= */
  const hasContracts = async (tenantId: string) => {
    const { data } = await supabase
      .from('contracts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    return data && data.length > 0;
  };

  /* =======================
     Check National ID Unique
  ======================= */
  const nationalIdExists = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('national_id', nationalId)
      .neq('id', editingId || '');

    return data && data.length > 0;
  };

  /* =======================
     Add / Update Tenant
  ======================= */
  const saveTenant = async () => {
    if (!name || !nationalId || !phone) {
      alert('من فضلك اكمل البيانات الأساسية');
      return;
    }

    setLoading(true);

    // منع تكرار رقم الهوية
    const exists = await nationalIdExists();
    if (exists) {
      setLoading(false);
      alert('❌ رقم الهوية مسجل بالفعل لمستأجر آخر');
      return;
    }

    if (editingId) {
      // تعديل
      const blocked = await hasContracts(editingId);
      if (blocked) {
        setLoading(false);
        alert('❌ لا يمكن تعديل المستأجر لأنه مرتبط بعقد');
        return;
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          name,
          nationality: nationality || null,
          id_type: idType || null,
          national_id: nationalId,
          phone,
          email: email || null,
          address: address || null,
        })
        .eq('id', editingId);

      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }
    } else {
      // إضافة
      const { error } = await supabase.from('tenants').insert({
        name,
        nationality: nationality || null,
        id_type: idType || null,
        national_id: nationalId,
        phone,
        email: email || null,
        address: address || null,
      });

      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }
    }

    resetForm();
    fetchTenants();
    setLoading(false);
  };

  /* =======================
     Delete Tenant (SAFE)
  ======================= */
  const deleteTenant = async (id: string) => {
    const ok = confirm(
      'هل أنت متأكد من حذف المستأجر؟\n\n⚠️ لا يمكن الحذف إذا كان هناك عقد مرتبط به.'
    );
    if (!ok) return;

    setLoading(true);

    const blocked = await hasContracts(id);
    if (blocked) {
      setLoading(false);
      alert('❌ لا يمكن حذف المستأجر لأنه مرتبط بعقد');
      return;
    }

    const { error } = await supabase.from('tenants').delete().eq('id', id);
    setLoading(false);

    if (error) {
      alert('حدث خطأ أثناء الحذف');
      return;
    }

    fetchTenants();
  };

  /* =======================
     Helpers
  ======================= */
  const startEdit = (t: Tenant) => {
    setEditingId(t.id);
    setName(t.name);
    setNationality(t.nationality || '');
    setIdType(t.id_type || '');
    setNationalId(t.national_id);
    setPhone(t.phone);
    setEmail(t.email || '');
    setAddress(t.address || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setNationality('');
    setIdType('');
    setNationalId('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  /* =======================
     UI
  ======================= */
  return (
    <AppShell title="المستأجرين">
      <div style={{ display: 'grid', gap: 24 }}>

        {/* ===== Add / Edit ===== */}
        <div className="card">
          <h3 className="card-title">
            {editingId ? 'تعديل مستأجر' : 'إضافة مستأجر جديد'}
          </h3>

          <div className="form-grid">
            <input placeholder="اسم المستأجر" value={name} onChange={e => setName(e.target.value)} />
            <input placeholder="الجنسية" value={nationality} onChange={e => setNationality(e.target.value)} />

            <select value={idType} onChange={e => setIdType(e.target.value)}>
              <option value="">نوع الهوية</option>
              <option value="national">هوية وطنية</option>
              <option value="passport">جواز سفر</option>
              <option value="iqama">إقامة</option>
            </select>

            <input placeholder="رقم الهوية" value={nationalId} onChange={e => setNationalId(e.target.value)} />
            <input placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} />
            <input placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="العنوان" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="primary-btn" onClick={saveTenant} disabled={loading}>
              {editingId ? 'حفظ التعديل' : 'حفظ المستأجر'}
            </button>

            {editingId && (
              <button className="btn btn-outline" onClick={resetForm}>
                إلغاء
              </button>
            )}
          </div>
        </div>

        {/* ===== List ===== */}
        <div className="card">
          <h3 className="card-title">قائمة المستأجرين</h3>

          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهوية</th>
                <th>الجوال</th>
                <th>الجنسية</th>
                <th>إجراءات</th>
              </tr>
            </thead>

            <tbody>
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>
                    لا توجد بيانات بعد
                  </td>
                </tr>
              )}

              {tenants.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.national_id}</td>
                  <td>{t.phone}</td>
                  <td>{t.nationality || '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => startEdit(t)}>
                      ✏️ تعديل
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                      onClick={() => deleteTenant(t.id)}
                    >
                      🗑 حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppShell>
  );
}
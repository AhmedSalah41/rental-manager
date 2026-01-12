'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

type Tenant = {
  id: string;
  name: string;
  national_id: string;
  phone: string;
  address: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

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

  const addTenant = async () => {
    if (!name || !nationalId || !phone) {
      alert('من فضلك اكمل البيانات الأساسية');
      return;
    }

    const { error } = await supabase.from('tenants').insert({
      name,
      national_id: nationalId,
      phone,
      address,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName('');
    setNationalId('');
    setPhone('');
    setAddress('');

    fetchTenants();
  };

  return (
    <AppShell title="المستأجرين">
      <div style={{ display: 'grid', gap: 24 }}>

        {/* ===== Add Tenant ===== */}
        <div className="card">
          <h3 className="card-title">إضافة مستأجر جديد</h3>

          <div className="form-grid">
            <input placeholder="اسم المستأجر" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="رقم الهوية" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
            <input placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input placeholder="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <button className="primary-btn" onClick={addTenant}>
            حفظ المستأجر
          </button>
        </div>

        {/* ===== Tenants List ===== */}
        <div className="card">
          <h3 className="card-title">قائمة المستأجرين</h3>

          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهوية</th>
                <th>رقم الهاتف</th>
                <th>العنوان</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    لا توجد بيانات بعد
                  </td>
                </tr>
              )}

              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.national_id}</td>
                  <td>{t.phone}</td>
                  <td>{t.address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppShell>
  );
}
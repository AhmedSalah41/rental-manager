'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */

type Property = {
  id: string | number;
  code: string;
};

type Tenant = {
  id: string | number;
  name: string;
};

type ContractRow = {
  id: string;
  contract_no: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  rent_amount: number;
  pay_frequency: string;
  properties: { code: string } | null;
  tenants: { name: string } | null;
};

/* =======================
   Helpers
======================= */

function calculateDurationMonths(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;

  return (
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth())
  );
}

/* =======================
   Page
======================= */

export default function ContractsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  const [contractNo, setContractNo] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [payFrequency, setPayFrequency] =
    useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const [saving, setSaving] = useState(false);

  const durationMonths = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateDurationMonths(startDate, endDate);
  }, [startDate, endDate]);

  /* =======================
     Load Data
  ======================= */

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([
      loadProperties(),
      loadTenants(),
      loadContracts(),
    ]);
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('id, code')
      .order('created_at', { ascending: false });

    if (!error) setProperties(data || []);
  }

  async function loadTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name')
      .order('created_at', { ascending: false });

    if (!error) setTenants(data || []);
  }

  async function loadContracts() {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_no,
        start_date,
        end_date,
        duration_months,
        rent_amount,
        pay_frequency,
        properties ( code ),
        tenants ( name )
      `)
      .order('created_at', { ascending: false });

    if (!error) setContracts(data || []);
  }

  /* =======================
     Add Contract
  ======================= */

  async function addContract() {
    if (!contractNo.trim()) return alert('اكتب رقم العقد');
    if (!propertyId) return alert('اختار العقار');
    if (!tenantId) return alert('اختار المستأجر');
    if (!startDate) return alert('اختار تاريخ البداية');
    if (!endDate) return alert('اختار تاريخ النهاية');
    if (durationMonths <= 0)
      return alert('تاريخ النهاية لازم يكون بعد البداية بشهر على الأقل');
    if (!rentAmount || rentAmount <= 0)
      return alert('اكتب قيمة الإيجار');
    if (!payFrequency) return alert('اختار دورية الدفع');

    setSaving(true);

    const { error } = await supabase.from('contracts').insert([
      {
        contract_no: contractNo.trim(),
        property_id: propertyId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        duration_months: durationMonths,
        rent_amount: rentAmount,
        pay_frequency: payFrequency,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    // reset
    setContractNo('');
    setPropertyId('');
    setTenantId('');
    setStartDate('');
    setEndDate('');
    setRentAmount(0);
    setPayFrequency('monthly');

    loadContracts();
  }

  /* =======================
     UI
  ======================= */

  return (
    <AppShell title="العقود">
      {/* ===== Add Contract ===== */}
      <div className="card dark">
        <h3 className="card-title">إضافة عقد جديد</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>رقم العقد</label>
            <input
              placeholder="CNT-2026-01"
              value={contractNo}
              onChange={(e) => setContractNo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>العقار</label>
           <select
              value={propertyId ?? ''}
              onChange={(e) => setPropertyId(e.target.value || null)}
            >
              <option value="">اختر العقار</option>
              {properties.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>المستأجر</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">اختر المستأجر</option>
              {tenants.map((t) => (
                <option key={String(t.id)} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>بداية العقد</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>نهاية العقد</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>قيمة الإيجار (شهري)</label>
            <input
              type="number"
              min={0}
              placeholder="10000"
              value={rentAmount || ''}
              onChange={(e) => setRentAmount(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>دورية الدفع</label>
            <select
              value={payFrequency}
              onChange={(e) =>
                setPayFrequency(e.target.value as any)
              }
            >
              <option value="monthly">شهري</option>
              <option value="quarterly">ربع سنوي</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button
            className="primary-btn"
            onClick={addContract}
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ العقد'}
          </button>

          <span className="muted">
            المدة المحسوبة: <b>{durationMonths}</b> شهر
          </span>
        </div>
      </div>

      {/* ===== Contracts List ===== */}
      <div className="card">
        <h3 className="card-title">قائمة العقود</h3>

        {contracts.length === 0 ? (
          <p className="muted">لا توجد عقود بعد</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>رقم العقد</th>
                <th>العقار</th>
                <th>المستأجر</th>
                <th>بداية</th>
                <th>نهاية</th>
                <th>المدة</th>
                <th>الإيجار</th>
                <th>الدفع</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>{c.contract_no}</td>
                  <td>{c.properties?.code || '-'}</td>
                  <td>{c.tenants?.name || '-'}</td>
                  <td>{c.start_date}</td>
                  <td>{c.end_date}</td>
                  <td>{c.duration_months} شهر</td>
                  <td>{c.rent_amount}</td>
                  <td>{c.pay_frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
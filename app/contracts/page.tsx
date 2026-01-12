// force test change
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

  contract_type?: string;
  contract_place?: string;

  deed_number?: string;
  deed_issue_date?: string; // date comes as string
  deed_issue_place?: string;

  unit_type?: string;
  unit_no?: string;
  floor_no?: string;
  unit_area?: number;
  has_mezzanine?: boolean;
  electricity_meter?: string;
  water_meter?: string;

  properties: { code: string }[];
  tenants: { name: string }[];
};

/* =======================
   Helpers
======================= */

function calculateDurationMonths(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;

  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

/* =======================
   Page
======================= */

export default function ContractsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  // ===== بيانات أساسية =====
  const [contractNo, setContractNo] = useState('');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [payFrequency, setPayFrequency] =
    useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // ===== بيانات العقد (إضافية) =====
  const [contractType, setContractType] = useState(''); // جديد / مجدد
  const [contractPlace, setContractPlace] = useState(''); // مكان ابرام العقد

  // ===== بيانات الصك =====
  const [deedNumber, setDeedNumber] = useState('');
  const [deedIssueDate, setDeedIssueDate] = useState('');
  const [deedIssuePlace, setDeedIssuePlace] = useState('');

  // ===== بيانات الوحدة الإيجارية =====
  const [unitType, setUnitType] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [floorNo, setFloorNo] = useState('');
  const [unitArea, setUnitArea] = useState<number>(0);
  const [hasMezzanine, setHasMezzanine] = useState(false);
  const [electricityMeter, setElectricityMeter] = useState('');
  const [waterMeter, setWaterMeter] = useState('');

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
    await Promise.all([loadProperties(), loadTenants(), loadContracts()]);
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
      .select(
        `
        id,
        contract_no,
        start_date,
        end_date,
        duration_months,
        rent_amount,
        pay_frequency,

        contract_type,
        contract_place,

        deed_number,
        deed_issue_date,
        deed_issue_place,

        unit_type,
        unit_no,
        floor_no,
        unit_area,
        has_mezzanine,
        electricity_meter,
        water_meter,

        properties ( code ),
        tenants ( name )
      `
      )
      .returns<ContractRow[]>()
      .order('created_at', { ascending: false });

    if (!error) setContracts(data ?? []);
  }

  /* =======================
   Generate Installments
======================= */

async function generateInstallments(contractId: string) {
  const step =
    payFrequency === 'monthly'
      ? 1
      : payFrequency === 'quarterly'
      ? 3
      : 12;

  const installments = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    installments.push({
      contract_id: contractId,
      due_date: current.toISOString().split('T')[0],
      amount: rentAmount * step,
      status: 'unpaid',
    });

    current.setMonth(current.getMonth() + step);
  }

  if (installments.length > 0) {
    await supabase.from('installments').insert(installments);
  }
}
  /* =======================
     Add Contract
  ======================= */

  async function addContract() {
    // validations أساسية
    if (!contractNo.trim()) return alert('اكتب رقم العقد');
    if (!propertyId) return alert('اختار العقار');
    if (!tenantId) return alert('اختار المستأجر');
    if (!startDate) return alert('اختار تاريخ البداية');
    if (!endDate) return alert('اختار تاريخ النهاية');
    if (durationMonths <= 0) return alert('تاريخ النهاية لازم يكون بعد البداية بشهر على الأقل');
    if (!rentAmount || rentAmount <= 0) return alert('اكتب قيمة الإيجار');
    if (!payFrequency) return alert('اختار دورية الدفع');

    setSaving(true);

    const { data, error } = await supabase
  .from('contracts')
  .insert([
    {
      contract_no: contractNo.trim(),
      property_id: propertyId,
      tenant_id: tenantId,
      start_date: startDate,
      end_date: endDate,
      duration_months: durationMonths,
      rent_amount: rentAmount,
      pay_frequency: payFrequency,

      contract_type: contractType || null,
      contract_place: contractPlace || null,

      deed_number: deedNumber || null,
      deed_issue_date: deedIssueDate || null,
      deed_issue_place: deedIssuePlace || null,

      unit_type: unitType || null,
      unit_no: unitNo || null,
      floor_no: floorNo || null,
      unit_area: unitArea > 0 ? unitArea : null,
      has_mezzanine: hasMezzanine,
      electricity_meter: electricityMeter || null,
      water_meter: waterMeter || null,
    },
  ])
  .select()
  .single();
  if (data?.id) {
  await generateInstallments(data.id);
}

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    // reset
    setContractNo('');
    setPropertyId(null); // ✅ مهم
    setTenantId('');
    setStartDate('');
    setEndDate('');
    setRentAmount(0);
    setPayFrequency('monthly');

    setContractType('');
    setContractPlace('');

    setDeedNumber('');
    setDeedIssueDate('');
    setDeedIssuePlace('');

    setUnitType('');
    setUnitNo('');
    setFloorNo('');
    setUnitArea(0);
    setHasMezzanine(false);
    setElectricityMeter('');
    setWaterMeter('');

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

        {/* ===== بيانات العقد ===== */}
        <h4 style={{ marginTop: 8, marginBottom: 8 }}>بيانات العقد</h4>
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
            <label>نوع العقد</label>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
              <option value="">اختر</option>
              <option value="new">جديد</option>
              <option value="renewal">مجدد</option>
            </select>
          </div>

          <div className="form-group">
            <label>مكان إبرام العقد</label>
            <input
              placeholder="مثال: الرياض"
              value={contractPlace}
              onChange={(e) => setContractPlace(e.target.value)}
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
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
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
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>نهاية العقد</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
            <select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as any)}>
              <option value="monthly">شهري</option>
              <option value="quarterly">ربع سنوي</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
        </div>

        {/* ===== بيانات الوحدة الإيجارية ===== */}
        <h4 style={{ marginTop: 18, marginBottom: 8 }}>بيانات الوحدة الإيجارية</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>نوع الوحدة</label>
            <input value={unitType} onChange={(e) => setUnitType(e.target.value)} placeholder="محل / ورشة ..." />
          </div>

          <div className="form-group">
            <label>رقم الوحدة</label>
            <input value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder="مثال: 497" />
          </div>

          <div className="form-group">
            <label>رقم الطابق</label>
            <input value={floorNo} onChange={(e) => setFloorNo(e.target.value)} placeholder="1" />
          </div>

          <div className="form-group">
            <label>مساحة الوحدة</label>
            <input
              type="number"
              min={0}
              value={unitArea || ''}
              onChange={(e) => setUnitArea(Number(e.target.value))}
              placeholder="600"
            />
          </div>

          <div className="form-group">
            <label>عداد الكهرباء</label>
            <input value={electricityMeter} onChange={(e) => setElectricityMeter(e.target.value)} />
          </div>

          <div className="form-group">
            <label>عداد المياه</label>
            <input value={waterMeter} onChange={(e) => setWaterMeter(e.target.value)} />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={hasMezzanine}
              onChange={(e) => setHasMezzanine(e.target.checked)}
              id="hasMezzanine"
            />
            <label htmlFor="hasMezzanine" style={{ margin: 0 }}>
              يوجد ميزانين
            </label>
          </div>
        </div>

        {/* ===== بيانات الصك ===== */}
        <h4 style={{ marginTop: 18, marginBottom: 8 }}>رقم الصك</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>رقم الصك</label>
            <input value={deedNumber} onChange={(e) => setDeedNumber(e.target.value)} />
          </div>

          <div className="form-group">
            <label>تاريخ إصدار الصك</label>
            <input type="date" value={deedIssueDate} onChange={(e) => setDeedIssueDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>مكان إصدار الصك</label>
            <input value={deedIssuePlace} onChange={(e) => setDeedIssuePlace(e.target.value)} placeholder="مثال: الرياض" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="primary-btn" onClick={addContract} disabled={saving}>
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
                  <td>{c.properties[0]?.code || '-'}</td>
                  <td>{c.tenants[0]?.name || '-'}</td>
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
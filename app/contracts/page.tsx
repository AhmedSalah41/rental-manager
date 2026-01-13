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

type Installment = {
  id: string;
  contract_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late' | string;
};

type ContractRow = {
  id: string;
  contract_no: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  rent_amount: number;
  pay_frequency: 'monthly' | 'quarterly' | 'yearly' | string;

  contract_type?: string;
  contract_place?: string;

  deed_number?: string;
  deed_issue_date?: string;
  deed_issue_place?: string;

  unit_type?: string;
  unit_no?: string;
  floor_no?: string;
  unit_area?: number;
  has_mezzanine?: boolean;
  electricity_meter?: string;
  water_meter?: string;

  // joins (object)
  properties?: { code: string } | null;
  tenants?: { name: string } | null;

  // attached after second query
  installments?: Installment[];
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

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sumAmounts(items: Installment[], status?: 'paid' | 'pending') {
  return items
    .filter((i) => (status ? i.status === status : true))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
}

function getNextPending(items: Installment[]) {
  return [...items]
    .filter((i) => i.status === 'pending')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] || null;
}

function isLateInstallment(i: Installment) {
  // لو DB عندك مش بتخزن late هنحسبها
  if (i.status === 'late') return true;
  if (i.status !== 'pending') return false;
  const today = toYMD(new Date());
  return i.due_date < today;
}

/* =======================
   Page
======================= */

export default function ContractsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  // Accordion open row
  const [openId, setOpenId] = useState<string | null>(null);

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
  const [contractType, setContractType] = useState(''); // new / renewal
  const [contractPlace, setContractPlace] = useState('');

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const durationMonths = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calculateDurationMonths(startDate, endDate);
  }, [startDate, endDate]);

  /* =======================
     Load Data
  ======================= */

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    await Promise.all([loadProperties(), loadTenants()]);
    await loadContractsWithInstallments();
  }

  async function loadProperties() {
    const { data } = await supabase
      .from('properties')
      .select('id, code')
      .order('created_at', { ascending: false });

    setProperties(data || []);
  }

  async function loadTenants() {
    const { data } = await supabase
      .from('tenants')
      .select('id, name')
      .order('created_at', { ascending: false });

    setTenants(data || []);
  }

  // ✅ تحميل العقود + تحميل الأقساط في استعلام تاني (مضمون)
  async function loadContractsWithInstallments() {
    const { data: cData, error: cErr } = await supabase
      .from('contracts')
      .select(`
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

        properties:property_id ( code ),
        tenants:tenant_id ( name )
      `)
      .order('created_at', { ascending: false });

    if (cErr) {
      console.error(cErr);
      setContracts([]);
      return;
    }

    const contractsBase: ContractRow[] = (cData as any) || [];
    const ids = contractsBase.map((c) => c.id);

    if (ids.length === 0) {
      setContracts([]);
      return;
    }

    const { data: iData, error: iErr } = await supabase
      .from('installments')
      .select('id, contract_id, due_date, amount, status')
      .in('contract_id', ids)
      .order('due_date', { ascending: true });

    if (iErr) {
      console.error(iErr);
      // نعرض العقود حتى لو الأقساط فشلت
      setContracts(contractsBase.map((c) => ({ ...c, installments: [] })));
      return;
    }

    const inst = (iData as any as Installment[]) || [];
    const map = new Map<string, Installment[]>();
    for (const row of inst) {
      const arr = map.get(row.contract_id) || [];
      arr.push(row);
      map.set(row.contract_id, arr);
    }

    const merged = contractsBase.map((c) => ({
      ...c,
      installments: map.get(c.id) || [],
    }));

    setContracts(merged);
  }

  /* =======================
     Add Contract + Generate Installments
  ======================= */

  async function addContract() {
    if (!contractNo.trim()) return alert('اكتب رقم العقد');
    if (!propertyId) return alert('اختار العقار');
    if (!tenantId) return alert('اختار المستأجر');
    if (!startDate) return alert('اختار تاريخ البداية');
    if (!endDate) return alert('اختار تاريخ النهاية');
    if (durationMonths <= 0) return alert('تاريخ النهاية لازم يكون بعد البداية بشهر على الأقل');
    if (!rentAmount || rentAmount <= 0) return alert('اكتب قيمة الإيجار');
    if (!payFrequency) return alert('اختار دورية الدفع');

    setSaving(true);

    const { data: contract, error } = await supabase
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
      .select('id')
      .single();

    if (error || !contract?.id) {
      setSaving(false);
      alert(error?.message || 'فشل حفظ العقد');
      return;
    }

    // توليد الاستحقاقات
    const stepMonths = payFrequency === 'monthly' ? 1 : payFrequency === 'quarterly' ? 3 : 12;

    const installments: Array<{
      contract_id: string;
      due_date: string;
      amount: number;
      status: 'pending';
    }> = [];

    let current = new Date(startDate);
    const end = new Date(endDate);
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      installments.push({
        contract_id: contract.id,
        due_date: toYMD(current),
        amount: rentAmount * stepMonths,
        status: 'pending',
      });
      current = addMonths(current, stepMonths);
    }

    if (installments.length > 0) {
      const { error: instError } = await supabase.from('installments').insert(installments);
      if (instError) {
        setSaving(false);
        alert('تم حفظ العقد لكن حصل خطأ في توليد الاستحقاقات: ' + instError.message);
        await loadContractsWithInstallments();
        return;
      }
    }

    setSaving(false);
    alert('تم حفظ العقد وتوليد الاستحقاقات ✅');

    // reset
    setContractNo('');
    setPropertyId(null);
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

    await loadContractsWithInstallments();
  }

  /* =======================
     Pay installment
  ======================= */

  async function markInstallmentPaid(installmentId: string) {
    setPayingId(installmentId);

    const { error } = await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', installmentId);

    setPayingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    await loadContractsWithInstallments();
  }

  /* =======================
     Delete Contract (+ installments)
  ======================= */

  async function deleteContract(contractId: string, contractNoLabel: string) {
    // نحسب عدد الأقساط/المتبقي للعرض في التحذير
    const target = contracts.find((c) => c.id === contractId);
    const inst = target?.installments || [];
    const total = sumAmounts(inst);
    const paid = sumAmounts(inst, 'paid');
    const remaining = total - paid;

    const ok = confirm(
      `⚠️ تحذير\nسيتم حذف العقد (${contractNoLabel}) وجميع الاستحقاقات التابعة له.\n` +
      `عدد الأقساط: ${inst.length}\nالمتبقي: ${remaining.toLocaleString()}\n\nهل تريد المتابعة؟`
    );
    if (!ok) return;

    setDeletingId(contractId);

    // 1) حذف الاستحقاقات
    const { error: instError } = await supabase
      .from('installments')
      .delete()
      .eq('contract_id', contractId);

    if (instError) {
      setDeletingId(null);
      alert('خطأ أثناء حذف الاستحقاقات: ' + instError.message);
      return;
    }

    // 2) حذف العقد
    const { error } = await supabase.from('contracts').delete().eq('id', contractId);

    setDeletingId(null);

    if (error) {
      alert('خطأ أثناء حذف العقد: ' + error.message);
      return;
    }

    alert('✅ تم حذف العقد والاستحقاقات');
    await loadContractsWithInstallments();
    if (openId === contractId) setOpenId(null);
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
            <select value={propertyId ?? ''} onChange={(e) => setPropertyId(e.target.value || null)}>
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

        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <button className="primary-btn" onClick={addContract} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ العقد'}
          </button>

          <span className="muted">
            المدة المحسوبة: <b>{durationMonths}</b> شهر
          </span>
        </div>
      </div>

      {/* ===== Accordion Contracts ===== */}
      <div className="card">
        <h3 className="card-title">متابعة العقود (Accordion)</h3>

        {contracts.length === 0 ? (
          <p className="muted">لا توجد عقود بعد</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contracts.map((c) => {
              const inst = c.installments || [];
              const total = sumAmounts(inst);
              const paid = sumAmounts(inst, 'paid');
              const remaining = total - paid;

              const next = getNextPending(inst);

              return (
                <div key={c.id} className="content-card">
                  {/* Header row */}
                  <div
                    className="card-body"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setOpenId(openId === c.id ? null : c.id)}
                  >
                    <span style={{ fontWeight: 900 }}>{openId === c.id ? '▲' : '▼'}</span>

                    <strong>{c.contract_no}</strong>
                    <span>{c.properties?.code || '-'}</span>
                    <span>{c.tenants?.name || '-'}</span>

                    <span>
                      المتبقي: <b>{remaining.toLocaleString()}</b>
                    </span>

                    <span>
                      {next ? (
                        <>
                          القسط القادم: <b>{Number(next.amount).toLocaleString()}</b>
                          <br />
                          <small className="muted">{next.due_date}</small>
                        </>
                      ) : (
                        <span className="badge badge-success">مكتمل</span>
                      )}
                    </span>

                    {/* actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-outline"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        disabled={deletingId === c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteContract(c.id, c.contract_no);
                        }}
                      >
                        {deletingId === c.id ? 'جاري الحذف...' : 'حذف'}
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  {openId === c.id && (
                    
                    <div className="card-body" style={{ borderTop: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: 18, marginBottom: 12, flexWrap: 'wrap' }}>
                        <div>إجمالي العقد: <b>{total.toLocaleString()}</b></div>
                        <div>المدفوع: <b>{paid.toLocaleString()}</b></div>
                        <div>المتبقي: <b>{remaining.toLocaleString()}</b></div>
                      </div>
                      {/* ===== Contract Details ===== */}
                      <div className="content-card" style={{ marginBottom: 16 }}>
                        <div
                          className="card-body"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 12,
                          }}
                        >
                          <div><b>رقم العقد:</b> {c.contract_no}</div>
                          <div><b>نوع العقد:</b> {c.contract_type || '-'}</div>
                          <div><b>مكان الإبرام:</b> {c.contract_place || '-'}</div>

                          <div><b>العقار:</b> {c.properties?.code || '-'}</div>
                          <div><b>المستأجر:</b> {c.tenants?.name || '-'}</div>

                          <div><b>بداية العقد:</b> {c.start_date}</div>
                          <div><b>نهاية العقد:</b> {c.end_date}</div>
                          <div><b>مدة العقد:</b> {c.duration_months} شهر</div>

                          <div><b>قيمة الإيجار:</b> {c.rent_amount.toLocaleString()}</div>
                          <div><b>دورية الدفع:</b> {c.pay_frequency}</div>

                          <div><b>نوع الوحدة:</b> {c.unit_type || '-'}</div>
                          <div><b>رقم الوحدة:</b> {c.unit_no || '-'}</div>
                          <div><b>الطابق:</b> {c.floor_no || '-'}</div>
                          <div><b>المساحة:</b> {c.unit_area || '-'}</div>

                          <div><b>ميزانين:</b> {c.has_mezzanine ? 'نعم' : 'لا'}</div>
                          <div><b>عداد كهرباء:</b> {c.electricity_meter || '-'}</div>
                          <div><b>عداد مياه:</b> {c.water_meter || '-'}</div>

                          <div><b>رقم الصك:</b> {c.deed_number || '-'}</div>
                          <div><b>تاريخ الصك:</b> {c.deed_issue_date || '-'}</div>
                          <div><b>مكان إصدار الصك:</b> {c.deed_issue_place || '-'}</div>
                        </div>
                      </div>

                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>تاريخ الاستحقاق</th>
                            <th>المبلغ</th>
                            <th>الحالة</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {inst.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center' }}>
                                لا توجد استحقاقات لهذا العقد
                              </td>
                            </tr>
                          ) : (
                            inst.map((i) => {
                              const late = isLateInstallment(i);
                              return (
                                <tr key={i.id}>
                                  <td>{i.due_date}</td>
                                  <td>{Number(i.amount).toLocaleString()}</td>
                                  <td>
                                    {i.status === 'paid' && <span className="badge badge-success">مدفوع</span>}
                                    {i.status === 'pending' && !late && <span className="badge badge-warning">قادم</span>}
                                    {(i.status === 'late' || late) && <span className="badge badge-danger">متأخر</span>}
                                  </td>
                                  <td>
                                    {i.status === 'pending' && (
                                      <button
                                        className="btn btn-primary"
                                        disabled={payingId === i.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markInstallmentPaid(i.id);
                                        }}
                                      >
                                        {payingId === i.id ? '...' : 'دفع'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
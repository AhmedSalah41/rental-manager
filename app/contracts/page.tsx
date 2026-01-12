'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Types
======================= */

type Property = { id: string; code: string };
type Tenant = { id: string; name: string };

type ContractRow = {
  id: string;
  contract_no: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  rent_amount: number;
  pay_frequency: 'monthly' | 'quarterly' | 'yearly';
  properties: { code: string }[];
  tenants: { name: string }[];
};

/* =======================
   Helpers
======================= */

function monthsBetween(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/* =======================
   Page
======================= */

export default function ContractsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);

  const [contractNo, setContractNo] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState(0);
  const [payFrequency, setPayFrequency] =
    useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const durationMonths = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return monthsBetween(startDate, endDate);
  }, [startDate, endDate]);

  /* =======================
     Load Data
  ======================= */

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [{ data: p }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('properties').select('id, code'),
      supabase.from('tenants').select('id, name'),
      supabase
        .from('contracts')
        .select(`
          id, contract_no, start_date, end_date,
          duration_months, rent_amount, pay_frequency,
          properties(code), tenants(name)
        `)
        .order('created_at', { ascending: false }),
    ]);

    setProperties(p || []);
    setTenants(t || []);
    setContracts(c || []);
  }

  /* =======================
     Add Contract + Installments
  ======================= */

  async function addContract() {
    if (!contractNo || !propertyId || !tenantId || !startDate || !endDate) {
      alert('كمّل البيانات');
      return;
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        contract_no: contractNo,
        property_id: propertyId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        duration_months: durationMonths,
        rent_amount: rentAmount,
        pay_frequency: payFrequency,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    // ===== توليد الاستحقاقات =====
    let step = 1;
    if (payFrequency === 'quarterly') step = 3;
    if (payFrequency === 'yearly') step = 12;

    const installments = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      installments.push({
        contract_id: contract.id,
        due_date: current.toISOString().slice(0, 10), // ✅ مهم
        amount: rentAmount * step,
        status: 'pending',
      });

      current = addMonths(current, step);
    }

    const { error: instError } = await supabase
      .from('installments')
      .insert(installments);

    if (instError) {
      alert(instError.message);
      return;
    }

    alert('تم حفظ العقد وتوليد الاستحقاقات ✅');
    loadAll();
  }

  /* =======================
     UI
  ======================= */

  return (
    <AppShell title="العقود">
      <div className="card dark">
        <h3>إضافة عقد</h3>

        <input placeholder="رقم العقد" value={contractNo} onChange={e => setContractNo(e.target.value)} />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

        <input
          type="number"
          placeholder="الإيجار الشهري"
          value={rentAmount}
          onChange={e => setRentAmount(+e.target.value)}
        />

        <select value={payFrequency} onChange={e => setPayFrequency(e.target.value as any)}>
          <option value="monthly">شهري</option>
          <option value="quarterly">ربع سنوي</option>
          <option value="yearly">سنوي</option>
        </select>

        <select value={propertyId} onChange={e => setPropertyId(e.target.value)}>
          <option value="">العقار</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.code}</option>
          ))}
        </select>

        <select value={tenantId} onChange={e => setTenantId(e.target.value)}>
          <option value="">المستأجر</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <button onClick={addContract}>حفظ</button>
      </div>
    </AppShell>
  );
}
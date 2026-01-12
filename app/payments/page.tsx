'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type InstallmentRowDB = {
  id: string;
  contract_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
};

type ContractDB = {
  id: string;
  contract_no: string;
  tenant_id: string;
  property_id: string;
};

type TenantDB = { id: string; name: string };
type PropertyDB = { id: string; code: string };

type InstallmentRowUI = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  contract_no: string;
  tenant_name: string;
  property_code: string;
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<InstallmentRowUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    // 1) get installments (no joins)
    const { data: inst, error: instErr } = await supabase
      .from('installments')
      .select('id, contract_id, due_date, amount, status')
      .order('due_date', { ascending: true });

    if (instErr) {
      console.error(instErr);
      setRows([]);
      setLoading(false);
      return;
    }

    const installments = (inst || []) as InstallmentRowDB[];

    if (installments.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // unique contract ids
    const contractIds = Array.from(new Set(installments.map(i => i.contract_id)));

    // 2) get contracts by ids
    const { data: cData, error: cErr } = await supabase
      .from('contracts')
      .select('id, contract_no, tenant_id, property_id')
      .in('id', contractIds);

    if (cErr) {
      console.error(cErr);
      setRows([]);
      setLoading(false);
      return;
    }

    const contracts = (cData || []) as ContractDB[];
    const contractMap = new Map<string, ContractDB>();
    contracts.forEach(c => contractMap.set(c.id, c));

    // tenant/property ids
    const tenantIds = Array.from(new Set(contracts.map(c => c.tenant_id).filter(Boolean)));
    const propertyIds = Array.from(new Set(contracts.map(c => c.property_id).filter(Boolean)));

    // 3) get tenants + properties
    const [{ data: tData, error: tErr }, { data: pData, error: pErr }] = await Promise.all([
      supabase.from('tenants').select('id, name').in('id', tenantIds),
      supabase.from('properties').select('id, code').in('id', propertyIds),
    ]);

    if (tErr) console.error(tErr);
    if (pErr) console.error(pErr);

    const tenants = (tData || []) as TenantDB[];
    const properties = (pData || []) as PropertyDB[];

    const tenantMap = new Map<string, string>();
    tenants.forEach(t => tenantMap.set(t.id, t.name));

    const propertyMap = new Map<string, string>();
    properties.forEach(p => propertyMap.set(p.id, p.code));

    // 4) build UI rows
    const uiRows: InstallmentRowUI[] = installments.map(i => {
      const c = contractMap.get(i.contract_id);

      return {
        id: i.id,
        due_date: i.due_date,
        amount: Number(i.amount),
        status: i.status,
        contract_no: c?.contract_no || '-',
        tenant_name: c?.tenant_id ? (tenantMap.get(c.tenant_id) || '-') : '-',
        property_code: c?.property_id ? (propertyMap.get(c.property_id) || '-') : '-',
      };
    });

    setRows(uiRows);
    setLoading(false);
  }

  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const paidCount = rows.filter(r => r.status === 'paid').length;

  return (
    <AppShell title="الاستحقاقات">
      <div className="page-header">
        <div>
          <h1>الاستحقاقات</h1>
          <p>متابعة الأقساط والمدفوعات</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>إجمالي الاستحقاقات</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{rows.length}</p>
            </div>
          </div>
          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>قادم</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{pendingCount}</p>
            </div>
          </div>
          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>مدفوع</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{paidCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          {loading ? (
            <p className="muted">جاري التحميل...</p>
          ) : rows.length === 0 ? (
            <p className="muted">لا توجد استحقاقات بعد</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم العقد</th>
                  <th>العقار</th>
                  <th>المستأجر</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.contract_no}</strong></td>
                    <td>{r.property_code}</td>
                    <td>{r.tenant_name}</td>
                    <td>{r.due_date}</td>
                    <td><strong>{r.amount}</strong></td>
                    <td>
                      {r.status === 'paid' && <span className="badge badge-success">مدفوع</span>}
                      {r.status === 'pending' && <span className="badge badge-warning">قادم</span>}
                      {r.status === 'late' && <span className="badge badge-danger">متأخر</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
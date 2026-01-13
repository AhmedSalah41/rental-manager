'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types
===================== */
type AlertRow = {
  id: string;
  due_date: string;
  amount: number;
  contract_no: string;
  tenant_name: string;
  isLate: boolean;
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    contracts: 0,
    pendingInstallments: 0,
  });

  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, []);

  /* =====================
     Load Stats
  ===================== */
  async function loadStats() {
    const { count: properties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: tenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: contracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    const { count: pendingInstallments } = await supabase
      .from('installments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStats({
      properties: properties || 0,
      tenants: tenants || 0,
      contracts: contracts || 0,
      pendingInstallments: pendingInstallments || 0,
    });
  }

  /* =====================
     Load Alerts (FIXED)
  ===================== */
  async function loadAlerts() {
  const today = new Date();
  const next5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('installments')
    .select(`
      id,
      due_date,
      amount,
      contracts:contract_id (
        contract_no,
        tenants:tenant_id ( name )
      )
    `)
    .eq('status', 'pending')
    .lte('due_date', next5Days.toISOString().slice(0, 10))
    .order('due_date', { ascending: true });

  if (error) {
    console.error(error);
    setAlerts([]);
    return;
  }

  // ✅ هنا الحل النهائي
  const normalized: AlertRow[] = (data ?? []).map((row: any) => {
    const contract = row.contracts?.[0]; // مهم جدًا

    const due = new Date(row.due_date);
    const isLate = due < today;

    return {
      id: row.id,
      due_date: row.due_date,
      amount: row.amount,
      contract_no: contract?.contract_no ?? '-',
      tenant_name: contract?.tenants?.name ?? '-',
      isLate,
    };
  });

  setAlerts(normalized); // ✅ ده السطر الوحيد المسموح
}
  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="لوحة التحكم">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على النظام</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="content-card" style={{ borderRight: '5px solid var(--warning-color)' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 12 }}>🔔 تنبيهات الاستحقاقات</h3>

            {alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  color: a.isLate ? 'var(--danger-color)' : 'inherit',
                }}
              >
                <strong>{a.contract_no}</strong> – {a.tenant_name}
                <br />
                قسط بقيمة <b>{a.amount.toLocaleString()}</b> بتاريخ {a.due_date}
                {a.isLate && <span style={{ marginRight: 8 }}>⚠️ متأخر</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid">
        <div className="card">
          <h4 className="muted">عدد العقارات</h4>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.properties}</p>
        </div>

        <div className="card">
          <h4 className="muted">عدد المستأجرين</h4>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.tenants}</p>
        </div>

        <div className="card">
          <h4 className="muted">عدد العقود</h4>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{stats.contracts}</p>
        </div>

        <div className="card">
          <h4 className="muted">استحقاقات قادمة</h4>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>
            {stats.pendingInstallments}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
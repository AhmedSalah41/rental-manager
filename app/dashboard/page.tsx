'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type AlertRow = {
  id: string;
  due_date: string;
  amount: number;
  contracts: {
    contract_no: string;
    tenants: {
      name: string;
    };
  };
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
     Load Alerts (Next 5 days + Late)
  ===================== */
  async function loadAlerts() {
    const today = new Date();
    const next5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const { data } = await supabase
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

    setAlerts(data || []);
  }

  return (
    <AppShell title="لوحة التحكم">
      {/* ===== Header ===== */}
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على النظام</p>
        </div>
      </div>

      {/* ===== Alerts ===== */}
      {alerts.length > 0 && (
        <div className="content-card" style={{ borderRight: '5px solid var(--warning-color)' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 12 }}>🔔 تنبيهات الاستحقاقات</h3>

            {alerts.map((a) => {
              const isLate = new Date(a.due_date) < new Date();

              return (
                <div
                  key={a.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #eee',
                    color: isLate ? 'var(--danger-color)' : 'inherit',
                  }}
                >
                  <strong>{a.contracts.contract_no}</strong> – {a.contracts.tenants.name}
                  <br />
                  قسط بقيمة <b>{a.amount.toLocaleString()}</b> بتاريخ {a.due_date}
                  {isLate && <span style={{ marginRight: 8 }}>⚠️ متأخر</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Stats ===== */}
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
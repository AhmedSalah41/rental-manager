'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    contracts: 0,
    pendingInstallments: 0,
  });

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [openAlerts, setOpenAlerts] = useState(false);

  /* =====================
     Load Data
  ===================== */
  useEffect(() => {
    loadStats();
    loadAlerts();
  }, []);

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
     Load Alerts
  ===================== */
  async function loadAlerts() {
    const today = new Date().toISOString().slice(0, 10);

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
      .order('due_date', { ascending: true })
      .limit(5);

    if (error) {
      console.error(error);
      setAlerts([]);
      return;
    }

    const normalized: AlertRow[] = (data ?? []).map((row: any) => ({
      id: row.id,
      due_date: row.due_date,
      amount: row.amount,
      contract_no: row.contracts?.contract_no ?? '-',
      tenant_name: row.contracts?.tenants?.name ?? '-',
      isLate: row.due_date < today,
    }));

    setAlerts(normalized);
  }

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="لوحة التحكم">
      {/* ===== Header ===== */}
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على النظام</p>
        </div>

        {/* 🔔 Notifications */}
        <div className="notif-wrapper">
          <button
            className="notif-btn"
            onClick={() => setOpenAlerts(prev => !prev)}
          >
            🔔
            {alerts.length > 0 && (
              <span className="notif-badge">{alerts.length}</span>
            )}
          </button>

          {openAlerts && (
            <div className="notif-dropdown">
              <h4 className="notif-title">تنبيهات الاستحقاق</h4>

              {alerts.length === 0 ? (
                <p className="muted">لا توجد تنبيهات</p>
              ) : (
                alerts.map(a => (
                  <div
                    key={a.id}
                    className={`notif-item ${a.isLate ? 'late' : ''}`}
                    onClick={() => router.push('/payments')}
                  >
                    <div className="notif-main">
                      <strong>{a.contract_no}</strong>
                      <span className="muted"> – {a.tenant_name}</span>
                    </div>
                    <small>
                      {a.isLate ? '⚠️ متأخر' : `موعده ${a.due_date}`}
                    </small>
                  </div>
                ))
              )}

              <div
                className="notif-footer"
                onClick={() => router.push('/payments')}
              >
                عرض كل الاستحقاقات
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Stats ===== */}
      <div className="grid">
        <div className="card">
          <h4 className="muted">عدد العقارات</h4>
          <p className="stat">{stats.properties}</p>
        </div>

        <div className="card">
          <h4 className="muted">عدد المستأجرين</h4>
          <p className="stat">{stats.tenants}</p>
        </div>

        <div className="card">
          <h4 className="muted">عدد العقود</h4>
          <p className="stat">{stats.contracts}</p>
        </div>

        <div className="card">
          <h4 className="muted">استحقاقات قادمة</h4>
          <p className="stat warning">{stats.pendingInstallments}</p>
        </div>
      </div>
    </AppShell>
  );
}
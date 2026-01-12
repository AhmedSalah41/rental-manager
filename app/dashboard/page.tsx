'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    contracts: 0,
    pendingInstallments: 0,
  });

  useEffect(() => {
    const load = async () => {
      const { count: properties } = await supabase.from('properties').select('*', { count: 'exact', head: true });
      const { count: tenants } = await supabase.from('tenants').select('*', { count: 'exact', head: true });
      const { count: contracts } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
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
    };
    load();
  }, []);

  return (
    <AppShell title="لوحة التحكم">
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على النظام</p>
        </div>
      </div>

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
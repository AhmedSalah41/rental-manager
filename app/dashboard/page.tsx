'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
    <AppShell>
      <div className="page-header">
        <div>
          <h1>لوحة التحكم</h1>
          <p>نظرة عامة على النظام</p>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>عدد العقارات</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{stats.properties}</p>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>عدد المستأجرين</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{stats.tenants}</p>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>عدد العقود</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{stats.contracts}</p>
            </div>
          </div>

          <div className="content-card" style={{ margin: 0 }}>
            <div className="card-body">
              <h3 style={{ color: 'var(--gray-color)' }}>استحقاقات قادمة</h3>
              <p style={{ fontSize: 28, fontWeight: 800 }}>{stats.pendingInstallments}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
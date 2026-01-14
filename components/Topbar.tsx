'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type AlertRow = {
  id: string;
  due_date: string;
  amount: number;
  contract_no: string;
  tenant_name: string;
};

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    const today = new Date();
    const monthBefore = new Date();
    monthBefore.setMonth(today.getMonth() + 1);

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
      .lte('due_date', monthBefore.toISOString().slice(0, 10))
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const normalized: AlertRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      due_date: r.due_date,
      amount: r.amount,
      contract_no: r.contracts?.contract_no ?? '-',
      tenant_name: r.contracts?.tenants?.name ?? '-',
    }));

    setAlerts(normalized);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar} aria-label="toggle menu">
          <i className="fas fa-bars" />
        </button>

        <div className="logo">
          <i className="fas fa-building" />
          <h1>منظِم</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* 🔔 Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="notif-btn" onClick={() => setOpen(!open)}>
            <i className="fas fa-bell" />
            {alerts.length > 0 && <span className="notif-badge">{alerts.length}</span>}
          </button>

          {open && (
            <div className="notif-dropdown">
              <h4 style={{ marginBottom: 10 }}>تنبيهات الاستحقاق</h4>

              {alerts.length === 0 ? (
                <p className="muted">لا توجد تنبيهات</p>
              ) : (
                alerts.map(a => (
                  <div
                    key={a.id}
                    className="notif-item"
                    onClick={() => {
                      setOpen(false);
                      router.push('/installments');
                    }}
                  >
                    <strong>{a.contract_no}</strong>
                    <div className="muted">{a.tenant_name}</div>
                    <small>ميعاده: {a.due_date}</small>
                  </div>
                ))
              )}

              <div
                style={{ textAlign: 'center', marginTop: 10, cursor: 'pointer' }}
                onClick={() => router.push('/installments')}
              >
                <strong>عرض كل الاستحقاقات</strong>
              </div>
            </div>
          )}
        </div>

        {/* 👤 Profile */}
        <button className="profile-btn" type="button">
          <img
            src="https://ui-avatars.com/api/?name=المدير&background=2c5aa0&color=fff"
            alt="user"
          />
          <span>المدير</span>
          <i className="fas fa-chevron-down" />
        </button>
      </div>
    </header>
  );
}
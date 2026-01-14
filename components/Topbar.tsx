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
  const [profileOpen, setProfileOpen] = useState(false);

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

  // دالة تسجيل الخروج
  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // إعادة التوجيه إلى صفحة تسجيل الدخول
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      alert('حدث خطأ أثناء تسجيل الخروج');
    }
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

        {/* 👤 Profile with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="profile-btn" 
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img
              src="https://ui-avatars.com/api/?name=المدير&background=2c5aa0&color=fff"
              alt="user"
            />
            <span>المدير</span>
            <i className="fas fa-chevron-down" />
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              width: '200px',
              marginTop: '8px',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                setProfileOpen(false);
                // يمكنك إضافة دالة للملف الشخصي هنا
              }}>
                <i className="fas fa-user" style={{ color: '#6b7280', width: '20px', textAlign: 'center' }} />
                <span style={{ fontSize: '14px', color: '#374151' }}>الملف الشخصي</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                setProfileOpen(false);
                // يمكنك إضافة دالة للإعدادات هنا
              }}>
                <i className="fas fa-cog" style={{ color: '#6b7280', width: '20px', textAlign: 'center' }} />
                <span style={{ fontSize: '14px', color: '#374151' }}>الإعدادات</span>
              </div>
              
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
              
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  color: '#ef4444'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt" style={{ color: '#ef4444', width: '20px', textAlign: 'center' }} />
                <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '500' }}>تسجيل الخروج</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* عند النقر خارج القائمة المنسدلة لإغلاقها */}
      {profileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setProfileOpen(false)}
        />
      )}
    </header>
  );
}
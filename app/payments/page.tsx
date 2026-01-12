'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types
===================== */
type InstallmentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
  contracts: {
    contract_no: string;
    tenants: { name: string }[];
    properties: { code: string }[];
  }[];
};

/* =====================
   Page
===================== */
export default function PaymentsPage() {
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    load();
  }, [filter]);

  /* =====================
     Load Data
  ===================== */
  const load = async () => {
    setLoading(true);

    let query = supabase
      .from('installments')
      .select(`
        id,
        due_date,
        amount,
        status,
        contracts (
          contract_no,
          tenants ( name ),
          properties ( code )
        )
      `)
      .order('due_date', { ascending: true });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  };

  /* =====================
     Helpers
  ===================== */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-EG');

  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);
  const paidCount = rows.filter((r) => r.status === 'paid').length;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="الاستحقاقات">
      {/* ===== Stats ===== */}
      <div className="content-card">
        <div
          className="card-body"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <Stat label="إجمالي الاستحقاقات" value={rows.length} />
          <Stat label="مدفوع" value={paidCount} />
          <Stat label="قادم" value={pendingCount} />
          <Stat label="إجمالي المبلغ" value={totalAmount.toLocaleString()} />
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="content-card">
        <div className="card-body" style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            الكل
          </button>
          <button
            className={`btn ${
              filter === 'pending' ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setFilter('pending')}
          >
            قادم
          </button>
          <button
            className={`btn ${
              filter === 'paid' ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setFilter('paid')}
          >
            مدفوع
          </button>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="content-card">
        <div className="card-body">
          {loading ? (
            <p className="muted">جاري التحميل...</p>
          ) : rows.length === 0 ? (
            <p className="muted">لا توجد استحقاقات</p>
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
                {rows.map((r) => {
                  const contract = r.contracts?.[0];

                  return (
                    <tr key={r.id}>
                      <td>{contract?.contract_no || '-'}</td>
                      <td>{contract?.properties?.[0]?.code || '-'}</td>
                      <td>{contract?.tenants?.[0]?.name || '-'}</td>
                      <td>{formatDate(r.due_date)}</td>
                      <td>{r.amount.toLocaleString()}</td>
                      <td>
                        {r.status === 'paid' && (
                          <span className="badge badge-success">مدفوع</span>
                        )}
                        {r.status === 'pending' && (
                          <span className="badge badge-warning">قادم</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* =====================
   Small Component
===================== */
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="content-card" style={{ margin: 0 }}>
      <div className="card-body">
        <h4 style={{ color: 'var(--gray-color)' }}>{label}</h4>
        <p style={{ fontSize: 26, fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  );
}
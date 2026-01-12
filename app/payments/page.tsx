'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type InstallmentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
  contracts: {
    contract_no: string;
    tenants: { name: string }[];
    properties: { code: string }[];
  } | null;
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'late'>('all');

  /* ======================
     Fetch Installments
  ====================== */
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    const { data } = await supabase
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

    setRows(data || []);
    setLoading(false);
  };

  /* ======================
     Derived Data
  ====================== */
  const today = new Date();

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const due = new Date(r.due_date);

      if (filter === 'paid') return r.status === 'paid';
      if (filter === 'pending') return r.status === 'pending';
      if (filter === 'late') return r.status === 'pending' && due < today;

      return true;
    });
  }, [rows, filter]);

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const paidAmount = rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const remainingAmount = totalAmount - paidAmount;

  /* ======================
     Pay Installment
  ====================== */
  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', id);

    if (!error) load();
  };

  /* ======================
     UI
  ====================== */
  return (
    <AppShell title="الاستحقاقات">

      {/* ===== Summary ===== */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>إجمالي الاستحقاقات</span>
          <strong>{totalAmount.toLocaleString('ar-EG')}</strong>
        </div>

        <div className="stat-card success">
          <span>مدفوع</span>
          <strong>{paidAmount.toLocaleString('ar-EG')}</strong>
        </div>

        <div className="stat-card warning">
          <span>المتبقي</span>
          <strong>{remainingAmount.toLocaleString('ar-EG')}</strong>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div className="filters">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>الكل</button>
        <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>قادم</button>
        <button onClick={() => setFilter('late')} className={filter === 'late' ? 'active' : ''}>متأخر</button>
        <button onClick={() => setFilter('paid')} className={filter === 'paid' ? 'active' : ''}>مدفوع</button>
      </div>

      {/* ===== Table ===== */}
      <div className="content-card">
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم العقد</th>
                <th>العقار</th>
                <th>المستأجر</th>
                <th>تاريخ الاستحقاق</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>

              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>جاري التحميل...</td>
                </tr>
              )}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>لا توجد بيانات</td>
                </tr>
              )}

              {filteredRows.map((r) => {
                const due = new Date(r.due_date);
                const isLate = r.status === 'pending' && due < today;

                return (
                  <tr key={r.id}>
                    <td>{r.contracts?.contract_no || '-'}</td>
                    <td>{r.contracts?.properties?.[0]?.code || '-'}</td>
                    <td>{r.contracts?.tenants?.[0]?.name || '-'}</td>
                    <td>{r.due_date}</td>
                    <td>{r.amount.toLocaleString('ar-EG')}</td>
                    <td>
                      {r.status === 'paid' && <span className="badge badge-success">مدفوع</span>}
                      {r.status === 'pending' && !isLate && <span className="badge badge-warning">قادم</span>}
                      {isLate && <span className="badge badge-danger">متأخر</span>}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button className="btn btn-outline" onClick={() => markAsPaid(r.id)}>
                          تحصيل
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

    </AppShell>
  );
}
'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types
===================== */
type PaymentRow = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
  contract_no: string;
  tenant_name: string;
  property_code: string;
};

/* =====================
   Page
===================== */
export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  /* =====================
     Load Payments (FIXED)
  ===================== */
  async function loadPayments() {
    setLoading(true);

    const { data, error } = await supabase
      .from('installments')
      .select(`
        id,
        due_date,
        amount,
        status,
        contracts:contract_id (
          contract_no,
          tenants:tenant_id ( name ),
          properties:property_id ( code )
        )
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    // ✅ تطبيع صحيح (OBJECT مش ARRAY)
    const normalized: PaymentRow[] = (data ?? []).map((row: any) => ({
      id: row.id,
      due_date: row.due_date,
      amount: row.amount,
      status: row.status,
      contract_no: row.contracts?.contract_no ?? '-',
      tenant_name: row.contracts?.tenants?.name ?? '-',
      property_code: row.contracts?.properties?.code ?? '-',
    }));

    setRows(normalized);
    setLoading(false);
  }

  /* =====================
     Pay
  ===================== */
  async function markAsPaid(id: string) {
    await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', id);

    loadPayments();
  }

  /* =====================
     Filters & Totals
  ===================== */
  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.amount, 0),
    [rows]
  );

  const paid = useMemo(
    () => rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    [rows]
  );

  const remaining = total - paid;

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="الاستحقاقات">
      {/* Summary */}
      <div className="content-card">
        <div className="card-body" style={{ display: 'flex', gap: 24 }}>
          <div>الإجمالي: <b>{total.toLocaleString()}</b></div>
          <div>المدفوع: <b>{paid.toLocaleString()}</b></div>
          <div>المتبقي: <b>{remaining.toLocaleString()}</b></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => setFilter('all')}>الكل</button>
        <button className="btn btn-outline" onClick={() => setFilter('pending')}>القادمة</button>
        <button className="btn btn-outline" onClick={() => setFilter('paid')}>المدفوعة</button>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="card-body">
          {loading ? (
            <p>جاري التحميل...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>العقد</th>
                  <th>العقار</th>
                  <th>المستأجر</th>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(r => (
                  <tr key={r.id}>
                    <td>{r.contract_no}</td>
                    <td>{r.property_code}</td>
                    <td>{r.tenant_name}</td>
                    <td>{r.due_date}</td>
                    <td>{r.amount.toLocaleString()}</td>
                    <td>
                      {r.status === 'paid'
                        ? <span className="badge badge-success">مدفوع</span>
                        : <span className="badge badge-warning">قادم</span>}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button className="btn btn-primary" onClick={() => markAsPaid(r.id)}>
                          دفع
                        </button>
                      )}
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
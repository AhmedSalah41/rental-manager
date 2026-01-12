'use client';

import AppShell from '@/components/AppShell';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* =====================
   Types (بعد التطبيع)
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
     Load Payments
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
        contracts (
          contract_no,
          tenants ( name ),
          properties ( code )
        )
      `)
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    // ✅ تطبيع الداتا (حل نهائي للمشكلة)
    const normalized: PaymentRow[] = (data ?? []).map((row: any) => {
      const contract = row.contracts?.[0];

      return {
        id: row.id,
        due_date: row.due_date,
        amount: row.amount,
        status: row.status,
        contract_no: contract?.contract_no || '-',
        tenant_name: contract?.tenants?.[0]?.name || '-',
        property_code: contract?.properties?.[0]?.code || '-',
      };
    });

    setRows(normalized);
    setLoading(false);
  }

  /* =====================
     Pay Installment
  ===================== */
  async function markAsPaid(id: string) {
    const { error } = await supabase
      .from('installments')
      .update({ status: 'paid' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    loadPayments();
  }

  /* =====================
     Filters & Totals
  ===================== */
  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, r) => sum + r.amount, 0),
    [rows]
  );

  const paidAmount = useMemo(
    () => rows.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    [rows]
  );

  const remainingAmount = totalAmount - paidAmount;

  /* =====================
     UI
  ===================== */
  return (
    <AppShell title="الاستحقاقات">
      {/* ===== Summary ===== */}
      <div className="content-card">
        <div className="card-body" style={{ display: 'flex', gap: 24 }}>
          <div>
            <strong>الإجمالي:</strong> {totalAmount.toLocaleString()}
          </div>
          <div>
            <strong>المدفوع:</strong> {paidAmount.toLocaleString()}
          </div>
          <div>
            <strong>المتبقي:</strong> {remainingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-outline" onClick={() => setFilter('all')}>
          الكل
        </button>
        <button className="btn btn-outline" onClick={() => setFilter('pending')}>
          القادمة
        </button>
        <button className="btn btn-outline" onClick={() => setFilter('paid')}>
          المدفوعة
        </button>
      </div>

      {/* ===== Table ===== */}
      <div className="content-card">
        <div className="card-body">
          {loading ? (
            <p className="muted">جاري التحميل...</p>
          ) : filteredRows.length === 0 ? (
            <p className="muted">لا توجد بيانات</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>العقد</th>
                  <th>العقار</th>
                  <th>المستأجر</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.contract_no}</td>
                    <td>{r.property_code}</td>
                    <td>{r.tenant_name}</td>
                    <td>{r.due_date}</td>
                    <td>{r.amount.toLocaleString()}</td>
                    <td>
                      {r.status === 'paid' ? (
                        <span className="badge badge-success">مدفوع</span>
                      ) : (
                        <span className="badge badge-warning">قادم</span>
                      )}
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => markAsPaid(r.id)}
                        >
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